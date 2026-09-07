'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LIBRARY_STORAGE_EVENT,
  LIBRARY_KEYS,
  notifyLibraryStorageUpdated,
  readContinueWatching,
  readWatchedHistory,
  writeContinueWatching,
  writeWatchedHistory,
} from '@/utils/libraryStorage';

const API_URL = process.env.NEXT_PUBLIC_WATCH_PARTY_URL || 'https://signparty.party';
const LOG = (...args: unknown[]) => console.log('[LibrarySync]', ...args);

type LibraryStatus = 'want-to-watch' | 'watching' | 'completed' | 'dropped';

interface ServerLibraryItem {
  tmdbId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string;
  status: LibraryStatus;
  isFavorite: boolean;
  rating?: number | null;
  updatedAt?: string;
}

let serverItemsCache: ServerLibraryItem[] = [];

function parseJson(raw: string | null): any[] {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

function toSafePoster(path: unknown): string | undefined {
  if (typeof path === 'string' && path.startsWith('/') && path.length <= 200) return path;
  return undefined;
}

async function pullFromServer(token: string) {
  LOG('pull starting...');
  const res = await fetch(`${API_URL}/social/me/library-home?limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    LOG('pull FAILED', res.status, await res.text().catch(() => ''));
    return;
  }

  const data = await res.json();
  const serverItems: ServerLibraryItem[] = data?.library?.items ?? [];
  LOG('pull got', serverItems.length, 'items from server');
  serverItemsCache = serverItems;

  if (serverItems.length === 0) return;

  let didWrite = false;

  const localWatchlist = parseJson(localStorage.getItem(LIBRARY_KEYS.watchlist));
  const localWatchlistKeys = new Set(
    localWatchlist.map((i: { media_id: number; media_type: string }) => `${i.media_id}-${i.media_type}`)
  );
  const newWatchlist = serverItems
    .filter((i) => i.status === 'want-to-watch' && !localWatchlistKeys.has(`${i.tmdbId}-${i.contentType}`))
    .map((i) => ({
      id: crypto.randomUUID(),
      media_id: i.tmdbId,
      media_type: i.contentType,
      title: i.title,
      poster_path: i.posterPath ?? null,
      created_at: i.updatedAt ?? new Date().toISOString(),
    }));
  if (newWatchlist.length > 0) {
    LOG('pull merging', newWatchlist.length, 'want-to-watch items into local watchlist');
    localStorage.setItem(LIBRARY_KEYS.watchlist, JSON.stringify([...newWatchlist, ...localWatchlist]));
    didWrite = true;
  }

  const localContinue = readContinueWatching();
  const localContinueKeys = new Set(localContinue.map((i) => `${i.id}-${i.media_type}`));
  const newContinue = serverItems
    .filter((i) => i.status === 'watching' && !localContinueKeys.has(`${i.tmdbId}-${i.contentType}`))
    .map((i) => ({ id: i.tmdbId, media_type: i.contentType, title: i.title, poster_path: i.posterPath ?? null }));
  if (newContinue.length > 0) {
    writeContinueWatching([...newContinue, ...localContinue]);
    didWrite = true;
  }

  const localHistory = readWatchedHistory();
  const localHistoryKeys = new Set(localHistory.map((i) => `${i.id}-${i.media_type}`));
  const newHistory = serverItems
    .filter((i) => i.status === 'completed' && !localHistoryKeys.has(`${i.tmdbId}-${i.contentType}`))
    .map((i) => ({ id: i.tmdbId, media_type: i.contentType, title: i.title, poster_path: i.posterPath ?? null, watchedAt: i.updatedAt }));
  if (newHistory.length > 0) {
    writeWatchedHistory([...newHistory, ...localHistory]);
    didWrite = true;
  }

  if (didWrite) notifyLibraryStorageUpdated(LIBRARY_KEYS.watchlist);
  LOG('pull done. cache size:', serverItemsCache.length);
}

async function pushToServer(token: string, reason = 'unknown') {
  const localWatchlist = parseJson(localStorage.getItem(LIBRARY_KEYS.watchlist));
  const localContinue = readContinueWatching();
  const localHistory = readWatchedHistory();
  LOG(
    `push triggered (reason: ${reason}) — watchlist: ${localWatchlist.length}, continueWatching: ${localContinue.length}, history: ${localHistory.length}, server cache: ${serverItemsCache.length}`
  );

  const seen = new Set<string>();
  const items: ServerLibraryItem[] = [];

  // 1. want-to-watch — from local watchlist
  for (const item of localWatchlist) {
    if (!item.media_id || !item.media_type) continue;
    const key = `${item.media_id}-${item.media_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const poster = toSafePoster(item.poster_path);
    items.push({
      tmdbId: Number(item.media_id),
      contentType: item.media_type as 'movie' | 'tv',
      title: String(item.title || 'Unknown').slice(0, 512),
      status: 'want-to-watch',
      isFavorite: false,
      ...(poster ? { posterPath: poster } : {}),
      ...(item.created_at ? { updatedAt: item.created_at } : {}),
    });
  }

  // 2. watching — from local continueWatching (web player writes here when user plays something)
  for (const item of localContinue) {
    if (!item.id || !item.media_type) continue;
    const key = `${item.id}-${item.media_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const poster = toSafePoster(item.poster_path);
    items.push({
      tmdbId: Number(item.id),
      contentType: item.media_type as 'movie' | 'tv',
      title: String(item.title || 'Unknown').slice(0, 512),
      status: 'watching',
      isFavorite: false,
      ...(poster ? { posterPath: poster } : {}),
    });
  }

  // 3. completed — from local watchedHistory
  for (const item of localHistory) {
    if (!item.id || !item.media_type) continue;
    const key = `${item.id}-${item.media_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const poster = toSafePoster((item as { poster_path?: unknown }).poster_path);
    items.push({
      tmdbId: Number(item.id),
      contentType: item.media_type as 'movie' | 'tv',
      title: String(item.title || item.name || 'Unknown').slice(0, 512),
      status: 'completed',
      isFavorite: false,
      ...(poster ? { posterPath: poster } : {}),
    });
  }

  // 4. everything else from server cache (mobile's watching/completed not already covered above)
  for (const item of serverItemsCache) {
    const key = `${item.tmdbId}-${item.contentType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const poster = toSafePoster(item.posterPath);
    items.push({
      tmdbId: item.tmdbId,
      contentType: item.contentType,
      title: String(item.title || 'Unknown').slice(0, 512),
      status: item.status,
      isFavorite: item.isFavorite ?? false,
      ...(item.rating != null ? { rating: item.rating } : {}),
      ...(poster ? { posterPath: poster } : {}),
      ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}),
    });
  }

  if (items.length === 0) {
    LOG('push skipped — nothing to send');
    return;
  }

  LOG(`pushing ${items.length} items to server...`, items.map(i => `${i.contentType}:${i.tmdbId}(${i.status})`));

  const res = await fetch(`${API_URL}/social/library/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[LibrarySync] push FAILED', res.status, body);
  } else {
    LOG(`push OK — ${items.length} items saved to server`);
    // Update cache to reflect new server state
    serverItemsCache = items;
  }
}

export default function ServerLibrarySync() {
  const { user, token } = useAuth();
  const hasPulledRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  LOG('render — user:', user?.email ?? 'none', 'token:', token ? 'present' : 'none', 'hasPulled:', hasPulledRef.current);

  useEffect(() => {
    LOG('mount effect — user:', user?.email ?? 'none');
    if (!user || !token || hasPulledRef.current) return;
    hasPulledRef.current = true;
    pullFromServer(token)
      .then(() => pushToServer(token, 'initial-login'))
      .catch((e) => console.error('[LibrarySync] pull/push error', e));
  }, [user, token]);

  useEffect(() => {
    if (!user) {
      LOG('logout — clearing cache');
      hasPulledRef.current = false;
      serverItemsCache = [];
    }
  }, [user]);

  useEffect(() => {
    if (!user || !token) {
      LOG('sync NOT active — no user/token');
      return;
    }

    LOG('activating sync — intercepting localStorage writes');
    const schedule = (reason: string) => {
      LOG('change detected via', reason, '— scheduling push in 2s');
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        pushToServer(token, reason).catch((e) => console.error('[LibrarySync] push error', e));
      }, 2000);
    };

    // Primary: intercept localStorage.setItem so we catch every write to any library key,
    // regardless of whether the caller dispatches the custom event.
    const TRACKED_KEYS = new Set<string>([LIBRARY_KEYS.watchlist, LIBRARY_KEYS.continueWatching, LIBRARY_KEYS.watchedHistory]);
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (TRACKED_KEYS.has(key)) schedule(`localStorage.setItem(${key})`);
    };

    // Secondary: keep the custom event listener as a backup
    const handler = () => schedule('custom-event');
    window.addEventListener(LIBRARY_STORAGE_EVENT, handler);
    // Cross-tab changes
    const crossTabHandler = (e: StorageEvent) => {
      if (e.key === LIBRARY_KEYS.watchlist) schedule('storage-cross-tab');
    };
    window.addEventListener('storage', crossTabHandler);

    return () => {
      LOG('deactivating sync');
      Storage.prototype.setItem = originalSetItem;
      window.removeEventListener(LIBRARY_STORAGE_EVENT, handler);
      window.removeEventListener('storage', crossTabHandler);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [user, token]);

  return null;
}
