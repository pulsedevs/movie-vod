'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaItem } from '@/types';
import { useFilters } from '@/components/browse/FilterContext';
import useDebounce from '@/hooks/useDebounce';
import { useV3Scroll } from '../V3Shell';

interface InfiniteResultsProps {
  initialResults: MediaItem[];
  initialTotalPages: number;
  initialPage: number;
  mediaType: 'movie' | 'tv' | 'anime';
  gridClassName: string;
  renderItem: (item: MediaItem, index: number) => React.ReactNode;
  provider?: number;
}

/** Start loading the next page while it is still this far below the visible area. */
const PRELOAD_PX = 1200;
const SKELETONS = 12;

type Filters = ReturnType<typeof useFilters>['filters'];

const keyOf = (i: MediaItem) => `${i.media_type}-${i.id}`;

function discoverUrl(mediaType: string, page: number, f: Filters, provider?: number) {
  const url = new URL('/api/discover', window.location.origin);
  url.searchParams.set('mediaType', mediaType);
  url.searchParams.set('page', String(page));
  if (f.genres.length) url.searchParams.set('genres', f.genres.join(','));
  if (f.year) url.searchParams.set('year', f.year);
  if (f.sortBy) url.searchParams.set('sortBy', f.sortBy);
  if (f.minRating && f.minRating !== '0') url.searchParams.set('minRating', f.minRating);
  if (f.minVoteCount && f.minVoteCount !== 'auto') url.searchParams.set('minVoteCount', f.minVoteCount);
  if (f.language) url.searchParams.set('language', f.language);
  if (provider) url.searchParams.set('provider', String(provider));
  return url.toString();
}

/**
 * The v3 browse grid: no page buttons; the next page loads as the viewer nears the bottom.
 * Starts from the server-rendered page; a filter change starts over from page 1.
 */
export default function InfiniteResults({
  initialResults,
  initialTotalPages,
  initialPage,
  mediaType,
  gridClassName,
  renderItem,
  provider,
}: InfiniteResultsProps) {
  const scroll = useV3Scroll();
  const { filters } = useFilters();
  const debounced = useDebounce(filters, 300);
  const filterKey = JSON.stringify(debounced);

  const [items, setItems] = useState<MediaItem[]>(initialResults);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const firstKey = useRef(filterKey);
  const generation = useRef(0); // bumped on every filter change: late answers for old filters are dropped
  const filtersRef = useRef(debounced);
  filtersRef.current = debounced;

  const load = useCallback(
    async (next: number) => {
      const gen = generation.current;
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(discoverUrl(mediaType, next, filtersRef.current, provider));
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (gen !== generation.current) return;
        const results: MediaItem[] = data.results || [];
        setItems((prev) => {
          if (next === 1) return results;
          // Popularity can shift between requests, so a title may come back on the next page too.
          const seen = new Set(prev.map(keyOf));
          return [...prev, ...results.filter((r) => !seen.has(keyOf(r)))];
        });
        setPage(next);
        setTotalPages(data.totalPages || 0);
      } catch {
        if (gen === generation.current) setError(true);
      } finally {
        if (gen === generation.current) setLoading(false);
      }
    },
    [mediaType, provider],
  );

  // A filter change: start over from page 1 (the first render already has the server's page).
  useEffect(() => {
    if (filterKey === firstKey.current && generation.current === 0) return;
    generation.current += 1;
    firstKey.current = '';
    setItems([]);
    setPage(0);
    setTotalPages(1);
    load(1);
  }, [filterKey, load]);

  const hasMore = page < totalPages;

  // Load the next page when the sentinel below the grid comes within PRELOAD_PX. Re-observed after
  // each load, so a page that does not fill the screen still pulls the next one.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || loading || error || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load(page + 1);
        }
      },
      { root: scroll?.current ?? null, rootMargin: `0px 0px ${PRELOAD_PX}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, loading, error, hasMore, load, scroll]);

  const restarting = loading && items.length === 0;

  return (
    <div>
      {items.length > 0 && <div className={gridClassName}>{items.map((item, i) => <div key={keyOf(item)}>{renderItem(item, i)}</div>)}</div>}

      {restarting && (
        <div className={gridClassName} aria-hidden>
          {Array.from({ length: SKELETONS }, (_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-16 text-center text-sm text-white/50">Nothing matches these filters.</p>
      )}

      <div ref={sentinel} aria-hidden className="h-px" />

      <div className="flex min-h-[72px] items-center justify-center py-6" aria-live="polite">
        {loading && items.length > 0 && (
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70" aria-label="Loading more" />
        )}
        {error && (
          <button
            type="button"
            onClick={() => load(items.length ? page + 1 : 1)}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Couldn&apos;t load more. Try again
          </button>
        )}
        {!loading && !error && !hasMore && items.length > 0 && (
          <span className="text-xs text-white/35">That&apos;s everything</span>
        )}
      </div>
    </div>
  );
}
