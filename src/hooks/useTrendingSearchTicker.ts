'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaItem } from '@/types';

const TICKER_LINE_HEIGHT = 24;
const TICK_INTERVAL_MS = 2600;
const TICK_DURATION_MS = 220;
const REFRESH_MS = 10 * 60 * 1000;

function extractTitle(item: MediaItem): string {
  if ('title' in item && typeof item.title === 'string') return item.title.trim();
  if ('name' in item && typeof item.name === 'string') return item.name.trim();
  return '';
}

function dedupeTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const title of titles) {
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(title);
  }
  return unique;
}

export function useTrendingSearchTicker(enabled: boolean, reducedMotion = false) {
  const [titles, setTitles] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatingRef = useRef(false);

  const loadTitles = useCallback(async () => {
    try {
      const [moviesRes, tvRes] = await Promise.all([
        fetch('/api/trending?mediaType=movie&timeWindow=week'),
        fetch('/api/trending?mediaType=tv&timeWindow=week'),
      ]);

      const movies: MediaItem[] = moviesRes.ok ? await moviesRes.json() : [];
      const tv: MediaItem[] = tvRes.ok ? await tvRes.json() : [];

      const combined = dedupeTitles([
        ...movies.map(extractTitle).filter(Boolean).slice(0, 7),
        ...tv.map(extractTitle).filter(Boolean).slice(0, 7),
      ]);

      setTitles(combined);
      setIndex(0);
      setOffsetY(0);
      animatingRef.current = false;
      setIsAnimating(false);
    } catch {
      // Keep the last loaded titles if refresh fails.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    void loadTitles();

    const refreshId = setInterval(() => {
      if (!cancelled) void loadTitles();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(refreshId);
    };
  }, [enabled, loadTitles]);

  const showTicker = enabled && titles.length > 1;

  useEffect(() => {
    if (!showTicker) return;

    let mounted = true;
    let settleTimeout: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (!mounted || animatingRef.current) return;

      if (reducedMotion) {
        setIndex((prev) => (prev + 1) % titles.length);
        return;
      }

      animatingRef.current = true;
      setIsAnimating(true);
      setOffsetY(-TICKER_LINE_HEIGHT);

      settleTimeout = setTimeout(() => {
        if (!mounted) return;
        setIsAnimating(false);
        setOffsetY(0);
        setIndex((prev) => (prev + 1) % titles.length);
        animatingRef.current = false;
      }, TICK_DURATION_MS);
    };

    const intervalId = setInterval(tick, TICK_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(intervalId);
      if (settleTimeout) clearTimeout(settleTimeout);
    };
  }, [showTicker, titles.length, reducedMotion]);

  return {
    titles,
    index,
    offsetY,
    showTicker,
    isAnimating,
    lineHeight: TICKER_LINE_HEIGHT,
    durationMs: TICK_DURATION_MS,
    currentTitle: titles[index] ?? '',
  };
}
