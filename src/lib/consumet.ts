const CONSUMET_URL = "https://api.consumet.org";

export interface ConsumetSearchResult {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string | null;
  subOrDub: string;
}

export interface ConsumetEpisode {
  id: string;
  number: number;
  url: string;
  title?: string;
}

export interface ConsumetAnimeInfo {
  id: string;
  title: string;
  image: string;
  releaseDate: string | null;
  episodes: ConsumetEpisode[];
}

export interface ConsumetSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export type ConsumetAnilistProvider =
  | "9anime"
  | "animefox"
  | "animepahe"
  | "bilibili"
  | "crunchyroll"
  | "enime"
  | "gogoanime"
  | "marin"
  | "zoro";

export interface ConsumetMetaEpisode {
  id: string;
  title?: string;
  episode: number;
}

export interface ConsumetMetaAnimeInfo {
  id: string;
  title: string | string[];
  image?: string;
  description?: string;
  genres?: string[];
  episodes: ConsumetMetaEpisode[];
}

async function consumetFetch<T = any>(path: string) {
  const res = await fetch(`${CONSUMET_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Consumet request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function normalizeSearchResult(item: any): ConsumetSearchResult {
  return {
    id: String(item.id ?? item.slug ?? item._id ?? item.url ?? ""),
    title: item.title ?? item.name ?? "",
    url: item.url ?? item.link ?? "",
    image: item.image ?? item.cover ?? item.poster ?? "",
    releaseDate: item.releaseDate ?? item.year ?? null,
    subOrDub: item.subOrDub ?? item.type ?? item.language ?? "SUB",
  };
}

export async function searchConsumeat(animeName: string): Promise<ConsumetSearchResult[]> {
  const encoded = encodeURIComponent(animeName.trim());
  const payload = await consumetFetch<any>(`/anime/gogoanime/${encoded}`);
  const results = Array.isArray(payload) ? payload : payload.results ?? payload.data ?? [];
  return results.map(normalizeSearchResult).filter((item: ConsumetSearchResult) => item.id && item.title);
}

export async function getAnimeInfo(animeId: string): Promise<ConsumetAnimeInfo> {
  const payload = await consumetFetch<any>(`/anime/gogoanime/info/${encodeURIComponent(animeId)}`);
  const episodes = Array.isArray(payload.episodes)
    ? payload.episodes.map((episode: any) => ({
        id: String(episode.id ?? episode.episodeId ?? episode._id ?? episode.url ?? ""),
        number: Number(episode.number ?? episode.episode ?? episode.ep ?? 0),
        url: episode.url ?? episode.link ?? "",
        title: episode.title ?? episode.name ?? `Episode ${episode.number ?? "?"}`,
      }))
    : [];

  return {
    id: String(payload.id ?? payload._id ?? animeId),
    title: payload.title ?? payload.name ?? "",
    image: payload.image ?? payload.cover ?? payload.poster ?? "",
    releaseDate: payload.releaseDate ?? payload.year ?? null,
    episodes,
  };
}

export async function getEpisodeSources(episodeId: string): Promise<ConsumetSource[]> {
  const payload = await consumetFetch<any>(`/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`);
  const sources = Array.isArray(payload.sources)
    ? payload.sources
    : payload.result?.sources ?? payload.data?.sources ?? [];

  return sources
    .filter((source: any) => source?.url)
    .map((source: any) => ({
      url: source.url,
      quality: String(source.quality ?? source.qualityLabel ?? "default"),
      isM3U8: String(source.url).includes(".m3u8") || !!source.isM3U8,
    }));
}

function normalizeMetaEpisodes(value: unknown): ConsumetMetaEpisode[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((ep: any) => ({
      id: String(ep?.id ?? ""),
      title: ep?.title ?? undefined,
      episode: Number(ep?.episode ?? ep?.number ?? 0),
    }))
    .filter((ep) => ep.id && Number.isFinite(ep.episode) && ep.episode > 0)
    .sort((a, b) => a.episode - b.episode);
}

function normalizeMetaTitle(title: unknown): string {
  if (typeof title === "string") return title;
  if (Array.isArray(title)) {
    const first = title.find((t) => typeof t === "string" && t.trim().length > 0);
    return typeof first === "string" ? first : "Anime";
  }
  return "Anime";
}

/**
 * Meta provider: AniList -> streaming mapping.
 * Uses `provider` to choose the upstream (zoro, animepahe, gogoanime, etc).
 *
 * Route: /meta/anilist/info/{id}?provider={provider}
 */
export async function getAnilistMetaInfo(
  anilistId: number,
  provider: ConsumetAnilistProvider = "zoro",
): Promise<ConsumetMetaAnimeInfo> {
  const payload = await consumetFetch<any>(
    `/meta/anilist/info/${encodeURIComponent(String(anilistId))}?provider=${encodeURIComponent(provider)}`,
  );

  return {
    id: String(payload?.id ?? anilistId),
    title: payload?.title ?? "Anime",
    image: payload?.image ?? undefined,
    description: payload?.description ?? undefined,
    genres: Array.isArray(payload?.genres) ? payload.genres : undefined,
    episodes: normalizeMetaEpisodes(payload?.episodes),
  };
}

/**
 * Meta provider episode sources.
 *
 * Route: /meta/anilist/watch/{episodeId}
 */
export async function getAnilistEpisodeSources(episodeId: string): Promise<ConsumetSource[]> {
  const payload = await consumetFetch<any>(`/meta/anilist/watch/${encodeURIComponent(episodeId)}`);
  const sources = Array.isArray(payload?.sources) ? payload.sources : payload?.data?.sources ?? [];

  return sources
    .filter((source: any) => source?.url)
    .map((source: any) => ({
      url: source.url,
      quality: String(source.quality ?? source.qualityLabel ?? "default"),
      isM3U8: String(source.url).includes(".m3u8") || !!source.isM3U8,
    }));
}

export function getMetaDisplayTitle(meta: ConsumetMetaAnimeInfo): string {
  return normalizeMetaTitle(meta.title);
}
