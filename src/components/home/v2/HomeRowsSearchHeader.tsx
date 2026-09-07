'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { MediaItem } from '@/types';
import useDebounce from '@/hooks/useDebounce';
import MediaCard from '@/components/media/MediaCard';
import HomeHeroLogo from './HomeHeroLogo';
import HomeSearchField from './HomeSearchField';
import { SEARCH_RESULTS_GRID_CLASS } from './browse/browseV2Grid';
import { useDetailHref } from '@/hooks/useDetailHref';
import { useTrendingSearchTicker } from '@/hooks/useTrendingSearchTicker';
import { HERO_SEARCH_DROPDOWN_CLASS } from '@/utils/v2Layout';

/**
 * Logo + tagline + prominent search — identical to the fan landing hero's
 * header (same primitives + HERO_* constants), but standalone so the new
 * rows home can reuse it without touching HomeLandingHero.
 */
export default function HomeRowsSearchHeader() {
  const router = useRouter();
  const { mediaHref } = useDetailHref();
  const reducedMotion = useReducedMotion();
  const searchRootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<MediaItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debouncedQuery = useDebounce(query, 280);
  const trendingTicker = useTrendingSearchTicker(true, reducedMotion ?? false);

  const showResults = isSearchFocused && query.trim().length > 0;

  const fetchResults = useCallback(async (searchQuery: string, pageNum: number, append = false) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setLiveResults([]);
      setHasMore(false);
      return;
    }
    setIsLoadingResults(true);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&page=${pageNum}`);
      if (!response.ok) {
        if (!append) setLiveResults([]);
        setHasMore(false);
        return;
      }
      const data = await response.json();
      const nextResults = (data.results || []) as MediaItem[];
      if (append) {
        setLiveResults((prev) => {
          const seen = new Set(prev.map((item) => `${item.media_type}-${item.id}`));
          const merged = [...prev];
          for (const item of nextResults) {
            const key = `${item.media_type}-${item.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
          return merged;
        });
      } else {
        setLiveResults(nextResults);
      }
      setHasMore((data.total_pages ?? 1) > pageNum);
    } catch {
      if (!append) setLiveResults([]);
      setHasMore(false);
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(false);
    loadingMoreRef.current = false;
    fetchResults(debouncedQuery, 1, false);
  }, [debouncedQuery, fetchResults]);

  useEffect(() => {
    if (!showResults || !hasMore) return;
    const root = resultsScrollRef.current;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setPage((currentPage) => {
          const nextPage = currentPage + 1;
          void fetchResults(debouncedQuery, nextPage, true).finally(() => {
            loadingMoreRef.current = false;
          });
          return nextPage;
        });
      },
      { root, threshold: 0.1, rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showResults, hasMore, debouncedQuery, fetchResults, liveResults.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRootRef.current && !searchRootRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?query=${encodeURIComponent(trimmed)}`);
      setIsSearchFocused(false);
    }
  };

  const handleTickerSelect = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setIsSearchFocused(true);
    inputRef.current?.focus();
    void fetchResults(trimmed, 1, false);
  };

  const handleResultClick = (item: MediaItem) => {
    router.push(mediaHref(item));
    setIsSearchFocused(false);
  };

  return (
    <div className="pointer-events-none relative z-40 w-full px-4 pt-2 sm:px-7 sm:pt-2.5">
      {/* Dark scrim so the bar stays legible over the hero behind it (desktop overlay only) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-28 bg-gradient-to-b from-black/85 via-black/45 to-transparent md:block" />

      {/* Top bar: logo (left) · search (center) · room reserved on the right for
          the shell's floating Join Discord / Ads buttons. */}
      <div
        ref={searchRootRef}
        className="pointer-events-auto relative flex items-center gap-3 sm:gap-4 md:pr-[200px] lg:pr-[224px]"
      >
        {/* Logo — desktop only; on mobile it lives in HomeV2MobileHeader */}
        <div className="hidden md:block shrink-0">
          <HomeHeroLogo svgClassName="relative block h-7 w-auto lg:h-8" />
        </div>

        {/* Search — centered between the logo and the floating buttons */}
        <div className="relative flex min-w-0 flex-1 md:justify-center">
          <div className="relative w-full max-w-md">
            <HomeSearchField
              variant="default"
              className="[&>div]:h-[34px] [&_input]:py-0 [&_input]:text-sm [&_button]:py-0 [&>div]:rounded-full [&>div]:!shadow-none [&>div]:!border-white/12 [&>div]:!bg-white/[0.06]"
              value={query}
              onChange={setQuery}
              onFocus={() => setIsSearchFocused(true)}
              onSubmit={handleSearchSubmit}
              onTickerSelect={handleTickerSelect}
              onClear={() => {
                setQuery('');
                setLiveResults([]);
                setPage(1);
                setHasMore(false);
                inputRef.current?.focus();
                setIsSearchFocused(true);
              }}
              placeholder="Search movies, shows, genres..."
              inputRef={inputRef}
              idlePulse={!reducedMotion}
              ticker={{
                titles: trendingTicker.titles,
                index: trendingTicker.index,
                offsetY: trendingTicker.offsetY,
                lineHeight: trendingTicker.lineHeight,
                durationMs: trendingTicker.durationMs,
                isAnimating: trendingTicker.isAnimating,
                show: trendingTicker.showTicker,
                currentTitle: trendingTicker.currentTitle,
              }}
            />

            {showResults ? (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(165deg,rgba(15,17,22,0.94),rgba(10,10,14,0.9))] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.62)]">
                <div ref={resultsScrollRef} className={HERO_SEARCH_DROPDOWN_CLASS}>
                  {isLoadingResults && page === 1 && liveResults.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center gap-3 text-white/60 text-sm">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : liveResults.length === 0 ? (
                    <div className="flex h-[220px] items-center justify-center">
                      <p className="text-center text-sm text-white/60">No results for &ldquo;{query}&rdquo;</p>
                    </div>
                  ) : (
                    <>
                      <div className={SEARCH_RESULTS_GRID_CLASS}>
                        {liveResults.map((item) => (
                          <div
                            key={`${item.media_type}-${item.id}`}
                            className="cursor-pointer rounded-lg overflow-hidden ring-1 ring-transparent hover:ring-white/25 transition-shadow"
                            onClick={() => handleResultClick(item)}
                          >
                            <MediaCard item={item} mini alwaysDense onClick={() => handleResultClick(item)} />
                          </div>
                        ))}
                      </div>
                      {hasMore ? (
                        <div ref={loadMoreRef} className="flex justify-center py-4">
                          {isLoadingResults && page > 1 ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                          ) : (
                            <span className="text-[11px] text-white/35">Scroll for more</span>
                          )}
                        </div>
                      ) : liveResults.length > 0 ? (
                        <p className="pb-1 text-center text-[11px] text-white/30">End of results</p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
