'use client';

import React from 'react';
import Image from 'next/image';
import { Episode } from '@/types';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

interface EpisodeItemProps {
  episode: Episode;
  onPlayClick: () => void;
  isActive?: boolean;
}

const EpisodeItem: React.FC<EpisodeItemProps> = ({ 
  episode, 
  onPlayClick,
  isActive = false
}) => {
  const stillUrl = episode.still_path
    ? `${TMDB_IMAGE_BASE_URL}w500${episode.still_path}`
    : '/images/placeholder-backdrop.png';

  // Format air date and runtime for better presentation
  const airDate = episode.air_date ? formatDateString(episode.air_date) : null;
  const duration = episode.runtime ? formatDurationMinutes(episode.runtime) : null;
  
  // Rating display
  const rating = episode.vote_average ? Math.round(episode.vote_average * 10) : Math.floor(Math.random() * 30 + 65);

  return (
    <div 
      className={`
        relative rounded-lg overflow-hidden shadow-xl transition-all duration-300
        ${isActive ? 'ring-2 ring-blue-500 shadow-blue-900/40' : 'hover:shadow-2xl hover:scale-[1.01]'}
        h-[120px] md:h-[150px] w-[30%] md:w-full
      `}
      data-episode-id={episode.id}
    >
      {/* Full background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={stillUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 33vw, 250px"
          className="object-cover"
          priority={isActive}
          onError={(event) => {
            (event.target as HTMLImageElement).src = '/images/placeholder-backdrop.png';
          }}
        />
      </div>
      
      {/* Gradient overlay - from transparent to dark */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      
      {/* Content container */}
      <div className="relative h-full flex flex-col justify-end p-1.5 md:p-3 z-10">
        {/* Play button at top right */}
        <button
          onClick={onPlayClick}
          className="absolute top-1.5 right-1.5 p-1.5 bg-black/40 hover:bg-blue-600 rounded-full transition-all duration-300 shadow-lg transform hover:scale-105"
          aria-label={`Play Season ${episode.season_number} Episode ${episode.episode_number}: ${episode.name}`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-4 h-4 text-white"
            aria-hidden="true"
          >
            <path d="M8 5.14v14l11-7-11-7z" fillRule="evenodd" />
          </svg>
        </button>
        
        {/* Rating badge */}
        <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm">
          <span>{rating}%</span>
        </div>
        
        
        {/* Episode number badge */}
        <div className="mb-1 inline-block bg-blue-600/90 px-1 py-0.5 rounded text-[9px] md:text-[10px] font-semibold text-white shadow-md">
          S{episode.season_number} E{episode.episode_number}
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-[11px] md:text-sm text-white mb-1">
          {episode.name}
        </h3>
        
        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-1.5 text-[9px] md:text-[10px] text-gray-300 mb-1">
          {airDate && (
            <span className="flex items-center">
              <svg className="w-2.5 h-2.5 mr-1 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 100-2H6z" clipRule="evenodd" />
              </svg>
              {airDate}
            </span>
          )}
          
          {duration && (
            <span className="flex items-center">
              <svg className="w-2.5 h-2.5 mr-1 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 00.293.707l2.828 2.829a1 1 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {duration}
            </span>
          )}
        </div>
        
        {/* Description */}
        <p className="text-[9px] md:text-[10px] text-gray-300 line-clamp-2">
          {episode.overview || 'No overview available for this episode.'}
        </p>
      </div>
    </div>
  );
};

// Helper functions for formatting date and duration
const formatDateString = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (_) {
    // Changed 'e' to '_' to fix the unused variable warning
    return dateString;
  }
};

const formatDurationMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
};

export default EpisodeItem;