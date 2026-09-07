'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem } from '@/types';

interface VirtualPageSizeProps {
  initialResults: MediaItem[];
  pageSize: number;
  onPageSizeChange: (newSize: number) => void;
  onResultsChange: (results: MediaItem[], totalPages: number) => void;
  fetchMorePages: (pagesNeeded: number) => Promise<MediaItem[]>;
}

const PAGE_SIZE_OPTIONS = [20, 40, 60]; // Best options for UX

export default function VirtualPageSize({
  initialResults,
  pageSize,
  onPageSizeChange,
  onResultsChange,
  fetchMorePages,
}: VirtualPageSizeProps) {
  const [allResults, setAllResults] = useState<MediaItem[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);

  const handlePageSizeChange = async (newSize: number) => {
    if (newSize <= allResults.length) {
      // Use cached results
      const slicedResults = allResults.slice(0, newSize);
      onResultsChange(slicedResults, Math.ceil(allResults.length / newSize));
      onPageSizeChange(newSize);
    } else {
      // Need to fetch more pages
      setIsLoading(true);
      try {
        const pagesNeeded = Math.ceil(newSize / 20) - Math.ceil(allResults.length / 20);
        const newResults = await fetchMorePages(pagesNeeded);
        const updatedResults = [...allResults, ...newResults];
        
        setAllResults(updatedResults);
        onResultsChange(updatedResults.slice(0, newSize), Math.ceil(updatedResults.length / newSize));
        onPageSizeChange(newSize);
      } catch (error) {
        console.error('Failed to fetch more results:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-sm text-gray-400">Show:</span>
      <select
        value={pageSize}
        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        disabled={isLoading}
        className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-400">per page</span>
      {isLoading && (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}
