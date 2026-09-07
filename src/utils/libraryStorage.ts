export const LIBRARY_STORAGE_EVENT = 'boredflix-library-update';

export const LIBRARY_KEYS = {
  continueWatching: 'continueWatching',
  watchedHistory: 'watchedHistory',
  watchlist: 'watchlist',
  watchHistory: 'watchHistory',
} as const;

export interface ContinueWatchingItem {
  id: number | string;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  progress?: number;
  season?: number;
  episode?: number;
}

export interface WatchedHistoryItem {
  id: number | string;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string | null;
  watchedAt?: string;
}

/** Same-tab signal so panels re-read localStorage after writes. */
export function notifyLibraryStorageUpdated(key?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LIBRARY_STORAGE_EVENT, { detail: { key } }));
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function readContinueWatching(limit?: number): ContinueWatchingItem[] {
  if (typeof window === 'undefined') return [];
  const items = parseArray<ContinueWatchingItem>(
    localStorage.getItem(LIBRARY_KEYS.continueWatching)
  );
  return limit ? items.slice(0, limit) : items;
}

export function readWatchedHistory(limit?: number): WatchedHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const items = parseArray<WatchedHistoryItem>(
    localStorage.getItem(LIBRARY_KEYS.watchedHistory)
  );
  return limit ? items.slice(0, limit) : items;
}

export function writeContinueWatching(items: ContinueWatchingItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LIBRARY_KEYS.continueWatching, JSON.stringify(items));
  notifyLibraryStorageUpdated(LIBRARY_KEYS.continueWatching);
}

export function writeWatchedHistory(items: WatchedHistoryItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LIBRARY_KEYS.watchedHistory, JSON.stringify(items));
  notifyLibraryStorageUpdated(LIBRARY_KEYS.watchedHistory);
}
