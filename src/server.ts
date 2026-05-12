import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const maybeProxyResponse = await handleProxyRequest(request);
      if (maybeProxyResponse) return maybeProxyResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};

const MAX_UPSTREAM_URL_LENGTH = 4096;

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0") return true;
  if (host.endsWith(".local")) return true;
  if (host === "[::1]" || host === "::1") return true;

  // IPv4 private ranges
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  return false;
}

function parseUpstreamUrl(raw: string): URL {
  if (!raw || raw.length > MAX_UPSTREAM_URL_LENGTH) {
    throw new Error("Invalid upstream URL.");
  }
  const decoded = decodeURIComponent(raw);
  const url = new URL(decoded);
  if (url.username || url.password) {
    throw new Error("Upstream URL may not include credentials.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Upstream URL protocol not allowed.");
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error("Upstream host not allowed.");
  }
  return url;
}

function getProxyUrl(pathname: "/api/hls" | "/api/stream", upstream: URL): string {
  return `${pathname}?url=${encodeURIComponent(upstream.toString())}`;
}

function rewriteHlsPlaylist(playlistText: string, playlistUrl: URL): string {
  const lines = playlistText.split(/\r?\n/);

  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Rewrite URI="..." attributes (EXT-X-KEY, EXT-X-MAP, etc.)
    if (trimmed.startsWith("#") && trimmed.includes('URI="')) {
      return line.replace(/URI="([^"]+)"/g, (_match, uriValue) => {
        try {
          const abs = new URL(uriValue, playlistUrl);
          const isPlaylist = abs.pathname.endsWith(".m3u8");
          const proxied = getProxyUrl(isPlaylist ? "/api/hls" : "/api/stream", abs);
          return `URI="${proxied}"`;
        } catch {
          return `URI="${uriValue}"`;
        }
      });
    }

    // Non-comment line => segment/variant playlist URL
    if (!trimmed.startsWith("#")) {
      try {
        const abs = new URL(trimmed, playlistUrl);
        const isPlaylist = abs.pathname.endsWith(".m3u8");
        return getProxyUrl(isPlaylist ? "/api/hls" : "/api/stream", abs);
      } catch {
        return line;
      }
    }

    return line;
  });

  return rewritten.join("\n");
}

async function proxyFetch(upstream: URL, request: Request): Promise<Response> {
  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("range", range);

  const upstreamRes = await fetch(upstream.toString(), {
    method: "GET",
    headers,
    redirect: "follow",
  });

  const resHeaders = new Headers(upstreamRes.headers);
  // Make playable cross-origin
  resHeaders.set("access-control-allow-origin", "*");
  resHeaders.delete("set-cookie");

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

async function handleProxyRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/hls" && url.pathname !== "/api/stream") return null;

  const rawUpstream = url.searchParams.get("url");
  if (!rawUpstream) {
    return new Response("Missing url parameter.", { status: 400 });
  }

  let upstream: URL;
  try {
    upstream = parseUpstreamUrl(rawUpstream);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid upstream URL.", { status: 400 });
  }

  // Only GET is supported.
  if (request.method !== "GET") {
    return new Response("Method not allowed.", { status: 405 });
  }

  if (url.pathname === "/api/stream") {
    return proxyFetch(upstream, request);
  }

  // /api/hls: fetch playlist as text, rewrite references through proxy.
  const upstreamRes = await fetch(upstream.toString(), {
    method: "GET",
    redirect: "follow",
  });
  if (!upstreamRes.ok) {
    return new Response(`Upstream playlist error: ${upstreamRes.status}`, { status: 502 });
  }
  const text = await upstreamRes.text();
  const rewritten = rewriteHlsPlaylist(text, upstream);
  return new Response(rewritten, {
    status: 200,
    headers: {
      "content-type": "application/vnd.apple.mpegurl; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}
