'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useDebounce from '@/hooks/useDebounce';
import { MediaItem } from '@/types';
import MediaCard from '@/components/media/MediaCard';
import { useDetailHref } from '@/hooks/useDetailHref';
import HomeHeroLogo from './HomeHeroLogo';
import HomeSearchField from './HomeSearchField';

export default function HomeHeroSearch() {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const { mediaHref } = useDetailHref();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const showResults = isFocused && query.trim().length > 0;

  const fetchResults = useCallback(
    async (searchQuery: string, pageNum: number, append = false) => {
      if (!searchQuery.trim()) {
        setLiveResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(searchQuery)}&page=${pageNum}`
        );
        if (response.ok) {
          const data = await response.json();
          if (append) {
            setLiveResults((prev) => [...prev, ...(data.results || [])]);
          } else {
            setLiveResults(data.results || []);
          }
          setHasMore(data.total_pages > pageNum);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchResults(debouncedQuery, 1, false);
  }, [debouncedQuery, fetchResults]);

  useEffect(() => {
    if (!showResults || !hasMore) return;

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

    return () => observer.disconnect();
  }, [showResults, hasMore, isLoading, page, debouncedQuery, fetchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    setIsFocused(true);
  }, []);

  const handleCardClick = (item: MediaItem) => {
    const url = mediaHref(item);
    setIsFocused(false);
    router.push(url);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
      setIsFocused(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="absolute inset-x-0 top-0 z-30 pl-2 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-8 pt-1.5 sm:pt-2 pointer-events-none"
    >
      <div className="absolute inset-x-0 top-0 h-44 sm:h-48 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

      <div className="relative w-full flex items-center gap-4 sm:gap-5 lg:gap-6 pointer-events-auto">
        <HomeHeroLogo className="shrink-0 flex-none" />

        <div className="flex-1 min-w-0 flex justify-center pr-14 sm:pr-20 lg:pr-28 xl:pr-36 pl-1 sm:pl-2">
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <HomeSearchField
            value={query}
            onChange={setQuery}
            onFocus={() => setIsFocused(true)}
            onSubmit={handleSearch}
            placeholder="Search movies, TV shows, anime..."
            inputRef={inputRef}
            autoFocus
          />

        {showResults && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(95vw,720px)] rounded-xl border border-white/10 bg-[#0d0d0d]/97 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
            <div className="max-h-[min(60vh,480px)] overflow-y-auto scrollbar-hide p-4">
              {isLoading && page === 1 && (
                <div className="flex items-center justify-center gap-3 py-10 text-white/50 text-sm">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
                  Searching...
                </div>
              )}

              {!isLoading && liveResults.length === 0 && (
                <p className="text-center text-white/50 text-sm py-10">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {liveResults.length > 0 && (
                <>
                  <p className="text-white/50 text-xs mb-3 px-1">
                    {liveResults.length} result{liveResults.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {liveResults.map((item) => (
                      <div
                        key={`${item.id}-${item.media_type}`}
                        className="cursor-pointer rounded-lg overflow-hidden hover:ring-1 hover:ring-white/20 transition-shadow"
                        onClick={() => handleCardClick(item)}
                      >
                        <MediaCard item={item} onClick={() => handleCardClick(item)} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {liveResults.length > 0 && hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isLoading && page > 1 && (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
