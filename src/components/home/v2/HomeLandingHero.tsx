'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { MediaItem } from '@/types';
import useDebounce from '@/hooks/useDebounce';
import MediaCard from '@/components/media/MediaCard';
import HomeHeroLogo from './HomeHeroLogo';
import HomeSearchField from './HomeSearchField';
import HomePosterFanStack from './HomePosterFanStack';
import HeroStatCard, { type HeroStatConfig } from './HeroStatCard';
import { SEARCH_RESULTS_GRID_CLASS } from './browse/browseV2Grid';
import { useDetailHref } from '@/hooks/useDetailHref';
import { navThemes } from './navThemes';
import { toV2Href } from '@/utils/v2Shell';
import { v2Transition } from '@/utils/v2Transitions';
import { boredFlixTaglineFont } from '@/components/branding/boredFlixLogoFont';
import { useTrendingSearchTicker } from '@/hooks/useTrendingSearchTicker';
import { useLiveWatcherCount } from '@/hooks/useLiveWatcherCount';
import {
  HERO_CENTER_BLOCK_CLASS,
  HERO_CONTAINER_CLASS,
  HERO_LOGO_BLOCK_CLASS,
  HERO_PILL_CLASS,
  HERO_PILLS_ROW_CLASS,
  HERO_PILLS_SECTION_CLASS,
  HERO_POSTER_BAND_CLASS,
  HERO_POSTER_LEFT_CLASS,
  HERO_POSTER_RIGHT_CLASS,
  HERO_POSTER_TOP_CLASS,
  HERO_POSTER_VISIBLE_CLASS,
  HERO_SEARCH_DROPDOWN_CLASS,
  HERO_SEARCH_SLOT_CLASS,
  HERO_SEARCH_WIDTH_CLASS,
  HERO_SECTION_CLASS,
  HERO_STATS_GRID_CLASS,
  HERO_STATS_SECTION_CLASS,
  HERO_TAGLINE_CLASS,
  HERO_WATCHING_BADGE_CLASS,
  HERO_WATCHING_BADGE_WRAP_CLASS,
} from '@/utils/v2Layout';

const HERO_STATS: HeroStatConfig[] = [
  {
    numericValue: 75000,
    displayValue: '75,000',
    label: 'Movies & Shows',
    theme: navThemes.movies,
    variant: 'count',
  },
  {
    displayValue: '4K',
    label: 'Video Quality',
    theme: navThemes.tv,
    variant: 'shimmer',
  },
  {
    numericValue: 190,
    displayValue: '190',
    label: 'Countries',
    theme: navThemes.parties,
    variant: 'count',
  },
];

interface HomeLandingHeroProps {
  initialPopularMovies?: MediaItem[];
  initialPopularTv?: MediaItem[];
}

export default function HomeLandingHero({
  initialPopularMovies = [],
  initialPopularTv = [],
}: HomeLandingHeroProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { mediaHref } = useDetailHref();
  const reducedMotion = useReducedMotion();
  const searchRootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<MediaItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const debouncedQuery = useDebounce(query, 280);
  const trendingTicker = useTrendingSearchTicker(true, reducedMotion ?? false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  // Detect desktop to control fan stack rendering (data comes from server now)
  useEffect(() => {
    const ml = window.matchMedia('(min-width: 860px)');
    setIsDesktop(ml.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    ml.addEventListener('change', handler);
    return () => ml.removeEventListener('change', handler);
  }, []);

  const leftPool = useMemo(() => initialPopularMovies.slice(0, 6), [initialPopularMovies]);
  const rightPool = useMemo(() => initialPopularTv.slice(0, 6), [initialPopularTv]);
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
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(trimmed)}&page=${pageNum}`
      );
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
      if (event.key === 'Escape') {
        setIsSearchFocused(false);
      }
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
    <section className={HERO_SECTION_CLASS}>
      <div className="pointer-events-none hidden md:block absolute inset-0 overflow-hidden rounded-b-3xl bg-[radial-gradient(circle_at_18%_0%,rgba(249,115,22,0.16),transparent_42%),radial-gradient(circle_at_82%_0%,rgba(139,92,246,0.14),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.1),transparent_45%)]" />

      <div className={HERO_CONTAINER_CLASS}>
        {/* Flow: logo + search */}
        <motion.div
          className={`relative z-40 mx-auto w-full min-w-0 ${HERO_LOGO_BLOCK_CLASS} text-center`}
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={v2Transition(0.42, 0.05, reducedMotion ?? false)}
        >
          {/* Logo hidden on mobile — it lives in HomeV2MobileHeader instead */}
          <div className="hidden md:flex justify-center">
            <HomeHeroLogo className="justify-center" />
          </div>

          <p className={`hidden md:block ${boredFlixTaglineFont.className} ${HERO_TAGLINE_CLASS}`}>
            Unlimited Movies, TV Shows &amp; More
          </p>

          <div ref={searchRootRef} className={HERO_SEARCH_SLOT_CLASS}>
            <div className={`absolute left-1/2 top-0 z-10 ${HERO_SEARCH_WIDTH_CLASS} -translate-x-1/2`}>
              <HomeSearchField
                variant="prominent"
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
                  <div
                    ref={resultsScrollRef}
                    className={HERO_SEARCH_DROPDOWN_CLASS}
                  >
                    {isLoadingResults && page === 1 && liveResults.length === 0 ? (
                      <div className="flex h-[220px] items-center justify-center gap-3 text-white/60 text-sm">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                        Searching...
                      </div>
                    ) : liveResults.length === 0 ? (
                      <div className="flex h-[220px] items-center justify-center">
                        <p className="text-center text-sm text-white/60">
                          No results for &ldquo;{query}&rdquo;
                        </p>
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
                              <MediaCard
                                item={item}
                                mini
                                alwaysDense
                                onClick={() => handleResultClick(item)}
                              />
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
        </motion.div>

        {/* CTAs + stats between posters; posters absolute */}
        <div className={HERO_POSTER_BAND_CLASS}>

          {/* Single floating posters on each side — tablet only (860px–1023px) */}
          {initialPopularMovies[0]?.poster_path && (
            <Link
              href={mediaHref(initialPopularMovies[0])}
              className="absolute left-0 top-1/2 z-[5] hidden min-[860px]:block lg:hidden -translate-y-1/2 -rotate-6 transition-transform duration-300 hover:scale-105 hover:-rotate-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://image.tmdb.org/t/p/w154${initialPopularMovies[0].poster_path}`}
                alt={('title' in initialPopularMovies[0] ? initialPopularMovies[0].title : initialPopularMovies[0].name) ?? ''}
                className="w-[88px] rounded-xl object-cover aspect-[2/3] ring-1 ring-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
                loading="lazy"
                decoding="async"
              />
            </Link>
          )}
          {initialPopularTv[0]?.poster_path && (
            <Link
              href={mediaHref(initialPopularTv[0])}
              className="absolute right-0 top-1/2 z-[5] hidden min-[860px]:block lg:hidden -translate-y-1/2 rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://image.tmdb.org/t/p/w154${initialPopularTv[0].poster_path}`}
                alt={('title' in initialPopularTv[0] ? initialPopularTv[0].title : initialPopularTv[0].name) ?? ''}
                className="w-[88px] rounded-xl object-cover aspect-[2/3] ring-1 ring-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
                loading="lazy"
                decoding="async"
              />
            </Link>
          )}

          {isDesktop && (
            <>
              <div
                className={`absolute ${HERO_POSTER_TOP_CLASS} z-[5] -translate-y-1/2 ${HERO_POSTER_LEFT_CLASS} ${HERO_POSTER_VISIBLE_CLASS}`}
              >
                <HomePosterFanStack pool={leftPool} side="left" mediaHref={mediaHref} />
              </div>
              <div
                className={`absolute ${HERO_POSTER_TOP_CLASS} z-[5] -translate-y-1/2 ${HERO_POSTER_RIGHT_CLASS} ${HERO_POSTER_VISIBLE_CLASS}`}
              >
                <HomePosterFanStack pool={rightPool} side="right" mediaHref={mediaHref} />
              </div>
            </>
          )}

          {/* Mobile poster fan — real fan component, centered, between search and stats */}
          <div className="md:hidden flex justify-center mb-3 pointer-events-auto">
            <HomePosterFanStack
              pool={leftPool}
              side="left"
              mediaHref={mediaHref}
              showOnMobile
            />
          </div>

          <div className={HERO_CENTER_BLOCK_CLASS}>
            <div className={HERO_STATS_SECTION_CLASS}>
              <div className={HERO_STATS_GRID_CLASS}>
                {HERO_STATS.map((stat, index) => (
                  <HeroStatCard
                    key={stat.label}
                    {...stat}
                    index={index}
                    reducedMotion={reducedMotion ?? false}
                  />
                ))}
              </div>
              <div className={HERO_WATCHING_BADGE_WRAP_CLASS}>
                <WatchingBadge reducedMotion={reducedMotion ?? false} />
              </div>
            </div>
          </div>
        </div>

        {/* Platform pills — desktop only */}
        <div className={`hidden md:block ${HERO_PILLS_SECTION_CLASS}`}>
            <div className={HERO_PILLS_ROW_CLASS}>
              {['Netflix', 'Disney+', 'HBO Max', 'Prime Video', 'Hulu', 'Apple TV+'].map((name) => (
                <span key={name} className={HERO_PILL_CLASS}>
                  {name}
                </span>
              ))}
            </div>
        </div>

      </div>
    </section>
  );
}


function WatchingBadge({ reducedMotion }: { reducedMotion: boolean }) {
  const watcherCount = useLiveWatcherCount();

  return (
    <span
      className={[
        HERO_WATCHING_BADGE_CLASS,
        reducedMotion ? '' : 'animate-[watching-badge-pulse_2.8s_ease-in-out_infinite]',
      ].join(' ')}
      style={{
        border: '1px solid rgba(52, 211, 153, 0.38)',
        background:
          'linear-gradient(145deg, rgba(6, 78, 59, 0.55), rgba(15, 23, 20, 0.82))',
        boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.08) inset, 0 8px 20px rgba(0, 0, 0, 0.35)',
      }}
    >
      <span
        className="relative inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center self-center"
        aria-hidden
      >
        {!reducedMotion ? (
          <span className="absolute inset-0 rounded-full bg-emerald-400/35 animate-ping" />
        ) : null}
        <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
      </span>
      <span className="inline-flex items-baseline gap-1 leading-none">
        <span className="font-semibold tabular-nums text-[#FFF9F3]">
          {watcherCount.toLocaleString()}
        </span>
        <span className="font-normal text-emerald-200/55">watching</span>
      </span>
    </span>
  );
}
