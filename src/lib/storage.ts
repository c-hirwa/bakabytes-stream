import type { AnimeMedia } from "./anilist";

export interface WatchHistoryItem {
  animeId: number;
  animeTitle: string;
  animeCover: string;
  episodeNumber: number;
  episodeTitle: string;
  watchedAt: number;
  progress: number;
}

const FAVORITES_KEY = "favorites";
const HISTORY_KEY = "watch_history";

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites(): AnimeMedia[] {
  return readLocalStorage<AnimeMedia[]>(FAVORITES_KEY, []);
}

export function addFavorite(anime: AnimeMedia): void {
  const items = getFavorites();
  if (!items.some((item) => item.id === anime.id)) {
    items.unshift(anime);
    writeLocalStorage(FAVORITES_KEY, items);
  }
}

export function removeFavorite(animeId: number): void {
  const items = getFavorites().filter((item) => item.id !== animeId);
  writeLocalStorage(FAVORITES_KEY, items);
}

export function isFavorite(animeId: number): boolean {
  return getFavorites().some((item) => item.id === animeId);
}

export function getWatchHistory(): WatchHistoryItem[] {
  return readLocalStorage<WatchHistoryItem[]>(HISTORY_KEY, []);
}

export function addToWatchHistory(item: WatchHistoryItem): void {
  const history = getWatchHistory();
  const existingIndex = history.findIndex((entry) => entry.animeId === item.animeId);
  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }
  history.unshift(item);
  writeLocalStorage(HISTORY_KEY, history.slice(0, 30));
}

export function getAnimeProgress(animeId: number): number {
  const historyItem = getWatchHistory().find((item) => item.animeId === animeId);
  return historyItem?.progress ?? 0;
}
