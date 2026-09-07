'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useHybridData } from '@/hooks/useHybridData';
import {
  LIBRARY_STORAGE_EVENT,
  readContinueWatching,
  readWatchedHistory,
  writeContinueWatching,
  writeWatchedHistory,
  type ContinueWatchingItem,
  type WatchedHistoryItem,
} from '@/utils/libraryStorage';

export type LibraryV2Tab = 'continue' | 'saved' | 'recent';

export function useLibraryPageData() {
  const pathname = usePathname() ?? '';
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    isInWatchlist,
    isLoading: watchlistLoading,
    loadData,
  } = useHybridData();

  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [watchedHistory, setWatchedHistory] = useState<WatchedHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const refreshLocalLists = useCallback(() => {
    setContinueWatching(readContinueWatching());
    setWatchedHistory(readWatchedHistory());
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshLocalLists();
    void loadData();
  }, [pathname, refreshLocalLists, loadData]);

  useEffect(() => {
    const onUpdate = () => {
      refreshLocalLists();
      void loadData();
    };

    window.addEventListener(LIBRARY_STORAGE_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    window.addEventListener('focus', onUpdate);

    return () => {
      window.removeEventListener(LIBRARY_STORAGE_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('focus', onUpdate);
    };
  }, [refreshLocalLists, loadData]);

  const removeContinue = useCallback(
    (id: number | string, mediaType: 'movie' | 'tv') => {
      const updated = continueWatching.filter(
        (item) => !(item.id === id && item.media_type === mediaType)
      );
      writeContinueWatching(updated);
      setContinueWatching(updated);
    },
    [continueWatching]
  );

  const clearContinue = useCallback(() => {
    writeContinueWatching([]);
    setContinueWatching([]);
  }, []);

  const removeWatched = useCallback(
    (id: number | string, mediaType: 'movie' | 'tv') => {
      const updated = watchedHistory.filter(
        (item) => !(item.id === id && item.media_type === mediaType)
      );
      writeWatchedHistory(updated);
      setWatchedHistory(updated);
    },
    [watchedHistory]
  );

  const clearWatched = useCallback(() => {
    writeWatchedHistory([]);
    setWatchedHistory([]);
  }, []);

  const finishLater = useCallback(
    (id: number | string, mediaType: 'movie' | 'tv') => {
      const item = continueWatching.find(
        (entry) => entry.id === id && entry.media_type === mediaType
      );
      if (!item) return;

      if (!isInWatchlist(id, mediaType)) {
        const mediaId =
          typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10) || 0;
        const base = {
          id: mediaId,
          poster_path: item.poster_path ?? null,
          backdrop_path: item.backdrop_path ?? null,
          overview: '',
          vote_average: 0,
        };
        if (item.media_type === 'movie') {
          void addToWatchlist({
            ...base,
            media_type: 'movie',
            title: item.title || item.name || 'Untitled',
            release_date: '',
          });
        } else {
          void addToWatchlist({
            ...base,
            media_type: 'tv',
            name: item.name || item.title || 'Untitled',
            first_air_date: '',
          });
        }
      }

      removeContinue(id, mediaType);
    },
    [continueWatching, isInWatchlist, addToWatchlist, removeContinue]
  );

  const markAsWatched = useCallback(
    (id: number | string, mediaType: 'movie' | 'tv') => {
      const item = continueWatching.find(
        (entry) => entry.id === id && entry.media_type === mediaType
      );
      if (!item) return;

      const watchedItem: WatchedHistoryItem = {
        ...item,
        watchedAt: new Date().toISOString(),
      };

      const withoutDup = watchedHistory.filter(
        (entry) => !(entry.id === id && entry.media_type === mediaType)
      );
      const updatedWatched = [watchedItem, ...withoutDup];
      const updatedContinue = continueWatching.filter(
        (entry) => !(entry.id === id && entry.media_type === mediaType)
      );

      writeWatchedHistory(updatedWatched);
      writeContinueWatching(updatedContinue);
      setWatchedHistory(updatedWatched);
      setContinueWatching(updatedContinue);
      void removeFromWatchlist(id, mediaType);
    },
    [continueWatching, watchedHistory, removeFromWatchlist]
  );

  return {
    mounted,
    isLoading: !mounted || watchlistLoading,
    watchlist,
    continueWatching,
    watchedHistory,
    removeFromWatchlist,
    clearWatchlist,
    removeContinue,
    clearContinue,
    removeWatched,
    clearWatched,
    finishLater,
    markAsWatched,
  };
}
