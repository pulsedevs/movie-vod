'use client';

import React, { useState, useRef, useEffect } from 'react';
import MediaTabs from '@/components/ui/MediaTabs';
import { MediaItem, Movie, TVShow } from '@/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useHybridData } from '@/hooks/useHybridData';
// Lazy load framer-motion to reduce initial bundle size
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Bookmark} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast';
import OptimizedLogo from '@/components/common/OptimizedLogo';
import AnimeSection from '@/components/ui/AnimeSection';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';
import FeaturedLinks from '@/components/seo/FeaturedLinks';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';

// Dynamic import for motion components with better loading fallbacks
// Use simple components in development to avoid HMR issues
const MotionDiv = dynamic(
  () => process.env.NODE_ENV === 'development' 
    ? import('@/components/motion/SimpleMotionDiv').catch(() => ({ default: ({ children, ...props }: any) => <div {...props}>{children}</div> }))
    : import('@/components/motion/SafeMotionDiv').catch(() => ({ default: ({ children, ...props }: any) => <div {...props}>{children}</div> })), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-20 bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
        </div>
      </div>
    )
  }
);

const AnimatePresence = dynamic(
  () => process.env.NODE_ENV === 'development'
    ? import('@/components/motion/SimpleAnimatePresence').catch(() => ({ default: ({ children }: any) => <>{children}</> }))
    : import('@/components/motion/SafeAnimatePresence').catch(() => ({ default: ({ children }: any) => <>{children}</> })), 
  { 
    ssr: false,
    loading: () => <div className="contents" />,
  }
);


export default function HomePageClassic() {
  // State for data and errors
  const [featuredHero, setFeaturedHero] = useState<MediaItem[]>([]);
  const [trendingMoviesToday, setTrendingMoviesToday] = useState<Movie[]>([]);
  const [trendingTvToday, setTrendingTvToday] = useState<TVShow[]>([]);
  const [trendingMoviesWeek, setTrendingMoviesWeek] = useState<Movie[]>([]);
  const [trendingTvWeek, setTrendingTvWeek] = useState<TVShow[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTvShows, setPopularTvShows] = useState<TVShow[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [topRatedTvShows, setTopRatedTvShows] = useState<TVShow[]>([]);
  const [popularAnime, setPopularAnime] = useState<TVShow[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: Error | null }>({});
    // Hero carousel state
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [logoLoadErrors, setLogoLoadErrors] = useState<Set<number>>(new Set());
  
  // Toast for notifications
  const { showToast } = useToast();

  // Refs for lazy loading
  const heroRef = useRef<HTMLDivElement>(null);
  const trendingTodayRef = useRef<HTMLDivElement>(null);  const trendingWeekRef = useRef<HTMLDivElement>(null);
  const topRatedRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);
  const animeRef = useRef<HTMLDivElement>(null);const router = useRouter();
    // Library hook for watchlist functionality
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();

  // Continue Watching state
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [shouldRenderAnimeSection, setShouldRenderAnimeSection] = useState(false);
  const [shouldRenderFeaturedLinks, setShouldRenderFeaturedLinks] = useState(false);
  const featuredLinksRef = useRef<HTMLDivElement>(null);

  // Load continue watching from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('continueWatching');
      if (data) {
        setContinueWatching(JSON.parse(data));
      }
    }
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Remove item handler
  const handleRemoveContinue = (id: number | string, media_type: string) => {
    const updated = continueWatching.filter(item => !(item.id === id && item.media_type === media_type));
    setContinueWatching(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('continueWatching', JSON.stringify(updated));
    }
    
    // Show toast notification
    showToast('Removed from continue watching', 'info');
  };  // Mark item as watched (move from continue watching to watched history)
  const handleMarkAsWatched = (id: number | string, media_type: string) => {
    // Find the item to move
    const itemToMove = continueWatching.find(item => item.id === id && item.media_type === media_type);
    
    if (itemToMove) {
      // Get current watched history
      let watchedHistory: any[] = [];
      if (typeof window !== 'undefined') {
        const watchedData = localStorage.getItem('watchedHistory');
        if (watchedData) {
          watchedHistory = JSON.parse(watchedData);
        }
      }
      
      // Check if item already exists in watched history
      const existingWatchedIndex = watchedHistory.findIndex(
        item => item.id === id && item.media_type === media_type
      );
      
      // Create the watched item
      const watchedItem = {
        ...itemToMove,
        progress: 100, // Mark as 100% complete
        watchedAt: new Date().toISOString() // Add timestamp
      };
      
      let updatedWatchedHistory;
      
      if (existingWatchedIndex !== -1) {
        // Update existing entry with new watch date (move to top)
        updatedWatchedHistory = [...watchedHistory];
        updatedWatchedHistory.splice(existingWatchedIndex, 1); // Remove old entry
        updatedWatchedHistory.unshift(watchedItem); // Add updated entry at the beginning
      } else {
        // Add new entry to the beginning
        updatedWatchedHistory = [watchedItem, ...watchedHistory];
      }
      
      // Remove from continue watching
      const updatedContinueWatching = continueWatching.filter(
        item => !(item.id === id && item.media_type === media_type)
      );
      setContinueWatching(updatedContinueWatching);
      
      // Remove from watchlist when marked as finished
      removeFromWatchlist(id, media_type as 'movie' | 'tv');
      
      // Save both to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('watchedHistory', JSON.stringify(updatedWatchedHistory));
        localStorage.setItem('continueWatching', JSON.stringify(updatedContinueWatching));
      }
      
      // Show toast notification
      showToast(`Marked "${itemToMove.title || itemToMove.name}" as finished`, 'success');
    }
  };
  // Function to move item from continue watching to watchlist
  const handleFinishLater = (id: number | string, media_type: string) => {
    // Find the item to move
    const itemToMove = continueWatching.find(item => item.id === id && item.media_type === media_type);
    
    if (itemToMove) {
      // Check if already in watchlist to prevent duplicates
      if (isInWatchlist(id, media_type as 'movie' | 'tv')) {
        // Just remove from continue watching if already in watchlist
        handleRemoveContinue(id, media_type);
        showToast(`"${itemToMove.title || itemToMove.name}" is already in your watchlist`, 'info');
        return;
      }
      
      // Create watchlist item format
      const watchlistItem = {
        id: itemToMove.id,
        title: itemToMove.title || itemToMove.name,
        name: itemToMove.name || itemToMove.title,
        poster_path: itemToMove.poster_path,
        backdrop_path: itemToMove.backdrop_path,
        release_date: itemToMove.release_date || itemToMove.first_air_date,
        first_air_date: itemToMove.first_air_date || itemToMove.release_date,
        overview: itemToMove.overview,
        vote_average: itemToMove.vote_average,
        media_type: itemToMove.media_type,
        genre_ids: itemToMove.genre_ids || []
      };
      
      // Add to watchlist
      addToWatchlist(watchlistItem);
      
      // Remove from continue watching
      handleRemoveContinue(id, media_type);
      
      // Show toast notification
      showToast(`Moved "${itemToMove.title || itemToMove.name}" to your watchlist`, 'success');
    }
  };
  
  // Show options menu when clicking the × button
  const showOptionsMenu = (event: React.MouseEvent, id: number | string, media_type: string) => {
    event.stopPropagation();
    
    // Remove any existing options menu
    const existingMenu = document.querySelector('.action-options-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
      // Create options menu
    const menu = document.createElement('div');
    menu.className = 'action-options-menu';
    menu.innerHTML = `
      <div class="action-option" data-action="mark-finished">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span class="option-text">Mark as Finished</span>
      </div>
      <div class="action-option" data-action="finish-later">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span class="option-text">Finish Later</span>
      </div>
      <div class="action-option" data-action="remove">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <span class="option-text">Remove</span>
      </div>
    `;
    
    // Position the menu
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.zIndex = '1000';
      // Add event listeners to menu options
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const option = target.closest('.action-option') as HTMLElement;
      
      if (option) {
        const action = option.dataset.action;
        const item = continueWatching.find(item => item.id === id && item.media_type === media_type);
        const title = item ? (item.title || item.name) : 'Item';
        
        switch (action) {
          case 'mark-finished':
            handleMarkAsWatched(id, media_type);
            break;
          case 'finish-later':
            handleFinishLater(id, media_type);
            break;
          case 'remove':
            handleRemoveContinue(id, media_type);
            break;
        }
        
        menu.remove();
      }
    });
    
    // Close menu when clicking outside
    const closeMenu = (e: Event) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    
    document.body.appendChild(menu);
    document.addEventListener('click', closeMenu);
  };

  // Update fetchWithRetry to accept a URL and handle fetch response
  const fetchWithRetry = async <T extends Movie[] | TVShow[] | MediaItem[]>(
    url: string,
    section: string,
    retries = 3
  ): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          let errorDetails = `API returned status code ${response.status}`;
          try {
            const errorJson = await response.json();
            errorDetails = errorJson.error || errorJson.details || errorDetails;
          } catch {
            // Ignore if response is not JSON
          }
          throw new Error(errorDetails);
        }
        
        const data = await response.json();
        // Check if we received the expected API response format
        if (data && Array.isArray(data)) {
          return data as T;
        } else if (data && data.results && Array.isArray(data.results)) {
          // Handle standard API responses with results array (MovieApiResponse/TvApiResponse)
          return data.results as T;
        } else {
          throw new Error("Unexpected API response format");
        }
      } catch (error) {
        console.error(`Fetch error for ${section} (attempt ${i + 1}):`, error);
        if (i === retries - 1) {
          setErrors((prev) => ({ ...prev, [section]: error as Error }));
          return [] as unknown as T;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
    return [] as unknown as T; // Should not be reached, but satisfies TS
  };  // Auto scroll effect for hero with page load detection and user interaction awareness
  useEffect(() => {
    if (!isAutoScrolling || featuredHero.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredHero.length);
      }, 7000); // Change slide every 7 seconds
    };

    const initializeAutoScroll = () => {
      // Check if page is already loaded
      if (document.readyState === 'complete') {
        // Page is already loaded, wait additional 3 seconds
        timeoutId = setTimeout(startAutoScroll, 3000);
      } else {
        // Wait for page load event
        const handleLoad = () => {
          timeoutId = setTimeout(startAutoScroll, 3000);
          window.removeEventListener('load', handleLoad);
        };
        window.addEventListener('load', handleLoad);
        
        // Fallback: start after 5 seconds regardless
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
  // Add CSS styles for options menu
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'homepage-action-options-menu-styles'; // Add ID for safer removal
    style.textContent = `
      .action-options-menu {
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 4px;
        min-width: 140px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
      }
      
      .action-option {
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
        color: white;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .action-option:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }      /* Mark as Finished button styling */
      @media (max-width: 640px) {
        .mark-finished-text {
          font-size: 9px; /* Make text smaller on mobile */
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Safe removal - check if element exists and has a parent
      const existingStyle = document.getElementById('homepage-action-options-menu-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);
  // Fetch hero items immediately
  useEffect(() => {
    const fetchHeroItems = async () => {
      try {
        // Phase 1: fetch only 1 hero item first so LCP image is discovered ASAP.
        const initialHeroItems = await fetchWithRetry<MediaItem[]>(
          '/api/trending?timeWindow=day&mediaType=movie&withLogos=true&limit=1',
          'heroItems-initial'
        );
        const initialFiltered = initialHeroItems.filter((item) => item.backdrop_path).slice(0, 1);
        if (initialFiltered.length > 0) {
          setFeaturedHero(initialFiltered);
        }

        // Phase 2: fetch full carousel in background.
        const fullHeroItems = await fetchWithRetry<MediaItem[]>(
          '/api/trending?timeWindow=day&mediaType=movie&withLogos=true&limit=10',
          'heroItems'
        );
        const filteredHeroItems = fullHeroItems.filter((item) => item.backdrop_path).slice(0, 10);
        if (filteredHeroItems.length === 0) {
          if (initialFiltered.length === 0) {
            throw new Error("No suitable hero items with backdrop images found");
          }
          return;
        }
        setFeaturedHero(filteredHeroItems);
      } catch (error) {
        console.error('Failed to fetch hero items:', error);
        setErrors(prev => ({ ...prev, heroItems: error as Error }));
      }
    };
    
    fetchHeroItems();
  }, []);

  // Helper function to determine if an item is a movie or TV show
  const isMovie = (item: MediaItem): item is Movie => {
    return item.media_type === 'movie';
  };

  // Helper function to get the title/name safely
  const getTitle = (item: MediaItem | undefined): string => {
    if (!item) return 'Unknown Title';
    return item.media_type === 'movie' ? item.title || 'Unknown Title' : item.name || 'Unknown Name';
  };

  // Helper function to get the release date/first air date safely
  const getReleaseYear = (item: MediaItem | undefined): string => {
    if (!item) return 'TBA';
    if (item.media_type === 'movie' && item.release_date) {
      return item.release_date.slice(0, 4);
    } else if (item.media_type === 'tv' && item.first_air_date) {
      return item.first_air_date.slice(0, 4);
    }
    return 'TBA';
  };

  // Hero navigation handlers
  const goToPreviousHero = () => {
    setCurrentHeroIndex((prev) => (prev === 0 ? featuredHero.length - 1 : prev - 1));
  };

  const goToNextHero = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % featuredHero.length);
  };

  // Lazy load sections using API routes
  useIntersectionObserver(
    trendingTodayRef,
    async () => {
      if (trendingMoviesToday.length === 0 && trendingTvToday.length === 0) {
        const [movies, tv] = await Promise.all([
          fetchWithRetry<Movie[]>('/api/trending?timeWindow=day&mediaType=movie', 'trendingTodayMovies'),
          fetchWithRetry<TVShow[]>('/api/trending?timeWindow=day&mediaType=tv', 'trendingTodayTv'),
        ]);
        setTrendingMoviesToday(movies);
        setTrendingTvToday(tv);
      }
    },
    { threshold: 0.1 }
  );

  useIntersectionObserver(
    trendingWeekRef,
    async () => {
      if (trendingMoviesWeek.length === 0 && trendingTvWeek.length === 0) {
        const [movies, tv] = await Promise.all([
          fetchWithRetry<Movie[]>('/api/trending?timeWindow=week&mediaType=movie', 'trendingWeekMovies'),
          fetchWithRetry<TVShow[]>('/api/trending?timeWindow=week&mediaType=tv', 'trendingWeekTv'),
        ]);
        setTrendingMoviesWeek(movies);
        setTrendingTvWeek(tv);
      }
    },
    { threshold: 0.1 }
  );

  useIntersectionObserver(
    topRatedRef,
    async () => {
      if (topRatedMovies.length === 0 && topRatedTvShows.length === 0) {
        const [movies, tv] = await Promise.all([
          fetchWithRetry<Movie[]>('/api/top-rated?mediaType=movie', 'topRatedMovies'),
          fetchWithRetry<TVShow[]>('/api/top-rated?mediaType=tv', 'topRatedTv'),
        ]);
        setTopRatedMovies(movies);
        setTopRatedTvShows(tv);
      }
    },
    { threshold: 0.1 }
  );
  useIntersectionObserver(
    popularRef,
    async () => {
      if (popularMovies.length === 0 && popularTvShows.length === 0) {
        const [movies, tv] = await Promise.all([
          fetchWithRetry<Movie[]>('/api/popular?mediaType=movie', 'popularMovies'),
          fetchWithRetry<TVShow[]>('/api/popular?mediaType=tv', 'popularTv'),
        ]);
        setPopularMovies(movies);
        setPopularTvShows(tv);
      }
    },
    { threshold: 0.1 }
  );

  useIntersectionObserver(
    animeRef,
    async () => {
      setShouldRenderAnimeSection(true);
      if (popularAnime.length === 0) {
        const anime = await fetchWithRetry<TVShow[]>('/api/discover?mediaType=anime&limit=20', 'popularAnime');
        setPopularAnime(anime);
      }
    },
    { threshold: 0.1 }
  );

  useIntersectionObserver(
    featuredLinksRef,
    async () => {
      setShouldRenderFeaturedLinks(true);
    },
    { threshold: 0.05 }
  );

  const clampForMobile = <T extends MediaItem>(items: T[]): T[] => {
    if (!isMobileViewport) return items;
    return items.slice(0, 8);
  };

  const visibleContinueWatching = isMobileViewport
    ? continueWatching.slice(0, 12)
    : continueWatching;

  const handleRetry = (section: string) => {
    setErrors((prev) => ({ ...prev, [section]: null }));
    // Trigger refetch by clearing state (observer will run again if in view)
    if (section.includes('trendingToday')) {
      setTrendingMoviesToday([]);
      setTrendingTvToday([]);
    } else if (section.includes('trendingWeek')) {
      setTrendingMoviesWeek([]);
      setTrendingTvWeek([]);
    } else if (section.includes('topRated')) {
      setTopRatedMovies([]);
      setTopRatedTvShows([]);
    } else if (section.includes('popular')) {
      setPopularMovies([]);
      setPopularTvShows([]);
    } else if (section.includes('anime')) {
      setPopularAnime([]);
    } else if (section === 'hero') {
      setFeaturedHero([]);
      // Manually re-fetch hero items
      fetchWithRetry('/api/trending?timeWindow=day&mediaType=movie&limit=10', 'heroItems')
        .then(items => setFeaturedHero(items.slice(0, 10)));
    }
  };

  // Render hero carousel
  const renderHeroSection = () => {
  if (errors.heroItems) {
    return (
      <div className="hero-shell bg-gray-800 flex items-center justify-center rounded-lg mb-6 sm:mb-8 mt-2">
        <p className="text-red-500">Failed to load featured content. Please try again.</p>
      </div>
    );
  }
  
  if (featuredHero.length === 0) {
    return (
      <div className="hero-shell bg-gray-800 animate-pulse flex flex-col items-center justify-center text-center px-4 rounded-lg mb-6 sm:mb-8 mt-2">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16"></path>
        </svg>
        <p className="text-xl sm:text-2xl font-bold text-gray-200">Discover Blockbusters</p>
        <p className="text-sm sm:text-base text-gray-400 mt-2">Fetching the latest cinematic masterpieces...</p>
      </div>
    );
  }
  return (
    <div 
      className="hero-shell relative overflow-hidden rounded-lg mb-6 sm:mb-8 mt-2"
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
        >          {featuredHero[currentHeroIndex] && (
            <>
              {/* Optimized background image */}
              <Image
                src={`https://image.tmdb.org/t/p/original${featuredHero[currentHeroIndex].backdrop_path}`}
                alt={`${getTitle(featuredHero[currentHeroIndex])} backdrop`}
                fill
                priority={true}
                fetchPriority="high"
                loading="eager"
                quality={90}
                sizes="100vw"
                className="object-cover object-center"
              />
              {/* Enhanced gradient overlays for better text readability on mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-10" />              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent z-10" />

              {/* Improved content container with better mobile spacing */}
              <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-12 w-full md:w-2/3 text-white z-20">{/* Display logo if available and not failed to load, otherwise fallback to text title */}
                {featuredHero[currentHeroIndex].logo_path && !logoLoadErrors.has(featuredHero[currentHeroIndex].id) ? (
                  <div className="mb-2 sm:mb-3 min-h-12 sm:min-h-16 md:min-h-20 lg:min-h-24">
                    <OptimizedLogo
                      src={`https://image.tmdb.org/t/p/w500${featuredHero[currentHeroIndex].logo_path}`}
                      alt={getTitle(featuredHero[currentHeroIndex])}
                      className="h-12 sm:h-16 md:h-20 lg:h-24 max-w-sm"
                      priority={true}
                      maxHeight={96} // lg:h-24 equivalent
                      maxWidth={384} // max-w-sm equivalent
                      onError={() => {
                        // Track failed logo loads and trigger re-render to show text title
                        setLogoLoadErrors(prev => new Set(prev).add(featuredHero[currentHeroIndex].id));
                      }}
                      fallbackComponent={
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 line-clamp-2">
                          {getTitle(featuredHero[currentHeroIndex])}
                        </h2>
                      }
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 line-clamp-2">
                    {getTitle(featuredHero[currentHeroIndex])}
                  </h2>
                )}
                <div className="flex items-center space-x-3 mb-2 sm:mb-3">
                  <span className="bg-yellow-500 text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
                    {featuredHero[currentHeroIndex].vote_average?.toFixed(1)} ★
                  </span>
                  <span className="text-gray-300 text-sm sm:text-base">
                    {getReleaseYear(featuredHero[currentHeroIndex])}
                  </span>
                </div>
                <p className="text-gray-200 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 md:line-clamp-4">
                  {featuredHero[currentHeroIndex].overview}
                </p>
                {/* Stacked buttons on mobile, side by side on larger screens */}                <div className="mt-3 sm:mt-4 md:mt-6 flex flex-row items-center gap-2 sm:gap-4">
                  <button 
                    onClick={() => {
                      const currentItem = featuredHero[currentHeroIndex];
                      if (currentItem) {
                        const url = currentItem.media_type === 'movie' 
                          ? getMovieUrl(currentItem.id, currentItem.title || 'untitled') 
                          : getTvShowUrl(currentItem.id, currentItem.name || 'untitled');
                        router.push(url);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base flex-1 sm:flex-none text-center"
                  >
                    Watch Now
                  </button>                  {/* Icon button on mobile, text button on larger screens */}
                  <button 
                    onClick={() => {
                      const currentItem = featuredHero[currentHeroIndex];
                      if (currentItem) {
                        const itemInWatchlist = isInWatchlist(currentItem.id, currentItem.media_type as 'movie' | 'tv');
                        
                        if (itemInWatchlist) {
                          removeFromWatchlist(currentItem.id, currentItem.media_type as 'movie' | 'tv');
                          // Toast is shown by the removeFromWatchlist function
                        } else {
                          addToWatchlist(currentItem);
                          // Toast is shown by the addToWatchlist function
                        }
                      }
                    }}
                    className={`sm:hidden p-2 rounded-md transition-colors flex items-center justify-center ${
                      isInWatchlist(featuredHero[currentHeroIndex]?.id, featuredHero[currentHeroIndex]?.media_type as 'movie' | 'tv')
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 bg-opacity-70 hover:bg-opacity-100 text-white'
                    }`}
                    aria-label={isInWatchlist(featuredHero[currentHeroIndex]?.id, featuredHero[currentHeroIndex]?.media_type as 'movie' | 'tv') 
                      ? 'Remove from Watchlist' 
                      : 'Add to Watchlist'
                    }
                  >
                    <Bookmark className="w-5 h-5" 
                      fill={isInWatchlist(featuredHero[currentHeroIndex]?.id, featuredHero[currentHeroIndex]?.media_type as 'movie' | 'tv') ? "currentColor" : "none"} 
                    />
                  </button><button 
                    onClick={() => {
                      const currentItem = featuredHero[currentHeroIndex];
                      if (currentItem) {
                        const itemInWatchlist = isInWatchlist(currentItem.id, currentItem.media_type as 'movie' | 'tv');
                        
                        if (itemInWatchlist) {
                          removeFromWatchlist(currentItem.id, currentItem.media_type as 'movie' | 'tv');
                          // Toast is shown by the removeFromWatchlist function
                        } else {
                          addToWatchlist(currentItem);
                          // Toast is shown by the addToWatchlist function
                        }
                      }
                    }}
                    className={`hidden sm:flex sm:items-center sm:gap-2 px-6 py-2 rounded-md font-medium transition-colors text-base ${
                      isInWatchlist(featuredHero[currentHeroIndex]?.id, featuredHero[currentHeroIndex]?.media_type as 'movie' | 'tv')
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 bg-opacity-70 hover:bg-opacity-100 text-white'
                    }`}                  >
                    <Bookmark className="w-5 h-5 mr-2" 
                      fill={isInWatchlist(featuredHero[currentHeroIndex]?.id, featuredHero[currentHeroIndex]?.media_type as 'movie' | 'tv') ? "currentColor" : "none"} 
                    />
                    {isInWatchlist(featuredHero[currentHeroIndex]?.id, featuredHero[currentHeroIndex]?.media_type as 'movie' | 'tv') 
                      ? 'Remove from Watchlist' 
                      : 'Add to Watchlist'
                    }
                  </button>
                </div>
              </div>            </>
          )}
        </MotionDiv>
      </AnimatePresence>

      {/* Navigation arrows - positioned further from content */}
      <button
        onClick={goToPreviousHero}
        disabled={featuredHero.length === 0}
        className="absolute left-2 sm:left-4 top-1/3 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1.5 sm:p-2 z-20"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>
      <button 
        onClick={goToNextHero}
        className="absolute right-2 sm:right-4 top-1/3 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1.5 sm:p-2 z-20"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>


    </div>
  );
};
  // Generate consistent structured data for home page
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BoredFlix',
    description: 'Stream free movies and TV shows online in HD, Full HD and 4K. No sign-up required.',
    url: domain,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${domain}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'BoredFlix',
      url: domain
    }
  };

  return (
    <>
      {/* Add structured data script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}      />
      
      <main className="main-content flex flex-col min-h-screen bg-gray-900">
        <MotionDiv initial={false}>
          

          {/* Hero Section — first to stabilize LCP and reduce CLS */}
          {renderHeroSection()}

          {/* Native Banner Ad — fixed-height slot via .native-ad-slot */}
          <div className="w-full px-4 mb-8">
            <NativeBannerAdWrapper className="text-center" />
          </div>

          {/* Continue Watching — below hero so hydration does not shift the hero */}
          {continueWatching.length > 0 && (
  <section className="w-full px-4 mb-8">
    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Continue Watching</h2>
    
    <div className="relative group">
      {/* Left Scroll Button - only shown when needed */}
      <button 
        onClick={() => {
          const container = document.getElementById('continue-watching-scroll');
          if (container) {
            container.scrollBy({ left: -200, behavior: 'smooth' });
          }
        }}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full hover:bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      
      {/* Right Scroll Button - only shown when needed */}
      <button 
        onClick={() => {
          const container = document.getElementById('continue-watching-scroll');
          if (container) {
            container.scrollBy({ left: 200, behavior: 'smooth' });
          }
        }}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full hover:bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>
      
      {/* Shadow overlay indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div id="continue-watching-right-shadow" className="absolute right-0 top-0 bottom-4 w-16 sm:w-20 bg-gradient-to-l from-gray-900 to-transparent z-0 pointer-events-none opacity-70 transition-opacity duration-300"></div>
      
      {/* Scrollable container */}
      <div 
        id="continue-watching-scroll"
        className="flex overflow-x-auto pb-4 space-x-3 scrollbar-hide scroll-smooth pr-10 sm:pr-20 md:pr-24"
        style={{
          scrollbarWidth: 'none',  /* Firefox */
          msOverflowStyle: 'none',  /* IE and Edge */
          scrollBehavior: 'smooth',
          scrollSnapType: 'x proximity'
        }}
      >
        {visibleContinueWatching.map(item => (
          <div key={item.id + '-' + item.media_type} className="relative flex-shrink-0 w-[142px] sm:w-[200px] transition-all duration-300" style={{ scrollSnapAlign: 'start' }}>            <div className="relative group cursor-pointer">
              {/* Options menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showOptionsMenu(e, item.id, item.media_type);
                }}
                className="absolute top-1 right-1 z-20 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 text-xs"
                aria-label="Options"
              >
                ×
              </button>
                {/* Mark as Finished button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsWatched(item.id, item.media_type);
                }}
                className="absolute top-1 left-1 z-20 bg-green-600/80 hover:bg-green-600 text-white rounded-md px-2 py-0.5 text-xs flex items-center"
                aria-label="Mark as Finished"
              >
                <span className="mark-finished-text">Mark as Finished</span>
              </button>
              
              <div                className="block relative overflow-hidden rounded-xl transition-all duration-500 ease-out bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-blue-500/20 group transform hover:md:-translate-y-1 hover:md:scale-102 active:scale-98"
                onClick={() => {
                  const url = item.media_type === 'movie'
                    ? getMovieUrl(item.id, item.title || 'untitled')
                    : getTvShowUrl(item.id, item.name || 'untitled');
                  router.push(url);
                }}
              >
                {/* Progress indicator */}
                {item.progress && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                
                {/* Animated border gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
                
                {/* Main poster container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900">
                  <Image
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '/images/placeholder-poster.png'}
                    alt={item.title || item.name || 'Poster'}
                    fill
                    sizes="(max-width: 640px) 142px, 200px"
                    className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-110 group-hover:saturate-110"
                  />
                  
                  {/* Subtle gradient overlay always present */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                
                {/* Bottom info - always visible with media type and year */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent p-1 md:p-1.5">
                    <div className="flex items-center justify-between text-[9px] md:text-xs">
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <span className="text-white/90 font-medium bg-black/40 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                          {item.media_type === 'movie' ? 'Movie' : 'TV'}
                        </span>
                        {item.season && item.episode && (
                          <span className="text-white/80 font-medium bg-black/40 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                            S{item.season}:E{item.episode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-white/90 font-medium truncate mt-0.5 text-[9px] md:text-xs">
                      {item.title || item.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)}

          <div ref={trendingTodayRef}>
            <MediaTabs
              title="Trending Today"
              movieData={clampForMobile(trendingMoviesToday)}
              tvData={clampForMobile(trendingTvToday)}
              isLoading={trendingMoviesToday.length === 0 && trendingTvToday.length === 0 && !errors.trendingTodayMovies && !errors.trendingTodayTv}
              error={errors.trendingTodayMovies || errors.trendingTodayTv}
              onRetry={() => handleRetry('trendingToday')}
              layout="carousel"
              priority
            />
          </div>          <div ref={trendingWeekRef}>
            <MediaTabs
              title="Trending This Week"
              movieData={clampForMobile(trendingMoviesWeek)}
              tvData={clampForMobile(trendingTvWeek)}
              isLoading={trendingMoviesWeek.length === 0 && trendingTvWeek.length === 0 && !errors.trendingWeekMovies && !errors.trendingWeekTv}
              error={errors.trendingWeekMovies || errors.trendingWeekTv}
              onRetry={() => handleRetry('trendingWeek')}
              layout="carousel"
            />
          </div>          <div ref={topRatedRef}>
            <MediaTabs
              title="Top Rated"
              movieData={clampForMobile(topRatedMovies)}
              tvData={clampForMobile(topRatedTvShows)}
              isLoading={topRatedMovies.length === 0 && topRatedTvShows.length === 0 && !errors.topRatedMovies && !errors.topRatedTv}
              error={errors.topRatedMovies || errors.topRatedTv}
              onRetry={() => handleRetry('topRated')}
              layout="carousel"
            />
          </div>

          <div ref={popularRef}>
            <MediaTabs
              title="Popular"
              movieData={clampForMobile(popularMovies)}
              tvData={clampForMobile(popularTvShows)}
              isLoading={popularMovies.length === 0 && popularTvShows.length === 0 && !errors.popularMovies && !errors.popularTv}
              error={errors.popularMovies || errors.popularTv}
              onRetry={() => handleRetry('popular')}            layout="carousel"
            />
          </div>

          {/* Anime Section */}
          <div ref={animeRef}>
            {shouldRenderAnimeSection ? (
              <AnimeSection />
            ) : (
              <section className="py-6">
                <div className="h-40 rounded-lg bg-gray-800/40 animate-pulse" />
              </section>
            )}
          </div>

          {/* Featured Links for SEO */}
          <div ref={featuredLinksRef} className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            {shouldRenderFeaturedLinks ? (
              <FeaturedLinks />
            ) : (
              <div className="h-24 rounded-lg bg-gray-800/40 animate-pulse" />
            )}
          </div>
        </MotionDiv>
      </main>
    </>
  );
}