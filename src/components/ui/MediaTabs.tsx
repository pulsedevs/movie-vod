'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, Genre } from '@/types';
import MediaList from '@/components/media/MediaList';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Filter, Film, Tv } from 'lucide-react';

interface MediaTabsProps {
  title: string;
  movieData: MediaItem[] | Promise<MediaItem[]>;
  tvData: MediaItem[] | Promise<MediaItem[]>;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  layout?: 'grid' | 'carousel';
  priority?: boolean;
  hideFilters?: boolean;
}

const MediaTabs: React.FC<MediaTabsProps> = ({
  title,
  movieData,
  tvData,
  isLoading = false,
  error = null,
  onRetry,
  layout = 'carousel',
  hideFilters = false,
}) => {
  const storageKey = `tab-preference-${title ? title.toLowerCase().replace(/\s+/g, '-') : 'default'}`;
  const [savedTab, setSavedTab] = useLocalStorage<'movie' | 'tv'>(storageKey, 'movie');
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>(savedTab);
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<{ movie: Genre[], tv: Genre[] }>({ movie: [], tv: [] });
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreError, setGenreError] = useState<string | null>(null);
  
  // Add state for processed data
  const [processedMovieData, setProcessedMovieData] = useState<MediaItem[]>([]);
  const [processedTvData, setProcessedTvData] = useState<MediaItem[]>([]);
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Process potential Promise data
  useEffect(() => {
    const processData = async () => {
      setIsProcessingData(true);
      try {
        // Process movie data
        if (movieData instanceof Promise) {
          console.warn("MediaTabs received Promise for movieData, resolving...");
          const resolvedMovieData = await movieData;
          setProcessedMovieData(resolvedMovieData || []);
        } else {
          setProcessedMovieData(movieData || []);
        }
        
        // Process TV data
        if (tvData instanceof Promise) {
          console.warn("MediaTabs received Promise for tvData, resolving...");
          const resolvedTvData = await tvData;
          setProcessedTvData(resolvedTvData || []);
        } else {
          setProcessedTvData(tvData || []);
        }
      } catch (error) {
        console.error("Error processing media data in MediaTabs:", error);
      } finally {
        setIsProcessingData(false);
      }
    };
    
    processData();
  }, [movieData, tvData]);

  const showMovieTab = processedMovieData && processedMovieData.length > 0;
  const showTvTab = processedTvData && processedTvData.length > 0;
  const showTabs = showMovieTab && showTvTab;
  const sectionId = title.toLowerCase().replace(/\s+/g, '-');
  const hasTrendingBadge = title.toLowerCase().includes('trending');

  useEffect(() => {
    const fetchGenres = async () => {
      setGenreError(null);
      try {
        const response = await fetch('/api/genres');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch genres');
        }
        const data: { movie: Genre[], tv: Genre[] } = await response.json();
        setGenres(data);
      } catch (err) {
        console.error("Error fetching genres in component:", err);
        setGenreError(err instanceof Error ? err.message : 'Could not load genres');
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    if (!showMovieTab && showTvTab) {
      setActiveTab('tv');
      setSavedTab('tv');
    } else if (showMovieTab && !showTvTab) {
      setActiveTab('movie');
      setSavedTab('movie');
    }
  }, [showMovieTab, showTvTab, setSavedTab]);

  const handleTabChange = (tab: 'movie' | 'tv') => {
    setActiveTab(tab);
    setSavedTab(tab);
    setSelectedGenre(null);
  };

  const filteredData = selectedGenre
    ? (activeTab === 'movie' ? processedMovieData : processedTvData).filter((item) =>
        item.genre_ids?.includes(selectedGenre)
      )
    : activeTab === 'movie'
    ? processedMovieData
    : processedTvData;

  const currentGenreList = genres[activeTab] || [];

  // If we're still processing data, consider it as loading
  const combinedIsLoading = isLoading || isProcessingData;

  return (
    <section aria-labelledby={`${sectionId}-heading`} className="py-4 animate-fadeIn">
      <div className={`flex items-center mb-5 min-h-[52px] ${showTabs ? 'justify-between' : 'justify-start'} flex-col sm:flex-row gap-4`}>
        <div className="flex items-center space-x-2">
          <h2
            id={`${sectionId}-heading`}
            className="text-xl md:text-2xl font-bold text-white"
          >
            {title}
          </h2>
          {hasTrendingBadge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-700 text-white">
              Live
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!hideFilters && !combinedIsLoading && filteredData.length > 0 && currentGenreList.length > 0 && !genreError && (
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
                aria-label="Toggle filters"
                title="Filter content"
              >
                <Filter size={18} />
              </button>
              {showFilters && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg p-4 z-10"
                >
                  <h3 className="text-sm font-semibold text-white mb-2">Filter by Genre</h3>
                  <select
                    value={selectedGenre || ''}
                    onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  >
                    <option value="">All Genres</option>
                    {currentGenreList.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {genreError && (
            <span className="text-xs text-red-400" title={genreError}>Filter Error</span>
          )}
          {showTabs && (
            <div className="flex rounded-full bg-gray-800 p-1" role="tablist" aria-orientation="horizontal">
              <button
                onClick={() => handleTabChange('movie')}
                role="tab"
                aria-selected={activeTab === 'movie'}
                aria-controls={`${sectionId}-panel`}
                className={`flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                  activeTab === 'movie'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Film size={16} className="mr-1" /> Movies
              </button>
              <button
                onClick={() => handleTabChange('tv')}
                role="tab"
                aria-selected={activeTab === 'tv'}
                aria-controls={`${sectionId}-panel`}
                className={`flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                  activeTab === 'tv'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Tv size={16} className="mr-1" /> TV Shows
              </button>
            </div>
          )}
        </div>
      </div>

      <div id={`${sectionId}-panel`} role="tabpanel" className="min-h-[250px] sm:min-h-[290px]">
        <MediaList
          items={filteredData}
          listTitle={`${title} - ${activeTab === 'movie' ? 'Movies' : 'TV Shows'}`}
          isLoading={combinedIsLoading}
          error={error}
          onRetry={onRetry}
          layout={layout}
        />
      </div>
    </section>
  );
};

export default MediaTabs;