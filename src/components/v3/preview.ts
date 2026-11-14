'use client';

import { useEffect, useState } from 'react';

/** Trailer, title art and runtime of one title (see /api/media/preview). */
export interface Preview {
  trailerKey: string | null;
  logoPath: string | null;
  /** Minutes; for a show, one episode. */
  runtime: number | null;
  backdropPath: string | null;
  title: string | null;
}

// One request per title per page load, shared by every card that asks.
const cache = new Map<string, Promise<Preview | null>>();

export function loadPreview(type: 'movie' | 'tv', id: number | string): Promise<Preview | null> {
  const key = `${type}:${id}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/media/preview?type=${type}&id=${id}`)
      .then((r) => (r.ok ? (r.json() as Promise<Preview>) : null))
      .catch(() => null);
    cache.set(key, p);
  }
  return p;
}

export function usePreview(type: 'movie' | 'tv', id: number | string, enabled = true): Preview | null {
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadPreview(type, id).then((p) => alive && setPreview(p));
    return () => {
      alive = false;
    };
  }, [type, id, enabled]);
  return preview;
}

/** Where the player left off, in seconds (LemurVodPlayer keeps it per film / per episode). */
export function savedPosition(type: 'movie' | 'tv', id: number | string, season?: number, episode?: number): number {
  const key = type === 'movie' ? `lp:pos:movie:${id}` : `lp:pos:tv:${id}:${season}:${episode}`;
  try {
    const n = parseFloat(localStorage.getItem(key) || '0');
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** "1hr 47m left" and the watched fraction, from the runtime and the saved position. */
export function timeLeft(runtimeMin: number | null | undefined, positionSec: number): { pct: number; label: string } | null {
  if (!runtimeMin || positionSec <= 0) return null;
  const total = runtimeMin * 60;
  const left = Math.max(0, total - positionSec);
  const h = Math.floor(left / 3600);
  const m = Math.max(1, Math.round((left % 3600) / 60));
  return { pct: Math.min(100, (positionSec / total) * 100), label: h ? `${h}hr ${m}m left` : `${m}m left` };
}
