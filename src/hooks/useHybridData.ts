import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MediaItem } from '@/types';
import { notifyLibraryStorageUpdated, LIBRARY_KEYS } from '@/utils/libraryStorage';

export interface WatchlistItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  backdrop_path?: string;
  genre_ids?: number[];
  created_at: string;
}

export interface WatchHistoryItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  season_number?: number;
  episode_number?: number;
  progress: number;
  watched_at: string;
  created_at: string;
}

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Convert MediaItem to WatchlistItem format
const convertMediaItemToWatchlistItem = (item: MediaItem): Omit<WatchlistItem, 'id' | 'created_at'> => {
  return {
    media_id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
    media_type: item.media_type,
    title: item.media_type === 'movie' ? (item as any).title : (item as any).name,
    poster_path: item.poster_path || undefined,
    overview: item.overview,
    release_date: item.media_type === 'movie' ? (item as any).release_date : (item as any).first_air_date,
    vote_average: item.vote_average,
    backdrop_path: item.backdrop_path || undefined,
    genre_ids: item.genre_ids || [],
  };
};

// Convert WatchlistItem to MediaItem format for UI compatibility
const convertWatchlistItemToMediaItem = (item: WatchlistItem): MediaItem => {
  const baseItem = {
    id: item.media_id,
    poster_path: item.poster_path || null,
    overview: item.overview || '',
    vote_average: item.vote_average || 0,
    backdrop_path: item.backdrop_path || null,
    genre_ids: item.genre_ids || [],
    media_type: item.media_type,
  };

  if (item.media_type === 'movie') {
    return {
      ...baseItem,
      title: item.title,
      release_date: item.release_date || '',
      media_type: 'movie' as const,
    };
  } else {
    return {
      ...baseItem,      name: item.title,
      first_air_date: item.release_date || '',
      media_type: 'tv' as const,
    };
  }
};

export const useHybridData = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);

  const localStorageAvailable = isLocalStorageAvailable();

  // Determine storage strategy
  useEffect(() => {
    // Priority: localStorage first, Supabase as fallback
    if (localStorageAvailable) {
      setUseSupabase(false);
    } else if (user) {
      setUseSupabase(true);
    }
  }, [localStorageAvailable, user]);

  // Load data from appropriate storage
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!useSupabase) {
        // Load from localStorage
        const savedWatchlist = localStorage.getItem(LIBRARY_KEYS.watchlist);
        const savedHistory = localStorage.getItem(LIBRARY_KEYS.watchHistory);
        
        setWatchlist(savedWatchlist ? JSON.parse(savedWatchlist) : []);
        setWatchHistory(savedHistory ? JSON.parse(savedHistory) : []);
      } else if (user) {
        // Load from Supabase
        const [watchlistResponse, historyResponse] = await Promise.all([
          supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('watch_history')
            .select('*')
            .eq('user_id', user.id)
            .order('watched_at', { ascending: false })
        ]);

        if (watchlistResponse.error) throw watchlistResponse.error;
        if (historyResponse.error) throw historyResponse.error;

        setWatchlist((watchlistResponse.data as unknown as WatchlistItem[]) || []);
        setWatchHistory((historyResponse.data as unknown as WatchHistoryItem[]) || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to empty arrays
      setWatchlist([]);
      setWatchHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [useSupabase, user]);

  // Save data to appropriate storage
  const saveWatchlist = useCallback(async (newWatchlist: WatchlistItem[]) => {
    try {
      if (!useSupabase) {
        // Save to localStorage
        localStorage.setItem(LIBRARY_KEYS.watchlist, JSON.stringify(newWatchlist));
        setWatchlist(newWatchlist);
        notifyLibraryStorageUpdated(LIBRARY_KEYS.watchlist);
      } else if (user) {
        // Save to Supabase - we'll handle individual operations
        setWatchlist(newWatchlist);
      }
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }, [useSupabase, user]);

  const saveWatchHistory = useCallback(async (newHistory: WatchHistoryItem[]) => {
    try {
      if (!useSupabase) {
        // Save to localStorage
        localStorage.setItem(LIBRARY_KEYS.watchHistory, JSON.stringify(newHistory));
        setWatchHistory(newHistory);
        notifyLibraryStorageUpdated(LIBRARY_KEYS.watchHistory);
      } else if (user) {
        // Save to Supabase - we'll handle individual operations
        setWatchHistory(newHistory);
      }
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  }, [useSupabase, user]);
  // Add to watchlist - accepts MediaItem or direct watchlist item data
  const addToWatchlist = useCallback(async (item: MediaItem | Omit<WatchlistItem, 'id' | 'created_at'>) => {
    try {
      // Convert MediaItem to WatchlistItem format if needed
      const watchlistData = 'media_id' in item ? item : convertMediaItemToWatchlistItem(item);
      
      const newItem: WatchlistItem = {
        ...watchlistData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      if (!useSupabase) {
        // Add to localStorage
        const newWatchlist = [newItem, ...watchlist];
        await saveWatchlist(newWatchlist);
      } else if (user) {
        // Add to Supabase
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            media_id: watchlistData.media_id,
            media_type: watchlistData.media_type,
            title: watchlistData.title,
            poster_path: watchlistData.poster_path,
            overview: watchlistData.overview,
            release_date: watchlistData.release_date,
          });

        if (error) throw error;
        
        // Update local state
        setWatchlist([newItem, ...watchlist]);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }, [watchlist, saveWatchlist, useSupabase, user]);
  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (mediaId: number | string, mediaType: 'movie' | 'tv') => {
    try {
      const normalizedId = typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId;
      
      if (!useSupabase) {
        // Remove from localStorage
        const newWatchlist = watchlist.filter(
          item => !(item.media_id === normalizedId && item.media_type === mediaType)
        );
        await saveWatchlist(newWatchlist);
      } else if (user) {
        // Remove from Supabase
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', normalizedId)
          .eq('media_type', mediaType);

        if (error) throw error;

        // Update local state
        const newWatchlist = watchlist.filter(
          item => !(item.media_id === normalizedId && item.media_type === mediaType)
        );
        setWatchlist(newWatchlist);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }, [watchlist, saveWatchlist, useSupabase, user]);

  // Add to watch history
  const addToWatchHistory = useCallback(async (item: Omit<WatchHistoryItem, 'id' | 'created_at' | 'watched_at'>) => {
    try {
      const newItem: WatchHistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        watched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      if (!useSupabase) {
        // Add to localStorage
        const newHistory = [newItem, ...watchHistory];
        await saveWatchHistory(newHistory);
      } else if (user) {
        // Add to Supabase
        const { error } = await supabase
          .from('watch_history')
          .insert({
            user_id: user.id,
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            season_number: item.season_number,
            episode_number: item.episode_number,
            progress: item.progress,
          });

        if (error) throw error;

        // Update local state
        setWatchHistory([newItem, ...watchHistory]);
      }
    } catch (error) {
      console.error('Error adding to watch history:', error);
      throw error;
    }
  }, [watchHistory, saveWatchHistory, useSupabase, user]);

  // Update watch progress
  const updateWatchProgress = useCallback(async (
    mediaId: number, 
    mediaType: 'movie' | 'tv', 
    progress: number,
    seasonNumber?: number,
    episodeNumber?: number
  ) => {
    try {
      if (!useSupabase) {
        // Update in localStorage
        const existingIndex = watchHistory.findIndex(
          item => item.media_id === mediaId && 
                   item.media_type === mediaType &&
                   item.season_number === seasonNumber &&
                   item.episode_number === episodeNumber
        );

        let newHistory;
        if (existingIndex >= 0) {
          // Update existing entry
          newHistory = [...watchHistory];
          newHistory[existingIndex] = {
            ...newHistory[existingIndex],
            progress,
            watched_at: new Date().toISOString(),
          };
        } else {
          // Create new entry
          const newItem: WatchHistoryItem = {
            id: crypto.randomUUID(),
            media_id: mediaId,
            media_type: mediaType,
            title: `${mediaType} ${mediaId}`, // This should be updated with actual title
            progress,
            season_number: seasonNumber,
            episode_number: episodeNumber,
            watched_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          newHistory = [newItem, ...watchHistory];
        }

        await saveWatchHistory(newHistory);
      } else if (user) {
        // Update in Supabase
        const { error } = await supabase
          .from('watch_history')
          .upsert({
            user_id: user.id,
            media_id: mediaId,
            media_type: mediaType,
            season_number: seasonNumber,
            episode_number: episodeNumber,
            progress,
            watched_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Reload data to get updated state
        await loadData();
      }
    } catch (error) {
      console.error('Error updating watch progress:', error);
      throw error;
    }
  }, [watchHistory, saveWatchHistory, useSupabase, user, loadData]);

  // Clear watchlist
  const clearWatchlist = useCallback(async () => {
    try {
      if (!useSupabase) {
        // Clear from localStorage
        localStorage.setItem(LIBRARY_KEYS.watchlist, JSON.stringify([]));
        setWatchlist([]);
        notifyLibraryStorageUpdated(LIBRARY_KEYS.watchlist);
      } else if (user) {
        // Clear from Supabase
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      throw error;
    }
  }, [useSupabase, user]);
  // Check if item is in watchlist
  const isInWatchlist = useCallback((mediaId: number | string, mediaType: 'movie' | 'tv') => {
    const normalizedId = typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId;
    return watchlist.some(item => item.media_id === normalizedId && item.media_type === mediaType);
  }, [watchlist]);

  // Get watch progress for an item
  const getWatchProgress = useCallback((
    mediaId: number, 
    mediaType: 'movie' | 'tv',
    seasonNumber?: number,
    episodeNumber?: number
  ) => {
    const historyItem = watchHistory.find(
      item => item.media_id === mediaId && 
               item.media_type === mediaType &&
               item.season_number === seasonNumber &&
               item.episode_number === episodeNumber
    );
    return historyItem?.progress || 0;
  }, [watchHistory]);

  // Sync data when switching between storage methods
  const syncData = useCallback(async () => {
    if (localStorageAvailable && user && useSupabase) {
      try {
        // Migration from localStorage to Supabase when user logs in
        const localWatchlist = localStorage.getItem('watchlist');
        const localHistory = localStorage.getItem('watchHistory');

        if (localWatchlist || localHistory) {
          console.log('Syncing local data to Supabase...');
          
          // Sync watchlist
          if (localWatchlist) {
            const parsedWatchlist: WatchlistItem[] = JSON.parse(localWatchlist);
            for (const item of parsedWatchlist) {
              await supabase
                .from('watchlist')
                .upsert({
                  user_id: user.id,
                  media_id: item.media_id,
                  media_type: item.media_type,
                  title: item.title,
                  poster_path: item.poster_path,
                  overview: item.overview,
                  release_date: item.release_date,
                });
            }
          }

          // Sync watch history
          if (localHistory) {
            const parsedHistory: WatchHistoryItem[] = JSON.parse(localHistory);
            for (const item of parsedHistory) {
              await supabase
                .from('watch_history')
                .upsert({
                  user_id: user.id,
                  media_id: item.media_id,
                  media_type: item.media_type,
                  title: item.title,
                  poster_path: item.poster_path,
                  season_number: item.season_number,
                  episode_number: item.episode_number,
                  progress: item.progress,
                  watched_at: item.watched_at,
                });
            }
          }

          console.log('Data sync completed');
        }
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    }
  }, [localStorageAvailable, user, useSupabase]);

  // Load data on mount and when storage strategy changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync data when user logs in and we have localStorage
  useEffect(() => {
    if (user && !useSupabase && localStorageAvailable) {
      syncData();
    }
  }, [user, useSupabase, localStorageAvailable, syncData]);  return {
    watchlist: watchlist.map(convertWatchlistItemToMediaItem),
    rawWatchlist: watchlist, // Keep raw data for internal operations
    watchHistory,
    isLoading,
    useSupabase: !localStorageAvailable && !!user,
    storageType: !useSupabase ? 'localStorage' : 'supabase',
    
    // Watchlist operations
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    isInWatchlist,
    
    // Watch history operations
    addToWatchHistory,
    updateWatchProgress,
    getWatchProgress,
    
    // Utility functions
    loadData,
    syncData,
  };
};
