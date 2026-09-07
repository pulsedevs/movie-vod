'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FilterPanel from '@/components/browse/FilterPanel';
import PaginatedResults from '@/components/browse/PaginatedResults';
import AnimeSearch from '@/components/browse/AnimeSearch';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import { MediaItem, Genre } from '@/types';
import { FilterProvider } from '@/components/browse/FilterContext';
import { getTvShowUrl } from '@/utils/movieLinks';

interface AnimeClientPageProps {
  initialResults: MediaItem[];
  initialTotalPages: number;
  initialTotalResults: number;
  initialPage: number;
  genres: Genre[];
  initialFilters: {
    genres: string[];
    year?: string;
    sortBy?: string;
    minRating?: string;
    minVoteCount?: string;
    language?: string;
  };
}

export default function AnimeClientPage({
  initialResults,
  initialTotalPages,
  initialTotalResults,
  initialPage,
  genres,
  initialFilters,
}: AnimeClientPageProps) {
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchResults = (results: MediaItem[], isSearching: boolean, query: string) => {
    setSearchResults(results);
    setIsSearchMode(!!query.trim());
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearchMode(false);
    setSearchQuery('');
  };

  return (
    <FilterProvider initialFilters={initialFilters}>
      <main className="container mx-auto px-4 py-6 mt-2">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Browse Anime</h1>
          
          {/* Native Banner Ad */}
          <div className="mb-6">
            <NativeBannerAdWrapper className="text-center" />
          </div>
          
          {/* Search Component */}
          <AnimeSearch 
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
            className="mb-6"
          />
        </div>
        
        {/* Show filters only when not in search mode */}
        {!isSearchMode && (
          <FilterPanel mediaType="anime" genres={genres} />
        )}
        
        <Suspense fallback={
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-transparent border-t-red-500 border-r-red-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-b-purple-500 border-l-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 animate-pulse"></div>
              </div>
              <span className="text-lg font-medium bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Loading anime...
              </span>
            </div>
          </div>
        }>
          {isSearchMode ? (
            // Search Results
            <div className="space-y-6">
              <div className="text-center text-gray-400">
                {searchResults.length > 0 ? (
                  <p>Found {searchResults.length} anime matching "{searchQuery}"</p>
                ) : (
                  <p>No anime found for "{searchQuery}". Try a different search term.</p>
                )}
              </div>
                {searchResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchResults.map((anime) => (
                    <Link
                      key={anime.id}
                      href={getTvShowUrl(anime.id, 'name' in anime ? anime.name : anime.title)}
                      className="group relative block transition-transform duration-300 hover:scale-105"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-800">
                        {anime.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${anime.poster_path}`}
                            alt={'name' in anime ? anime.name : anime.title}
                            fill
                            sizes="(max-width: 640px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, (max-width: 1280px) 18vw, 15vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            quality={65}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No Image
                          </div>
                        )}
                        
                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      {/* Anime info */}
                      <div className="mt-2 space-y-1">
                        <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                          {'name' in anime ? anime.name : anime.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{('first_air_date' in anime ? anime.first_air_date : anime.release_date)?.split('-')[0] || 'Unknown'}</span>
                          {anime.vote_average > 0 && (
                            <span className="flex items-center gap-1">
                              ⭐ {anime.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Normal filtered results
            <PaginatedResults
              initialResults={initialResults}
              initialTotalPages={initialTotalPages}
              initialTotalResults={initialTotalResults}
              initialPage={initialPage}
              mediaType="anime"
            />
          )}
        </Suspense>
      </main>
    </FilterProvider>
  );
}
