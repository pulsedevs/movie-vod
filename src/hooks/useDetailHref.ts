'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { MediaItem } from '@/types';
import { toMovieHref, toTvHref } from '@/utils/detailLayout';

export function useDetailHref() {
  const pathname = usePathname() ?? '';

  const movieHref = useCallback(
    (id: number | string, title: string) => toMovieHref(pathname, id, title),
    [pathname]
  );

  const tvHref = useCallback(
    (id: number | string, title: string) => toTvHref(pathname, id, title),
    [pathname]
  );

  const mediaHref = useCallback(
    (item: Pick<MediaItem, 'id' | 'media_type'> & { title?: string | null; name?: string | null }) => {
      if (item.media_type === 'movie') {
        return toMovieHref(pathname, item.id, item.title || 'untitled');
      }
      return toTvHref(pathname, item.id, item.name || 'untitled');
    },
    [pathname]
  );

  return useMemo(
    () => ({ pathname, movieHref, tvHref, mediaHref }),
    [pathname, movieHref, tvHref, mediaHref]
  );
}
