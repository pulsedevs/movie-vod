'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Watched episodes, per show, in this browser: { [tvId]: ["s:e", ...] } under `lp:watched`.
 * Marked by the eye on an episode card, "Mark watched" for a season, or by the player when an
 * episode is (nearly) finished. Every hook on the page updates together (custom event + storage).
 */
const KEY = 'lp:watched';
const EVENT = 'lp:watched';

type Store = Record<string, string[]>;

const epKey = (s: number, e: number) => `${s}:${e}`;

function read(): Store {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' ? (v as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode / full */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Mark (or unmark) episodes of a show. */
export function setWatched(tvId: number, eps: Array<{ s: number; e: number }>, on: boolean) {
  const store = read();
  const set = new Set(store[tvId] ?? []);
  for (const { s, e } of eps) (on ? set.add(epKey(s, e)) : set.delete(epKey(s, e)));
  if (set.size) store[tvId] = [...set];
  else delete store[tvId];
  write(store);
}

export function markWatched(tvId: number, s: number, e: number) {
  if (!read()[tvId]?.includes(epKey(s, e))) setWatched(tvId, [{ s, e }], true);
}

/** Saved player position (seconds) of an episode, 0 if none. */
export function savedPosition(tvId: number, s: number, e: number): number {
  try {
    const n = parseFloat(localStorage.getItem(`lp:pos:tv:${tvId}:${s}:${e}`) || '0');
    return isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** The show's watched episodes; empty until mounted (server render has none). */
export function useWatched(tvId: number) {
  const [keys, setKeys] = useState<Set<string>>(() => new Set());
  // Bumped on any change, so positions (progress bars) are re-read too.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const sync = () => {
      setKeys(new Set(read()[tvId] ?? []));
      setVersion((v) => v + 1);
    };
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === KEY || e.key.startsWith('lp:pos:')) sync();
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, [tvId]);

  const has = useCallback((s: number, e: number) => keys.has(epKey(s, e)), [keys]);
  const toggle = useCallback((s: number, e: number) => setWatched(tvId, [{ s, e }], !keys.has(epKey(s, e))), [tvId, keys]);
  const setMany = useCallback((eps: Array<{ s: number; e: number }>, on: boolean) => setWatched(tvId, eps, on), [tvId]);

  return { has, toggle, setMany, version };
}
