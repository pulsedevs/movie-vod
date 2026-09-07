'use client';

import React, { useState, useEffect } from 'react';
import { TVShow } from '@/types';
import MediaList from '@/components/media/MediaList';

const AnimeSection: React.FC = () => {
  const [animeData, setAnimeData] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/discover?mediaType=anime&limit=20');
        
        if (!response.ok) {
          throw new Error('Failed to fetch anime');
        }
        
        const data = await response.json();
        setAnimeData(data.results || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching anime:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnime();
  }, []);

  const handleRetry = () => {
    setError(null);
    setAnimeData([]);
  };

  if (error) {
    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Popular Anime</h2>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-400 mb-2">Failed to load anime content</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Popular Anime</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 sm:w-48">
              <div className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
              <div className="mt-2 h-4 bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (animeData.length === 0) {
    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Popular Anime</h2>
        <div className="text-center py-8 text-gray-400">
          <p>No anime content available at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Popular Anime</h2>      <MediaList 
        items={animeData} 
        layout="carousel" 
      />
    </div>
  );
};

export default AnimeSection;
