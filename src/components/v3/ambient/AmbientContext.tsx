'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PALETTE, extractPalette, type Palette } from './palette';

interface AmbientValue {
  palette: Palette;
  /** Take the background's colours from an image (a small TMDB backdrop is plenty). */
  setFromImage: (url: string | null | undefined) => void;
  /** Set the colours directly (a page with its own mood, e.g. search). */
  setPalette: (p: Palette) => void;
}

const AmbientCtx = createContext<AmbientValue>({
  palette: DEFAULT_PALETTE,
  setFromImage: () => {},
  setPalette: () => {},
});

export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const cache = useRef(new Map<string, Palette>());
  const latest = useRef('');

  const setFromImage = useCallback((url: string | null | undefined) => {
    if (!url) return;
    latest.current = url;
    const hit = cache.current.get(url);
    if (hit) {
      setPalette(hit);
      return;
    }
    extractPalette(url)
      .then((p) => {
        cache.current.set(url, p);
        if (latest.current === url) setPalette(p); // a newer image may have been asked for meanwhile
      })
      .catch(() => {});
  }, []);

  const setDirect = useCallback((p: Palette) => {
    latest.current = ''; // an image still being read must not override it
    setPalette(p);
  }, []);

  const value = useMemo(() => ({ palette, setFromImage, setPalette: setDirect }), [palette, setFromImage, setDirect]);
  return <AmbientCtx.Provider value={value}>{children}</AmbientCtx.Provider>;
}

export function useAmbient(): AmbientValue {
  return useContext(AmbientCtx);
}

/** Drop into any page (server components too) to colour the background from an image. */
export function AmbientFrom({ image }: { image: string | null | undefined }) {
  const { setFromImage } = useAmbient();
  useEffect(() => {
    setFromImage(image);
  }, [image, setFromImage]);
  return null;
}

/** Drop into a page to give the background fixed colours; back to the default when it leaves. */
export function AmbientPalette({ palette }: { palette: Palette }) {
  const { setPalette } = useAmbient();
  useEffect(() => {
    setPalette(palette);
    return () => setPalette(DEFAULT_PALETTE);
  }, [palette, setPalette]);
  return null;
}

/** TMDB backdrop path -> the small image the palette is read from. */
export function ambientSrc(backdropPath: string | null | undefined): string | null {
  return backdropPath ? `https://image.tmdb.org/t/p/w300${backdropPath}` : null;
}
