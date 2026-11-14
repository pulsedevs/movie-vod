'use client';

import { useCallback, useEffect, useState } from 'react';

/** Viewer preferences for the v3 UI, kept in this browser. */
const TRAILERS_KEY = 'v3:trailers';
const EVENT = 'v3-prefs';

function readTrailers(): boolean {
  try {
    return localStorage.getItem(TRAILERS_KEY) !== '0';
  } catch {
    return true;
  }
}

/** Background trailers on detail pages: on unless the viewer turned them off. */
export function useTrailersPref(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const read = () => setOn(readTrailers());
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);

  const set = useCallback((value: boolean) => {
    try {
      localStorage.setItem(TRAILERS_KEY, value ? '1' : '0');
    } catch {}
    setOn(value);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [on, set];
}
