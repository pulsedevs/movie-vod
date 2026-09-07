'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readContinueWatching,
  LIBRARY_STORAGE_EVENT,
  type ContinueWatchingItem,
} from '@/utils/libraryStorage';

export type { ContinueWatchingItem } from '@/utils/libraryStorage';

export function useContinueWatchingLocal(limit = 12) {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  const load = useCallback(() => {
    setItems(readContinueWatching(limit));
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
