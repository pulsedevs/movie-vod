'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Genre } from '@/types';

export type DetailV2CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type DetailV2MovieMeta = {
  id: number;
  title: string;
  releaseYear: string;
  runtime?: number | null;
  voteAverage?: number | null;
  voteCount?: number | null;
  overview?: string | null;
  posterUrl: string;
  genres?: Genre[];
  directors?: string[];
  production?: string[];
  cast?: DetailV2CastMember[];
};

export type DetailV2SourceOption = {
  name: string;
  url: string;
  index: number;
};

export type DetailV2PlayerChrome = {
  sources: DetailV2SourceOption[];
  selectedSourceIndex: number;
  is4KAvailable: boolean;
  is4KSelected: boolean;
  isInWatchlist: boolean;
  isWatchlistLoading: boolean;
  isProcessingWatchlist: boolean;
  mediaType: 'movie' | 'tv';
  mediaId: string | number;
  title: string;
  trailerId?: string;
  currentSrc?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  onSelectSource: (index: number) => void;
  onToggle4K?: () => void;
  onShare: () => void;
  onToggleWatchlist: () => void;
};

type DetailV2PanelContextValue = {
  movieMeta: DetailV2MovieMeta | null;
  setMovieMeta: (meta: DetailV2MovieMeta | null) => void;
  playerChrome: DetailV2PlayerChrome | null;
  setPlayerChrome: (chrome: DetailV2PlayerChrome | null) => void;
};

const DetailV2PanelContext = createContext<DetailV2PanelContextValue | null>(null);

export function DetailV2PanelProvider({ children }: { children: ReactNode }) {
  const [movieMeta, setMovieMetaState] = useState<DetailV2MovieMeta | null>(null);
  const [playerChrome, setPlayerChromeState] = useState<DetailV2PlayerChrome | null>(null);

  const setMovieMeta = useCallback((meta: DetailV2MovieMeta | null) => {
    setMovieMetaState(meta);
  }, []);

  const setPlayerChrome = useCallback((chrome: DetailV2PlayerChrome | null) => {
    setPlayerChromeState(chrome);
  }, []);

  const value = useMemo(
    () => ({ movieMeta, setMovieMeta, playerChrome, setPlayerChrome }),
    [movieMeta, playerChrome, setMovieMeta, setPlayerChrome]
  );

  return <DetailV2PanelContext.Provider value={value}>{children}</DetailV2PanelContext.Provider>;
}

export function useDetailV2Panel() {
  const ctx = useContext(DetailV2PanelContext);
  if (!ctx) {
    return {
      movieMeta: null,
      setMovieMeta: () => {},
      playerChrome: null,
      setPlayerChrome: () => {},
      isAvailable: false,
    };
  }
  return { ...ctx, isAvailable: true };
}
