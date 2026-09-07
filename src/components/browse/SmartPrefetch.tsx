'use client';

import { useEffect, useRef } from 'react';

interface SmartPrefetchProps {
  currentPage: number;
  totalPages: number;
  mediaType: 'movie' | 'tv' | 'anime';
  filters: any;
  onPrefetch: (page: number) => void;
}

export default function SmartPrefetch({
  currentPage,
  totalPages,
  mediaType,
  filters,
  onPrefetch,
}: SmartPrefetchProps) {
  const prefetchedPages = useRef(new Set<number>());
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Prefetch next page after 2 seconds of user inactivity
    prefetchTimeoutRef.current = setTimeout(() => {
      const nextPage = currentPage + 1;
      
      if (
        nextPage <= totalPages && 
        !prefetchedPages.current.has(nextPage)
      ) {
        console.log(`[SmartPrefetch] Prefetching page ${nextPage}`);
        prefetchedPages.current.add(nextPage);
        onPrefetch(nextPage);
      }
    }, 2000);

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [currentPage, totalPages, onPrefetch]);

  // Reset prefetched pages when filters change
  useEffect(() => {
    prefetchedPages.current.clear();
  }, [filters, mediaType]);

  return null; // This is a utility component
}
