'use client';

import { useState, useEffect } from 'react';
import { MediaItem } from '@/types';
import { useToast } from '@/components/ui/toast';
import { normalizeId } from '@/lib/utils';

const WATCHLIST_KEY = 'movie-app-watchlist';

type WatchlistItem = MediaItem & {
  addedAt: string;
};

interface UseLibraryReturn {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: MediaItem) => Promise<void>;
  removeFromWatchlist: (id: number | string, mediaType: 'movie' | 'tv') => void;
  isInWatchlist: (id: number | string, mediaType: 'movie' | 'tv') => boolean;
  clearWatchlist: () => void;
  isLoading: boolean;
}

export function useLibrary(): UseLibraryReturn {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  // Load watchlist from localStorage when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    
    try {
      const savedWatchlist = localStorage.getItem(WATCHLIST_KEY);
      
      if (savedWatchlist) {
        try {
          const parsedWatchlist = JSON.parse(savedWatchlist);
          if (process.env.NODE_ENV === 'development') {
            console.log('📚 Loaded watchlist from localStorage:', { length: parsedWatchlist.length });
          }
          
          // Validate that it's an array
          if (Array.isArray(parsedWatchlist)) {
            setWatchlist(parsedWatchlist);
          } else {
            console.error('Invalid watchlist format in localStorage, expected array');
            setWatchlist([]);
          }
        } catch (parseError) {
          console.error('Error parsing watchlist from localStorage:', parseError);
          setWatchlist([]);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('No watchlist found in localStorage');
        }
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error loading watchlist from localStorage:', error);
      setWatchlist([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Saving watchlist to localStorage:', { length: watchlist.length });
      }
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error saving watchlist to localStorage:', error);
    }
  }, [watchlist, isLoading]);const addToWatchlist = async (item: MediaItem) => {
    if (!item || !item.id || !item.media_type) {
      console.error('Invalid item to add to watchlist:', item);
      showToast('Could not add to watchlist: Invalid item', 'error');
      return;
    }
    
    // Ensure ID is consistent (convert to number)
    const normalizedItem = {
      ...item,
      id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id
    };
    
    // Don't add if already in watchlist
    if (isInWatchlist(normalizedItem.id, normalizedItem.media_type as 'movie' | 'tv')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Item already in watchlist: ${normalizedItem.media_type} ID ${normalizedItem.id}`);
      }
      showToast(`"${normalizedItem.media_type === 'movie' ? normalizedItem.title : normalizedItem.name}" is already in your watchlist`, 'info');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('➕ Adding to watchlist:', { 
        id: normalizedItem.id, 
        mediaType: normalizedItem.media_type,
        idAsString: normalizeId(normalizedItem.id)
      });
    }

    // If poster_path is missing, try to fetch details from API
    let enhancedItem = { ...normalizedItem };
    
    if (!normalizedItem.poster_path) {
      try {
        const response = await fetch(`/api/media/details?id=${normalizedItem.id}&type=${normalizedItem.media_type}`);
        if (response.ok) {
          const details = await response.json();
          
          // Update with details from API
          enhancedItem = {
            ...normalizedItem,
            poster_path: details.poster_path,
            backdrop_path: details.backdrop_path,
            overview: details.overview || normalizedItem.overview,
            vote_average: details.vote_average || normalizedItem.vote_average,
            ...(normalizedItem.media_type === 'movie' ? {
              release_date: details.release_date || normalizedItem.release_date
            } : {
              first_air_date: details.first_air_date || normalizedItem.first_air_date
            })
          };
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
        // Continue with original item if fetch fails
      }
    }
      const watchlistItem: WatchlistItem = {
      ...enhancedItem,
      addedAt: new Date().toISOString()
    };
      // Double-check again before adding (in case the data was modified)
    if (!isInWatchlist(watchlistItem.id, watchlistItem.media_type as 'movie' | 'tv')) {
      setWatchlist(prev => [watchlistItem, ...prev]);
      
      // Show success toast
      const itemTitle = watchlistItem.media_type === 'movie' ? watchlistItem.title : watchlistItem.name;
      showToast(`"${itemTitle}" added to your watchlist`, 'success');
    }
  };  const removeFromWatchlist = (id: number | string, mediaType: 'movie' | 'tv') => {
    // Convert ID to string for consistent comparison
    const idToRemove = normalizeId(id);
    
    // Find the item to get its title for the toast
    const itemToRemove = watchlist.find(item => normalizeId(item.id) === idToRemove && item.media_type === mediaType);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Removing from watchlist:', { id, idToRemove, mediaType, itemFound: !!itemToRemove });
    }
    
    setWatchlist(prev => 
      prev.filter(item => !(normalizeId(item.id) === idToRemove && item.media_type === mediaType))
    );
    
    // Show toast notification
    if (itemToRemove) {
      const itemTitle = itemToRemove.media_type === 'movie' ? itemToRemove.title : itemToRemove.name;
      showToast(`"${itemTitle}" removed from your watchlist`, 'info');
    }
  };  const isInWatchlist = (id: number | string, mediaType: 'movie' | 'tv'): boolean => {
    // Always convert IDs to strings for consistent comparison (more reliable than number comparison)
    const idToCheck = normalizeId(id);
    
    // During loading, assume item is not in watchlist
    if (isLoading || !watchlist || watchlist.length === 0) {
      return false;
    }
    
    // Perform comparison with debugging (development only)
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('🔍 isInWatchlist check:', { 
        id, 
        mediaType, 
        idToCheck, 
        watchlistLength: watchlist.length 
      });
    }
    
    const result = watchlist.some(item => {
      // Convert all IDs to strings for comparison to avoid type issues
      const itemId = normalizeId(item.id);
      
      // Direct string comparison is more reliable
      const idsMatch = itemId === idToCheck;
      const typesMatch = item.media_type === mediaType;
      const match = idsMatch && typesMatch;
      
      if (isDev) {
        console.log('🔍 Item comparison:', { 
          itemId, 
          idToCheck, 
          idsMatch,
          mediaType: item.media_type, 
          typesMatch,
          match,
          title: item.media_type === 'movie' ? (item as any).title : (item as any).name
        });
      }
      
      return match;
    });
    
    if (isDev) {
      console.log('🔍 Final result:', result);
    }
    return result;
  };
    const clearWatchlist = () => {
    setWatchlist([]);
    // The useEffect will automatically save the empty array to localStorage
  };
    return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
    isLoading
  };
}