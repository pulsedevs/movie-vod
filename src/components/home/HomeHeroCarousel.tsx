'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { MediaItem } from '@/types';
import { useHybridData } from '@/hooks/useHybridData';
import OptimizedLogo from '@/components/common/OptimizedLogo';
import { useDetailHref } from '@/hooks/useDetailHref';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

const MotionDiv = dynamic(
  () =>
    process.env.NODE_ENV === 'development'
      ? import('@/components/motion/SimpleMotionDiv').catch(() => ({
          default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        }))
      : import('@/components/motion/SafeMotionDiv').catch(() => ({
          default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        })),
  { ssr: false }
);

const AnimatePresence = dynamic(
  () =>
    process.env.NODE_ENV === 'development'
      ? import('@/components/motion/SimpleAnimatePresence').catch(() => ({
          default: ({ children }: any) => <>{children}</>,
        }))
      : import('@/components/motion/SafeAnimatePresence').catch(() => ({
          default: ({ children }: any) => <>{children}</>,
        })),
  { ssr: false, loading: () => <div className="contents" /> }
);

function getTitle(item: MediaItem | undefined): string {
  if (!item) return 'Unknown Title';
  return item.media_type === 'movie' ? item.title || 'Unknown Title' : item.name || 'Unknown Name';
}

function getReleaseYear(item: MediaItem | undefined): string {
  if (!item) return 'TBA';
  if (item.media_type === 'movie' && item.release_date) {
    return item.release_date.slice(0, 4);
  }
  if (item.media_type === 'tv' && item.first_air_date) {
    return item.first_air_date.slice(0, 4);
  }
  return 'TBA';
}

interface HomeHeroCarouselProps {
  compact?: boolean;
  edgeToEdge?: boolean;
  fadeBottom?: boolean;
  fadeColor?: string;
  className?: string;
}

export default function HomeHeroCarousel({
  compact = false,
  edgeToEdge = false,
  fadeBottom = false,
  fadeColor = '#0a0a0a',
  className = '',
}: HomeHeroCarouselProps) {
  const [featuredHero, setFeaturedHero] = useState<MediaItem[]>([]);
  const [heroError, setHeroError] = useState<Error | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [logoLoadErrors, setLogoLoadErrors] = useState<Set<number>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { mediaHref } = useDetailHref();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();

  const shellClass = compact ? 'hero-shell-compact' : 'hero-shell';
  const radiusClass = edgeToEdge ? 'rounded-none' : 'rounded-lg';

  useEffect(() => {
    const fetchHeroItems = async () => {
      try {
        const initialHeroItems = await fetchWithRetry<MediaItem[]>(
          '/api/trending?timeWindow=day&mediaType=movie&withLogos=true&limit=1',
          'heroItems-initial',
          3,
          (section, error) => setHeroError(error)
        );
        const initialFiltered = initialHeroItems.filter((item) => item.backdrop_path).slice(0, 1);
        if (initialFiltered.length > 0) {
          setFeaturedHero(initialFiltered);
        }

        const fullHeroItems = await fetchWithRetry<MediaItem[]>(
          '/api/trending?timeWindow=day&mediaType=movie&withLogos=true&limit=10',
          'heroItems',
          3,
          (section, error) => setHeroError(error)
        );
        const filteredHeroItems = fullHeroItems.filter((item) => item.backdrop_path).slice(0, 10);
        if (filteredHeroItems.length === 0) {
          if (initialFiltered.length === 0) {
            setHeroError(new Error('No suitable hero items with backdrop images found'));
          }
          return;
        }
        setFeaturedHero(filteredHeroItems);
        setHeroError(null);
      } catch (error) {
        console.error('Failed to fetch hero items:', error);
        setHeroError(error as Error);
      }
    };

    fetchHeroItems();
  }, []);

  useEffect(() => {
    if (!isAutoScrolling || featuredHero.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredHero.length);
      }, 7000);
    };

    const initializeAutoScroll = () => {
      if (document.readyState === 'complete') {
        timeoutId = setTimeout(startAutoScroll, 3000);
      } else {
        const handleLoad = () => {
          timeoutId = setTimeout(startAutoScroll, 3000);
          window.removeEventListener('load', handleLoad);
        };
        window.addEventListener('load', handleLoad);

        const fallbackTimeout = setTimeout(() => {
          window.removeEventListener('load', handleLoad);
          startAutoScroll();
        }, 5000);

        return () => {
          window.removeEventListener('load', handleLoad);
          clearTimeout(fallbackTimeout);
        };
      }
    };

    const cleanup = initializeAutoScroll();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      cleanup?.();
    };
  }, [isAutoScrolling, featuredHero.length]);

  const goToPreviousHero = () => {
    setCurrentHeroIndex((prev) => (prev === 0 ? featuredHero.length - 1 : prev - 1));
  };

  const goToNextHero = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % featuredHero.length);
  };

  const currentItem = featuredHero[currentHeroIndex];
  const inWatchlist =
    currentItem &&
    isInWatchlist(currentItem.id, currentItem.media_type as 'movie' | 'tv');

  const toggleWatchlist = () => {
    if (!currentItem) return;
    if (inWatchlist) {
      removeFromWatchlist(currentItem.id, currentItem.media_type as 'movie' | 'tv');
    } else {
      addToWatchlist(currentItem);
    }
  };

  if (heroError) {
    return (
      <div className={`${shellClass} bg-gray-800 flex items-center justify-center ${radiusClass} ${className}`}>
        <p className="text-red-500 text-sm">Failed to load featured content.</p>
      </div>
    );
  }

  if (featuredHero.length === 0) {
    return (
      <div
        className={`${shellClass} bg-gray-800 animate-pulse flex flex-col items-center justify-center text-center px-4 ${radiusClass} ${className}`}
      >
        <p className="text-sm font-medium text-gray-300">Loading featured titles…</p>
      </div>
    );
  }

  return (
    <div
      className={`${shellClass} relative overflow-hidden ${radiusClass} ${className}`}
      onMouseEnter={() => setIsAutoScrolling(false)}
      onMouseLeave={() => setIsAutoScrolling(true)}
      ref={heroRef}
    >
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentHeroIndex}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {currentItem && (
            <>
              <Image
                src={`https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`}
                alt={`${getTitle(currentItem)} backdrop`}
                fill
                priority
                fetchPriority="high"
                loading="eager"
                quality={compact ? 75 : 90}
                sizes={compact ? '60vw' : '100vw'}
                className={`object-cover ${compact ? 'object-top' : 'object-center'}`}
              />
              <div
                className={`absolute inset-0 z-10 ${
                  compact
                    ? fadeBottom
                      ? 'bg-gradient-to-t from-black/62 via-black/22 to-transparent'
                      : 'bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent'
                    : 'bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent'
                }`}
              />
              <div
                className={`absolute inset-0 z-10 ${
                  compact
                    ? 'bg-gradient-to-r from-black/48 via-black/15 to-transparent'
                    : 'bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent'
                }`}
              />

              <div
                className={`absolute bottom-0 left-0 text-white z-20 ${
                  compact ? 'p-4 w-full md:w-3/4' : 'p-4 sm:p-6 md:p-12 w-full md:w-2/3'
                }`}
              >
                {currentItem.logo_path && !logoLoadErrors.has(currentItem.id) ? (
                  <div className={compact ? 'mb-1 min-h-8' : 'mb-2 sm:mb-3 min-h-12 sm:min-h-16 md:min-h-20 lg:min-h-24'}>
                    <OptimizedLogo
                      src={`https://image.tmdb.org/t/p/w500${currentItem.logo_path}`}
                      alt={getTitle(currentItem)}
                      className={compact ? 'h-8 max-w-[200px]' : 'h-12 sm:h-16 md:h-20 lg:h-24 max-w-sm'}
                      priority
                      maxHeight={compact ? 32 : 96}
                      maxWidth={compact ? 200 : 384}
                      onError={() => {
                        setLogoLoadErrors((prev) => new Set(prev).add(currentItem.id));
                      }}
                      fallbackComponent={
                        <h2
                          className={`font-bold line-clamp-2 ${
                            compact ? 'text-lg mb-1' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-1 sm:mb-2'
                          }`}
                        >
                          {getTitle(currentItem)}
                        </h2>
                      }
                    />
                  </div>
                ) : (
                  <h2
                    className={`font-bold line-clamp-2 ${
                      compact ? 'text-lg mb-1' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-1 sm:mb-2'
                    }`}
                  >
                    {getTitle(currentItem)}
                  </h2>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-xs font-medium">
                    {currentItem.vote_average?.toFixed(1)} ★
                  </span>
                  <span className="text-gray-300 text-xs sm:text-sm">{getReleaseYear(currentItem)}</span>
                </div>

                {!compact && (
                  <p className="text-gray-200 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 md:line-clamp-4">
                    {currentItem.overview}
                  </p>
                )}

                <div className={`flex items-center gap-2 ${compact ? 'mt-2' : 'mt-3 sm:mt-4 md:mt-6'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(mediaHref(currentItem));
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 sm:py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    Watch Now
                  </button>
                  <button
                    type="button"
                    onClick={toggleWatchlist}
                    className={`p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                      inWatchlist
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800/70 hover:bg-gray-800 text-white'
                    }`}
                    aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    <Bookmark className="w-4 h-4" fill={inWatchlist ? 'currentColor' : 'none'} />
                    {!compact && (
                      <span className="hidden sm:inline text-sm">
                        {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </MotionDiv>
      </AnimatePresence>

      {fadeBottom && (
        <div
          className="absolute bottom-0 left-0 right-0 h-20 z-[15] pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, transparent 48%, ${fadeColor}73 79%, ${fadeColor} 100%)`,
          }}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={goToPreviousHero}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 z-20"
        aria-label="Previous"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>
      <button
        type="button"
        onClick={goToNextHero}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 z-20"
        aria-label="Next"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>
    </div>
  );
}
