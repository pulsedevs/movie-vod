'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface FilterState {
  genres: string[];
  year?: string;
  sortBy?: string;
  minRating?: string;
  minVoteCount?: string;
  language?: string;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode; initialFilters: FilterState }> = ({
  children,
  initialFilters,
}) => {  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const isUpdatingUrl = useRef(false);
  const [filters, setFiltersState] = useState<FilterState>({
    genres: initialFilters.genres || [],
    year: initialFilters.year,
    sortBy: initialFilters.sortBy || 'popularity.desc',
    minRating: initialFilters.minRating || '0',
    minVoteCount: initialFilters.minVoteCount || 'auto',
    language: initialFilters.language, // Don't set default here, keep undefined if not set
  });
  const setFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      console.log('[FilterContext] Setting filters:', newFilters);
      setFiltersState((prev) => {
        const updated = { ...prev, ...newFilters };
        console.log('[FilterContext] Updated filters:', updated);
        return updated;
      });
    },
    []
  );
  const clearFilters = useCallback(() => {
    setFiltersState({
      genres: [],
      year: undefined,
      sortBy: 'popularity.desc',
      minRating: '0',
      minVoteCount: 'auto',
      language: undefined, // Don't set default language when clearing
    });
  }, []);  // Update URL when filters change (with debouncing to prevent rapid updates)
  useEffect(() => {
    // Skip URL sync on initial mount to prevent loops
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Prevent URL update loops
    if (isUpdatingUrl.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      isUpdatingUrl.current = true;
      
      const params = new URLSearchParams(searchParams.toString());
      let hasChanges = false;

      if (filters.genres.length > 0) {
        if (params.get('genres') !== filters.genres.join(',')) {
          params.set('genres', filters.genres.join(','));
          hasChanges = true;
        }
      } else {
        if (params.has('genres')) {
          params.delete('genres');
          hasChanges = true;
        }
      }

      if (filters.year) {
        if (params.get('year') !== filters.year) {
          params.set('year', filters.year);
          hasChanges = true;
        }
      } else {
        if (params.has('year')) {
          params.delete('year');
          hasChanges = true;
        }
      }

      if (filters.sortBy && filters.sortBy !== 'popularity.desc') {
        if (params.get('sortBy') !== filters.sortBy) {
          params.set('sortBy', filters.sortBy);
          hasChanges = true;
        }
      } else {
        if (params.has('sortBy')) {
          params.delete('sortBy');
          hasChanges = true;
        }
      }      if (filters.minRating && filters.minRating !== '0') {
        if (params.get('minRating') !== filters.minRating) {
          params.set('minRating', filters.minRating);
          hasChanges = true;
        }
      } else {
        if (params.has('minRating')) {
          params.delete('minRating');
          hasChanges = true;
        }
      }

      if (filters.minVoteCount && filters.minVoteCount !== 'auto') {
        if (params.get('minVoteCount') !== filters.minVoteCount) {
          params.set('minVoteCount', filters.minVoteCount);
          hasChanges = true;
        }
      } else {
        if (params.has('minVoteCount')) {
          params.delete('minVoteCount');
          hasChanges = true;
        }
      }

      if (filters.language && filters.language !== 'en-US') {
        if (params.get('language') !== filters.language) {
          params.set('language', filters.language);
          hasChanges = true;
        }
      } else {
        if (params.has('language')) {
          params.delete('language');
          hasChanges = true;
        }
      }      // Only remove page param when filters actually change (not on initial load)
      if (hasChanges && params.has('page')) {
        params.delete('page');
      }      // Only update URL if there are actual changes
      if (hasChanges) {
        window.location.hash = '';
        const newUrl = `${pathname}?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
      }
      
      // Reset the flag after a short delay to allow for URL processing
      setTimeout(() => {
        isUpdatingUrl.current = false;
      }, 50);
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, pathname, router, searchParams]);

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};