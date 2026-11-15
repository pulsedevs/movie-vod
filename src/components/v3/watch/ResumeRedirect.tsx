'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readContinueWatching } from '@/utils/libraryStorage';
import { watchHref } from './links';

/** /watch/tv/:id: on to the episode this viewer left off at, else the show's first episode. */
export default function ResumeRedirect({ tvId, firstSeason }: { tvId: number; firstSeason: number }) {
  const router = useRouter();
  useEffect(() => {
    const it = readContinueWatching().find((x) => Number(x.id) === tvId && x.media_type === 'tv') as
      | { season?: number; episode?: number; season_number?: number; episode_number?: number }
      | undefined;
    const s = it?.season ?? it?.season_number;
    const e = it?.episode ?? it?.episode_number;
    router.replace(s != null && e != null ? watchHref('tv', tvId, Number(s), Number(e)) : watchHref('tv', tvId, firstSeason, 1));
  }, [router, tvId, firstSeason]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/15 border-t-white" role="status" aria-label="Loading" />
    </div>
  );
}
