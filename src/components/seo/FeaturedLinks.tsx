// components/seo/FeaturedLinks.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';
import { Movie, TVShow } from '@/types';

interface FeaturedLinksProps {
  className?: string;
  excludeId?: number;
  excludeType?: 'movie' | 'tv';
}

export default function FeaturedLinks({ className = '', excludeId, excludeType }: FeaturedLinksProps) {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [featuredTV, setFeaturedTV] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setIsLoading(true);
        
        // Fetch trending movies from today (most recent/fresh content)
        const trendingMoviesResponse = await fetch('/api/trending?mediaType=movie&timeWindow=day');
        const trendingMoviesData = await trendingMoviesResponse.json();
        
        // Fetch trending TV shows from today
        const trendingTvResponse = await fetch('/api/trending?mediaType=tv&timeWindow=day');
        const trendingTvData = await trendingTvResponse.json();
        
        // If trending doesn't provide enough content, supplement with popular
        let movieResults = Array.isArray(trendingMoviesData) ? trendingMoviesData : [];
        let tvResults = Array.isArray(trendingTvData) ? trendingTvData : [];
        
        // If we don't have enough trending content, fetch popular as backup
        if (movieResults.length < 6) {
          const popularMoviesResponse = await fetch('/api/discover?mediaType=movie&page=1&sortBy=popularity.desc');
          const popularMoviesData = await popularMoviesResponse.json();
          const popularMovies = popularMoviesData.results || [];
          
          // Merge trending and popular, removing duplicates
          const existingIds = new Set(movieResults.map((m: Movie) => m.id));
          const additionalMovies = popularMovies.filter((m: Movie) => !existingIds.has(m.id));
          movieResults = [...movieResults, ...additionalMovies];
        }
        
        if (tvResults.length < 6) {
          const popularTvResponse = await fetch('/api/discover?mediaType=tv&page=1&sortBy=popularity.desc');
          const popularTvData = await popularTvResponse.json();
          const popularTv = popularTvData.results || [];
          
          // Merge trending and popular, removing duplicates
          const existingIds = new Set(tvResults.map((tv: TVShow) => tv.id));
          const additionalTv = popularTv.filter((tv: TVShow) => !existingIds.has(tv.id));
          tvResults = [...tvResults, ...additionalTv];
        }
        
        // Filter out excluded items and take first 6
        const filteredMovies = movieResults
          .filter((item: Movie) => !(excludeType === 'movie' && item.id === excludeId))
          .slice(0, 6);
          
        const filteredTV = tvResults
          .filter((item: TVShow) => !(excludeType === 'tv' && item.id === excludeId))
          .slice(0, 6);
        
        setFeaturedMovies(filteredMovies);
        setFeaturedTV(filteredTV);
      } catch (error) {
        console.error('Failed to fetch featured content:', error);
        // Fallback to empty arrays
        setFeaturedMovies([]);
        setFeaturedTV([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
  }, [excludeId, excludeType]);

  if (isLoading) {
    return (
      <div className={`bg-gray-800/30 rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-3">Featured Content</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/30 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3">Trending & Latest Content</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trending Movies */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Trending Movies</h4>
          <div className="space-y-2">
            {featuredMovies.map((movie) => (
              <Link
                key={movie.id}
                href={getMovieUrl(movie.id, movie.title)}
                className="block text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                title={movie.title}
              >
                {movie.title} ({movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'})
              </Link>
            ))}
          </div>
        </div>
        
        {/* Trending TV Shows */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Trending TV Shows</h4>
          <div className="space-y-2">
            {featuredTV.map((show) => (
              <Link
                key={show.id}
                href={getTvShowUrl(show.id, show.name)}
                className="block text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                title={show.name}
              >
                {show.name} ({show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'})
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Category Links */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/browse/movies" className="text-gray-400 hover:text-white transition-colors">
            All Movies
          </Link>
          <Link href="/browse/tv" className="text-gray-400 hover:text-white transition-colors">
            All TV Shows
          </Link>
          <Link href="/browse/anime" className="text-gray-400 hover:text-white transition-colors">
            Anime
          </Link>
        </div>
      </div>
    </div>
  );
}
