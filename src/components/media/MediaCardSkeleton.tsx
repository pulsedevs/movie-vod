'use client';

import React from 'react';

const MediaCardSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-900 shadow-md h-full animate-pulse">
      {/* Poster placeholder */}
      <div className="relative aspect-[2/3] w-full bg-gray-800"></div>
      
      {/* Content placeholder */}
      <div className="p-3 sm:p-3 bg-gradient-to-t from-gray-900 to-gray-800">
        {/* Title placeholder */}
        <div className="h-4 sm:h-4 bg-gray-700 rounded w-3/4 mb-2 sm:mb-2"></div>
        
        {/* Info row placeholder */}
        <div className="flex justify-between items-center mt-2 sm:mt-2">
          <div className="h-3 sm:h-3 bg-gray-700 rounded w-1/4"></div>
          <div className="h-3 sm:h-3 bg-gray-700 rounded-full w-1/5"></div>
        </div>
      </div>
      
      {/* Rating badge placeholder */}
      <div className="absolute top-2 sm:top-2 right-2 sm:right-2 z-10 w-8 h-8 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gray-700 rounded-full"></div>
    </div>
  );
};

// Create a component to render multiple skeletons at once
export const MediaListSkeleton: React.FC<{ count?: number, layout?: 'grid' | 'carousel' }> = ({ count = 12, layout = 'grid' }) => {
  if (layout === 'carousel') {
    return (      <div className="flex space-x-3 sm:space-x-4 md:space-x-5 overflow-hidden pb-4 pr-10 sm:pr-20 md:pr-24">
        {Array.from({ length: count }).map((_, index) => (
          <div key={`skeleton-${index}`} className="flex-none w-[142px] sm:w-[200px]">
            <MediaCardSkeleton />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    // Changed from grid-cols-3 to grid-cols-2 on mobile for larger cards
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <MediaCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

export default MediaCardSkeleton;