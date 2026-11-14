'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MediaItem } from '@/types';
import { useFilters } from './FilterContext';
import MediaCard from '../media/MediaCard';
import useDebounce from '@/hooks/useDebounce';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { navThemes } from '@/components/home/v2/navThemes';

interface PaginatedResultsProps {
  initialResults: MediaItem[];
  initialTotalPages: number;
  initialTotalResults: number;
  initialPage: number;
  mediaType: 'movie' | 'tv' | 'anime';
  gridClassName?: string;
  compact?: boolean;
  compactCards?: boolean;
  provider?: number;
}

const PaginatedResults: React.FC<PaginatedResultsProps> = ({
  initialResults,
  initialTotalPages,
  initialTotalResults,
  initialPage,
  mediaType,
  gridClassName,
  compact = false,
  compactCards = false,
  provider,
}) => {  const { filters } = useFilters();
  const router = useRouter();
    // Debounce filter changes to prevent excessive API calls
  const debouncedFilters = useDebounce(filters, 300);
    // Track if component has hydrated to prevent hydration mismatches
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Track if we should use initial data or fetch new data
  const [shouldUseInitialData, setShouldUseInitialData] = useState(true);
  
  // Show immediate loading state when filters change (before debounce)
  const [isFilteringInProgress, setIsFilteringInProgress] = useState(false);  
  const [results, setResults] = useState<MediaItem[]>(initialResults);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalResults, setTotalResults] = useState(initialTotalResults);  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  const [prefetchedPages, setPrefetchedPages] = useState<Map<number, MediaItem[]>>(new Map());
  const [isNavigatingFromBrowser, setIsNavigatingFromBrowser] = useState(false);
  
  // Set hydration flag
  useEffect(() => {
    setIsHydrated(true);
  }, []);
    // Sync with URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = parseInt(urlParams.get('page') || '1', 10);
    
    if (pageFromUrl !== initialPage && pageFromUrl >= 1) {
      console.log(`[PaginatedResults] Initial URL sync: setting page to ${pageFromUrl} (initialPage was ${initialPage})`);
      setIsNavigatingFromBrowser(true); // Treat this as browser navigation
      setCurrentPage(pageFromUrl);
      setShouldUseInitialData(false); // We need to fetch for different page
    } else {
      // If page matches initial page, use initial data
      console.log(`[PaginatedResults] Page matches initial page (${pageFromUrl}), using initial data`);
    }
  }, []); // Only run on mount
  
  // Show immediate loading state when filters change (before debounce kicks in)
  // Only after hydration to prevent hydration mismatches
  useEffect(() => {
    if (!isHydrated) return;
    
    setIsFilteringInProgress(true);
    const timer = setTimeout(() => setIsFilteringInProgress(false), 100);
    return () => clearTimeout(timer);
  }, [filters, isHydrated]);
  
  // Hide filtering state when debounced filters update
  useEffect(() => {
    if (isHydrated) {
      setIsFilteringInProgress(false);
    }
  }, [debouncedFilters, isHydrated]);
      const fetchResults = async (page: number, prefetchOnly = false, filtersToUse = debouncedFilters) => {
    // Check if we have this page prefetched
    if (prefetchedPages.has(page)) {
      if (!prefetchOnly) {
        setResults(prefetchedPages.get(page) || []);
        return;
      }
      return; // Already prefetched
    }

    if (!prefetchOnly) {
      setIsLoading(true);
      setError(null);
    }

    console.log(`[PaginatedResults] ${prefetchOnly ? 'Prefetching' : 'Fetching'} page ${page} with filters:`, filtersToUse);

    try {
      // Use API route instead of direct service call for client-side requests
      const url = new URL('/api/discover', window.location.origin);
      url.searchParams.append('mediaType', mediaType);
      url.searchParams.append('page', page.toString());
      
      if (filtersToUse.genres.length > 0) {
        url.searchParams.append('genres', filtersToUse.genres.join(','));
      }
      if (filtersToUse.year) {
        url.searchParams.append('year', filtersToUse.year);
      }
      if (filtersToUse.sortBy) {
        url.searchParams.append('sortBy', filtersToUse.sortBy);
      }
      if (filtersToUse.minRating && filtersToUse.minRating !== '0') {
        url.searchParams.append('minRating', filtersToUse.minRating);
      }
      if (filtersToUse.minVoteCount && filtersToUse.minVoteCount !== 'auto') {
        url.searchParams.append('minVoteCount', filtersToUse.minVoteCount);
      }
      if (filtersToUse.language) {
        url.searchParams.append('language', filtersToUse.language);
      }
      if (provider) {
        url.searchParams.append('provider', String(provider));
      }

      const response = await fetch(url, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();

      console.log(`[PaginatedResults] ${prefetchOnly ? 'Prefetched' : 'Received'} data: page=${page}, results=${data.results?.length || 0}`);

      const pageResults = data.results || [];
      
      // Cache the results
      setPrefetchedPages(prev => new Map(prev).set(page, pageResults));

      if (!prefetchOnly) {
        setResults(pageResults);
        setTotalPages(data.totalPages || 0);
        setTotalResults(data.totalResults || 0);
      }
    } catch (err) {
      console.error(`[PaginatedResults] ${prefetchOnly ? 'Prefetch' : 'Fetch'} error:`, err);
      if (!prefetchOnly) {
        setError('Failed to load results');
        setResults([]);
      }
    } finally {
      if (!prefetchOnly) {
        setIsLoading(false);
      }
    }
  };  useEffect(() => {
    // Don't trigger on initial mount - only when filters actually change
    if (shouldUseInitialData) {
      setShouldUseInitialData(false); // Mark that initial data is no longer valid for future filter changes
      return;
    }
    
    setPrefetchedPages(new Map()); // Clear prefetch cache when filters change
    setIsLoading(true); // Show loading state immediately when filters change
    
    // Fetch page 1 directly without changing currentPage to avoid triggering page effect
    fetchResults(1); // Now uses debouncedFilters by default
      // Update URL to page 1 and then set currentPage to avoid loop
    const url = new URL(window.location.href);
    url.searchParams.set('page', '1');
    router.replace(url.pathname + url.search, { scroll: false });
    
    // Set currentPage after URL update, with navigation flag to prevent URL update again
    // Use setTimeout to ensure the URL update completes first
    setTimeout(() => {
      setIsNavigatingFromBrowser(true);
      setCurrentPage(1);
    }, 0);
  }, [debouncedFilters.genres, debouncedFilters.year, debouncedFilters.sortBy, debouncedFilters.minRating, debouncedFilters.minVoteCount, debouncedFilters.language]);useEffect(() => {
    console.log('[PaginatedResults] Page changed to:', currentPage, 'isNavigatingFromBrowser:', isNavigatingFromBrowser, 'shouldUseInitialData:', shouldUseInitialData);
    
    // Only fetch if not using initial data, OR if this is a different page than initial
    if (!shouldUseInitialData || currentPage !== initialPage) {
      fetchResults(currentPage);
      setShouldUseInitialData(false); // Mark that we've moved away from initial data
    }
      // Only update URL if this change didn't come from browser navigation
    if (!isNavigatingFromBrowser) {
      const url = new URL(window.location.href);
      
      if (currentPage === 1) {
        // For page 1, remove page parameter to keep clean URLs
        url.searchParams.delete('page');
        // Use replace to keep clean URLs and avoid duplicate history entries
        router.replace(url.pathname + url.search, { scroll: false });
      } else {
        // For other pages, add page parameter and use push to maintain browser history
        url.searchParams.set('page', currentPage.toString());
        router.push(url.pathname + url.search, { scroll: false });
      }
    }
    
    // Reset the browser navigation flag
    if (isNavigatingFromBrowser) {
      setIsNavigatingFromBrowser(false);
    }
  }, [currentPage, isNavigatingFromBrowser, router, shouldUseInitialData, initialPage]);  // Smart prefetching: Prefetch next page after user stays on current page for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage < totalPages && !prefetchedPages.has(currentPage + 1)) {
        console.log(`[PaginatedResults] Smart prefetching page ${currentPage + 1}`);
        fetchResults(currentPage + 1, true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentPage, totalPages, prefetchedPages]);
  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search);
      const pageFromUrl = parseInt(urlParams.get('page') || '1', 10);
      
      console.log(`[PaginatedResults] Browser navigation: current=${currentPage}, fromURL=${pageFromUrl}, totalPages=${totalPages}`);
      
      if (pageFromUrl !== currentPage && pageFromUrl >= 1 && pageFromUrl <= totalPages) {
        console.log(`[PaginatedResults] Browser navigation detected, updating to page ${pageFromUrl}`);
        setIsNavigatingFromBrowser(true);
        setCurrentPage(pageFromUrl);
      }
    };

    // Listen for browser back/forward button clicks
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPage, totalPages]);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      console.log(`[PaginatedResults] User clicked page ${page}, current: ${currentPage}`);
      setCurrentPage(page);
    }
  };
  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    const v2Theme = compactCards
      ? navThemes[mediaType === 'movie' ? 'movies' : mediaType === 'tv' ? 'tv' : 'anime']
      : null;

    const pageButtonClass = (isActive: boolean) => {
      if (!v2Theme) {
        return `w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 border font-medium ${
          isActive
            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
            : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700 hover:border-gray-600'
        }`;
      }
      return 'w-9 h-9 flex items-center justify-center rounded-xl border text-xs font-semibold transition-colors';
    };

    const pageButtonStyle = (isActive: boolean): React.CSSProperties | undefined => {
      if (!v2Theme) return undefined;
      return isActive
        ? {
            backgroundColor: v2Theme.bgActive,
            color: v2Theme.label,
            borderColor: `${v2Theme.icon}66`,
          }
        : {
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.65)',
            borderColor: 'rgba(255,255,255,0.1)',
          };
    };

    const navButtonClass = v2Theme
      ? 'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed'
      : 'flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 border border-gray-700 hover:border-gray-600';

    const navButtonStyle = (enabled: boolean): React.CSSProperties | undefined => {
      if (!v2Theme) return undefined;
      return enabled
        ? {
            backgroundColor: v2Theme.bgRest,
            color: v2Theme.label,
            borderColor: `${v2Theme.icon}44`,
          }
        : {
            backgroundColor: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.35)',
            borderColor: 'rgba(255,255,255,0.08)',
          };
    };

    return (
      <div
        className={`flex justify-center items-center flex-wrap gap-1.5 ${
          v2Theme ? 'mt-6 mb-2' : 'mt-8 mb-4'
        }`}
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navButtonClass}
          style={navButtonStyle(currentPage !== 1)}
          onMouseEnter={(e) => {
            if (!v2Theme || currentPage === 1) return;
            e.currentTarget.style.backgroundColor = v2Theme.bgHover;
            e.currentTarget.style.borderColor = `${v2Theme.icon}55`;
          }}
          onMouseLeave={(e) => {
            if (!v2Theme || currentPage === 1) return;
            Object.assign(e.currentTarget.style, navButtonStyle(true)!);
          }}
        >
          <ChevronLeft size={v2Theme ? 14 : 16} />
          <span className="hidden sm:inline">{v2Theme ? 'Prev' : 'Previous'}</span>
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className={pageButtonClass(false)}
              style={pageButtonStyle(false)}
              onMouseEnter={(e) => {
                if (!v2Theme) return;
                e.currentTarget.style.backgroundColor = v2Theme.bgHover;
                e.currentTarget.style.color = v2Theme.label;
              }}
              onMouseLeave={(e) => {
                if (!v2Theme) return;
                Object.assign(e.currentTarget.style, pageButtonStyle(false)!);
              }}
            >
              1
            </button>
            {startPage > 2 && (
              <div className="flex items-center justify-center w-9 h-9">
                <MoreHorizontal size={14} className={v2Theme ? 'text-white/30' : 'text-gray-500'} />
              </div>
            )}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={pageButtonClass(page === currentPage)}
            style={pageButtonStyle(page === currentPage)}
            onMouseEnter={(e) => {
              if (!v2Theme || page === currentPage) return;
              e.currentTarget.style.backgroundColor = v2Theme.bgHover;
              e.currentTarget.style.color = v2Theme.label;
            }}
            onMouseLeave={(e) => {
              if (!v2Theme || page === currentPage) return;
              Object.assign(e.currentTarget.style, pageButtonStyle(false)!);
            }}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <div className="flex items-center justify-center w-9 h-9">
                <MoreHorizontal size={14} className={v2Theme ? 'text-white/30' : 'text-gray-500'} />
              </div>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={pageButtonClass(false)}
              style={pageButtonStyle(false)}
              onMouseEnter={(e) => {
                if (!v2Theme) return;
                e.currentTarget.style.backgroundColor = v2Theme.bgHover;
                e.currentTarget.style.color = v2Theme.label;
              }}
              onMouseLeave={(e) => {
                if (!v2Theme) return;
                Object.assign(e.currentTarget.style, pageButtonStyle(false)!);
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
          style={navButtonStyle(currentPage !== totalPages)}
          onMouseEnter={(e) => {
            if (!v2Theme || currentPage === totalPages) return;
            e.currentTarget.style.backgroundColor = v2Theme.bgHover;
            e.currentTarget.style.borderColor = `${v2Theme.icon}55`;
          }}
          onMouseLeave={(e) => {
            if (!v2Theme || currentPage === totalPages) return;
            Object.assign(e.currentTarget.style, navButtonStyle(true)!);
          }}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={v2Theme ? 14 : 16} />
        </button>
      </div>
    );
  };  return (
    <div className="relative">
      {/* Show loading state for both main loading and filter changes */}
      {(isLoading || isFilteringInProgress) && (
        <div className={compact ? 'min-h-[160px] flex items-center justify-center py-8' : 'min-h-[300px] flex items-center justify-center'}>
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} border-4 border-transparent border-t-red-500 border-r-red-500 rounded-full animate-spin`}></div>
              {!compact && (
                <>
                  <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-b-purple-500 border-l-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
                  <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 animate-pulse"></div>
                </>
              )}
            </div>
            {!compact && (
              <div className="text-center space-y-1">
                <span className="text-lg font-medium bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {isFilteringInProgress ? 'Applying filters...' : 'Loading content...'}
                </span>
                <p className="text-sm text-gray-400">
                  {isFilteringInProgress ? 'Finding the perfect matches' : 'Discovering amazing content'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}
      {!isLoading && !isFilteringInProgress && results.length === 0 && !error && (
        <div className="text-center py-4 text-gray-400">
          No {mediaType === 'anime' ? 'anime' : mediaType === 'movie' ? 'movies' : 'TV shows'} found for the selected filters.
        </div>
      )}
      {!isLoading && !isFilteringInProgress && results.length > 0 && (
        <>
          <div
            className={
              gridClassName ??
              'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-w-7xl mx-auto'
            }
          >
            {results.map((item) => (
              <MediaCard key={item.id} item={item} compact={compactCards} />
            ))}
          </div>
          {totalPages > 1 && renderPagination()}
        </>
      )}
    </div>
  );
};

export default PaginatedResults;