'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useHybridData } from '@/hooks/useHybridData';
import type { ContinueWatchingItem, WatchedHistoryItem } from '@/utils/libraryStorage';
import {
  LIBRARY_STORAGE_EVENT,
  readContinueWatching,
  readWatchedHistory,
} from '@/utils/libraryStorage';

const PANEL_LIMIT = 20;

export function useLibraryPanelData() {
  const pathname = usePathname() ?? '';
  const { watchlist, loadData, isLoading: watchlistLoading } = useHybridData();
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [recentWatched, setRecentWatched] = useState<WatchedHistoryItem[]>([]);

  const refreshLocalLists = useCallback(() => {
    setContinueWatching(readContinueWatching(PANEL_LIMIT));
    setRecentWatched(readWatchedHistory(PANEL_LIMIT));
  }, []);

  useEffect(() => {
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

  return {
    continueWatching,
    recentWatched,
    watchlist,
    isLoading: watchlistLoading,
    refresh: refreshLocalLists,
  };
}
