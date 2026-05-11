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
  return results.map(normalizeSearchResult).filter((item) => item.id && item.title);
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
