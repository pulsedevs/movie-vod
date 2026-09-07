'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readWatchedHistory,
  LIBRARY_STORAGE_EVENT,
  type WatchedHistoryItem,
} from '@/utils/libraryStorage';

export type { WatchedHistoryItem } from '@/utils/libraryStorage';

export function useWatchedHistoryLocal(limit = 20) {
  const [items, setItems] = useState<WatchedHistoryItem[]>([]);

  const load = useCallback(() => {
    setItems(readWatchedHistory(limit));
  }, [limit]);

  useEffect(() => {
    load();
    window.addEventListener(LIBRARY_STORAGE_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(LIBRARY_STORAGE_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [load]);

  return items;
}
