// src/components/search/SearchBar.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import useDebounce from '@/hooks/useDebounce';
import { MediaItem } from '@/types';
import MediaCard from '@/components/media/MediaCard';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';

interface SearchBarProps {
  /** Override the trigger button styling (e.g. to render it as a nav tab). */
  triggerClassName?: string;
  /** Override the trigger button contents (e.g. icon + label). */
  triggerChildren?: React.ReactNode;
}

const SearchBar = ({ triggerClassName, triggerChildren }: SearchBarProps = {}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);  const fetchResults = useCallback(async (searchQuery: string, pageNum: number, append: boolean = false) => {
    if (!searchQuery.trim()) {
      setLiveResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&page=${pageNum}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setLiveResults(prev => [...prev, ...(data.results || [])]);
        } else {
          setLiveResults(data.results || []);
        }
        setHasMore(data.total_pages > pageNum);
      } else {
        console.error('Failed to fetch search results');
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);  // Initial search when query changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchResults(debouncedQuery, 1, false);
  }, [debouncedQuery, fetchResults]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!isSearchOpen || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchResults(debouncedQuery, nextPage, true);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isSearchOpen, hasMore, isLoading, page, debouncedQuery, fetchResults]);

  // Handle clicks outside search and escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  const handleCardClick = useCallback((item: MediaItem) => {
    const url = item.media_type === 'movie' 
      ? getMovieUrl(item.id, item.title || 'untitled') 
      : getTvShowUrl(item.id, item.name || 'untitled');
    setIsSearchOpen(false);
    setIsLoading(true);
    router.push(url);
  }, [router]);
  const handleSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
      setIsSearchOpen(false);
    }
  }, [query, router]);
    const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true);
    // Reset pagination when opening search
    setPage(1);
    setHasMore(true);
    if (query.trim()) {
      fetchResults(query, 1, false);
    } else {
      setLiveResults([]);
    }
  }, [query, fetchResults]);

  return (
    <div>      <button
        type="button"
        className={
          triggerClassName ??
          `
          relative cursor-pointer p-2.5 sm:p-3 rounded-xl sm:rounded-2xl
          bg-white/10 backdrop-blur-sm border border-white/20
          hover:bg-white/20 hover:border-white/30 hover:scale-105
          active:scale-95 transition-all duration-300
          shadow-[0_2px_8px_rgba(0,0,0,0.1)]
        `
        }
        onClick={handleSearchOpen}
        aria-label="Search"
      >
        {triggerChildren ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-white/80"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {mounted && isSearchOpen && createPortal(
        <div
          ref={searchRef}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-start z-[200] animate-in fade-in duration-300"
        >          <div className="
            relative w-full max-w-4xl mt-4 sm:mt-8 mx-2 sm:mx-4
            bg-[#0e0e10]/95 backdrop-blur-xl
            border border-white/10
            rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            animate-in slide-in-from-top-4 duration-500
          ">
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/[0.03] to-transparent" />              {/* Header with Close Button */}
            <div className="relative flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white/90">Search Movies & TV Shows</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="
                  p-2 rounded-2xl bg-white/10 backdrop-blur-sm
                  border border-white/20 text-white/70 
                  hover:bg-white/20 hover:text-white transition-all duration-300
                  hover:scale-110 active:scale-95 flex-shrink-0
                "
                aria-label="Close search"
              >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.714 4.715a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.715a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.714a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>              </button>
            </div>

            {/* Modern Search Form */}
            <div className="relative px-4 sm:px-6 pb-3 sm:pb-4 flex-shrink-0">              <form onSubmit={handleSearch} className="relative">
                <div className="
                  relative flex items-center
                  bg-white/10 backdrop-blur-sm
                  border border-white/20
                  rounded-xl sm:rounded-2xl overflow-hidden
                  focus-within:bg-white/15 focus-within:border-amber-300/40
                  transition-all duration-300
                  shadow-[0_4px_16px_rgba(0,0,0,0.2)]
                ">
                  {/* Search Icon */}
                  <div className="pl-4 sm:pl-5 pr-2 sm:pr-3 py-3 sm:py-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-white/60"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  
                  {/* Input Field */}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for movies, TV shows, anime..."
                    className="
                      flex-1 py-3 sm:py-4 pr-4 sm:pr-5 bg-transparent text-white text-base sm:text-lg
                      placeholder-white/50 focus:outline-none
                      selection:bg-amber-400/30
                    "
                    autoFocus
                  />
                </div></form>
            </div>

            {/* Search Results */}
            <div className="relative px-4 sm:px-6 pb-4 sm:pb-6 flex-1 min-h-0">
              <div className="
                h-full max-h-[50vh] sm:max-h-[60vh] overflow-y-auto scrollbar-hide
                space-y-4
              ">              {/* Modern Loading State */}
              {isLoading && page === 1 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-amber-300 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
                  </div>
                  <p className="text-white/60 text-sm font-medium">Searching for amazing content...</p>
                </div>
              )}              {/* Results Grid with Modern Cards */}
              {liveResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/70 text-sm font-medium">
                      Found {liveResults.length} result{liveResults.length !== 1 ? 's' : ''}
                    </p>
                    <div className="h-px flex-1 ml-4 bg-gradient-to-r from-white/20 to-transparent"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {liveResults.map((item) => (
                      <div 
                        key={`${item.id}-${item.media_type}`}
                        className="group cursor-pointer"
                        onClick={() => handleCardClick(item)}
                      >
                        <div className="
                          relative overflow-hidden rounded-xl sm:rounded-2xl
                          bg-gradient-to-br from-white/10 to-white/5
                          backdrop-blur-sm border border-white/10
                          transition-all duration-300 ease-out
                          hover:scale-105 hover:bg-white/15 hover:border-white/20
                          hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                          group-active:scale-95
                        ">
                          <MediaCard
                            item={item}
                            onClick={() => handleCardClick(item)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}              {/* Load More with Modern Design */}
              {liveResults.length > 0 && hasMore && (
                <div 
                  ref={loadMoreRef}
                  className="flex justify-center py-6"
                >
                  {isLoading && page > 1 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin"></div>
                      <span className="text-white/60 text-sm">Loading more...</span>
                    </div>
                  )}
                </div>
              )}              {/* Modern No Results State */}
              {!isLoading && query.trim() !== "" && liveResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-8 h-8 text-white/40"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-white/80 text-lg font-semibold">No results found</h3>
                    <p className="text-white/60 text-sm max-w-sm">
                      We couldn't find anything matching "{query}". Try different keywords or check your spelling.
                    </p>
                  </div>
                </div>
              )}              
              {/* Native Banner Ad - Always show in search modal */}
              <div className="px-4 sm:px-6 py-4">
                {/* Testing Placeholder - Only in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-lg border-2 border-dashed border-green-400 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2">🔍 SEARCH MODAL BANNER AD</div>
                      <div className="text-sm opacity-90">Banner ad appears here in search popup</div>
                      <div className="text-xs mt-2 opacity-75">Development mode - hidden in production</div>
                    </div>
                  </div>
                )}
                <NativeBannerAdWrapper className="text-center" />
              </div>

              {/* End of Results */}
              {liveResults.length > 0 && !hasMore && !isLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center space-x-3 text-white/50">
                    <div className="h-px w-12 bg-white/20"></div>
                    <span className="text-sm">That's everything!</span>
                    <div className="h-px w-12 bg-white/20"></div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default memo(SearchBar);