'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

interface AnimeSearchProps {
  onSearchResults: (results: any[], isSearching: boolean, query: string) => void;
  onClearSearch: () => void;
  className?: string;
}

interface SearchResult {
  id: number;
  title: string;
  media_type: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
}

export default function AnimeSearch({ onSearchResults, onClearSearch, className = '' }: AnimeSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search query to avoid too many API calls
  const debouncedQuery = useDebounce(query, 500);

  // Effect to perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery.trim());
    } else {
      // Clear search results when query is empty
      onSearchResults([], false, '');
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const url = new URL('/api/search/anime', window.location.origin);
      url.searchParams.append('query', searchQuery);
      url.searchParams.append('page', '1');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Pass results to parent component
      onSearchResults(data.results || [], false, searchQuery);
    } catch (err) {
      console.error('Anime search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      onSearchResults([], false, searchQuery);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setError(null);
    onClearSearch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search anime titles..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg 
                     bg-gray-800/50 text-white placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200 ease-in-out
                     hover:bg-gray-800/70"
          maxLength={100}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center
                       text-gray-400 hover:text-white transition-colors"
            type="button"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-400 bg-red-900/20 border border-red-500/30 
                        rounded-md px-3 py-2 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {query && !error && (
        <div className="mt-2 text-sm text-gray-400">
          {isSearching ? (
            <span>Searching for "{query}"...</span>
          ) : (
            <span>Search results for "{query}"</span>
          )}
        </div>
      )}
    </div>
  );
}
