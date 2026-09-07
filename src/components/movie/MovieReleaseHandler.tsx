'use client';

import { useState, useEffect, useMemo } from 'react';
import ReleaseStatusDialog from '@/components/common/ReleaseStatusDialog';
import { isMovieUnreleased } from '@/hooks/useReleaseStatus';

interface MovieReleaseHandlerProps {
  movie: {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
  };
  trailerId?: string;
  children: React.ReactNode;
}

export default function MovieReleaseHandler({ movie, trailerId, children }: MovieReleaseHandlerProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const movieIsUnreleased = useMemo(() => 
    isMovieUnreleased(movie.release_date), 
    [movie.release_date]
  );

  const posterUrl = useMemo(() => 
    movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    [movie.poster_path]
  );

  useEffect(() => {
    if (movieIsUnreleased) {
      setShowDialog(true);
    }
  }, [movieIsUnreleased]);
  // If movie is unreleased, don't render children (player) at all
  if (movieIsUnreleased) {
    return (
      <ReleaseStatusDialog
        title={movie.title}
        releaseDate={movie.release_date || ''}
        isMovie={true}
        posterUrl={posterUrl}
        overview={movie.overview}
        trailerId={trailerId}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
    );
  }

  // Movie is released, render children normally
  return <>{children}</>;
}
