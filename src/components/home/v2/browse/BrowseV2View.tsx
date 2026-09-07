'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MediaItem, Genre } from '@/types';
import { FilterProvider } from '@/components/browse/FilterContext';
import PaginatedResults from '@/components/browse/PaginatedResults';
import MediaCard from '@/components/media/MediaCard';
import HomeSearchField from '../HomeSearchField';
import BrowseV2FilterBar from './BrowseV2FilterBar';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import { BROWSE_V2_GRID_CLASS } from './browseV2Grid';
import type { BrowseInitialFilters, BrowseMediaType } from '@/lib/browse/loadBrowsePage';
import useDebounce from '@/hooks/useDebounce';
import { navThemes } from '../navThemes';

const searchPlaceholders: Record<BrowseMediaType, string> = {
  movie: 'Search movies...',
  tv: 'Search TV shows...',
  anime: 'Search anime...',
};

const PAGE_TITLE: Record<BrowseMediaType, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
  anime: 'Anime',
};

interface BrowseV2ViewProps {
  mediaType: BrowseMediaType;
  genres: Genre[];
  initialResults: MediaItem[];
  initialTotalPages: number;
  initialTotalResults: number;
  initialPage: number;
  initialFilters: BrowseInitialFilters;
}

function BrowseV2Loading() {
  return (
    <div className="min-h-[200px] flex items-center justify-center py-10">
      <div className="w-8 h-8 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}

export default function BrowseV2View({
  mediaType,
  genres,
  initialResults,
  initialTotalPages,
  initialTotalResults,
  initialPage,
  initialFilters,
}: BrowseV2ViewProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const isSearchMode = query.trim().length > 0;

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setActiveQuery('');
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setActiveQuery('');
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setIsSearching(true);
      setActiveQuery(debouncedQuery);
      try {
        if (mediaType === 'anime') {
          const url = new URL('/api/search/anime', window.location.origin);
          url.searchParams.set('query', debouncedQuery);
          url.searchParams.set('page', '1');
          const res = await fetch(url.toString());
          const data = await res.json();
          if (!cancelled) setSearchResults(data.results || []);
        } else {
          const res = await fetch(
            '/api/search?query=' + encodeURIComponent(debouncedQuery)
          );
          const data = await res.json();
          const filtered = (data.results || []).filter(
            (item: MediaItem) => item.media_type === mediaType
          );
          if (!cancelled) setSearchResults(filtered);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, mediaType]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push('/search?query=' + encodeURIComponent(trimmed));
    }
  };

  const mediaTheme = navThemes[mediaType === 'movie' ? 'movies' : mediaType === 'tv' ? 'tv' : 'anime'];

  return (
    <FilterProvider initialFilters={initialFilters}>
      <div className="px-4 sm:px-5 py-4 pb-8 w-full min-w-0">

        {/* Page header */}
        <div className="mb-4 flex items-center gap-2.5 min-w-0">
          <span
            className="h-5 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: mediaTheme.icon }}
          />
          <h1 className="text-base font-semibold leading-none text-white sm:text-lg">
            {isSearchMode && activeQuery
              ? 'Results for "' + activeQuery + '"'
              : PAGE_TITLE[mediaType]}
          </h1>
          {!isSearchMode && initialTotalResults > 0 && (
            <span className="text-[11px] text-white/35">
              {initialTotalResults.toLocaleString()} titles
            </span>
          )}
          {isSearchMode && !isSearching && searchResults.length > 0 && (
            <span className="text-[11px] text-white/35">
              {searchResults.length} found
            </span>
          )}
        </div>

        {/* Search — full-width */}
        <div className="mb-4">
          <HomeSearchField
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
            onSubmit={handleSearchSubmit}
            placeholder={searchPlaceholders[mediaType]}
          />
        </div>

        {/* Offers banner — directly below the search bar */}
        <NativeBannerAdWrapper className="text-center" />

        {!isSearchMode && <BrowseV2FilterBar mediaType={mediaType} genres={genres} />}

        {isSearchMode ? (
          <div>
            {isSearching ? (
              <BrowseV2Loading />
            ) : (
              <>
                {searchResults.length === 0 && (
                  <p className="text-xs text-white/45 mb-3">
                    No results for &ldquo;{activeQuery}&rdquo;
                  </p>
                )}
                {searchResults.length > 0 && (
                  <div className={BROWSE_V2_GRID_CLASS}>
                    {searchResults.map((item) => (
                      <MediaCard key={item.id} item={item} compact />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <Suspense fallback={<BrowseV2Loading />}>
            <PaginatedResults
              initialResults={initialResults}
              initialTotalPages={initialTotalPages}
              initialTotalResults={initialTotalResults}
              initialPage={initialPage}
              mediaType={mediaType}
              gridClassName={BROWSE_V2_GRID_CLASS}
              compact
              compactCards
            />
          </Suspense>
        )}
      </div>
    </FilterProvider>
  );
}
