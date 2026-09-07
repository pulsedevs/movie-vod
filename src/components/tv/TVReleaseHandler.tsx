'use client';

import { useState, useEffect, useMemo } from 'react';
import ReleaseStatusDialog from '@/components/common/ReleaseStatusDialog';
import { isTVShowUnreleased } from '@/hooks/useReleaseStatus';

interface TVReleaseHandlerProps {
  tvShow: {
    id: number;
    name: string;
    first_air_date?: string;
    poster_path?: string | null;
    overview?: string;
  };
  trailerId?: string;
  children: React.ReactNode;
}

export default function TVReleaseHandler({ tvShow, trailerId, children }: TVReleaseHandlerProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const tvIsUnreleased = useMemo(() => 
    isTVShowUnreleased(tvShow.first_air_date), 
    [tvShow.first_air_date]
  );

  const posterUrl = useMemo(() => 
    tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : undefined,
    [tvShow.poster_path]
  );

  useEffect(() => {
    if (tvIsUnreleased) {
      setShowDialog(true);
    }
  }, [tvIsUnreleased]);
  // If TV show is unreleased, don't render children (player) at all
  if (tvIsUnreleased) {
    return (
      <ReleaseStatusDialog
        title={tvShow.name}
        releaseDate={tvShow.first_air_date || ''}
        isMovie={false}
        posterUrl={posterUrl}
        overview={tvShow.overview}
        trailerId={trailerId}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
    );
  }

  // TV show is released, render children normally
  return <>{children}</>;
}
