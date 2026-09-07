/** Shared motion tokens for the v2 shell. */
export const V2_EASE = [0.25, 0.1, 0.25, 1] as const;

export const V2_DURATION = {
  panel: 0.38,
  main: 0.42,
  player: 0.48,
} as const;

export function v2Transition(
  duration: number,
  delay = 0,
  reducedMotion = false
): { duration: number; delay?: number; ease: typeof V2_EASE } {
  if (reducedMotion) return { duration: 0, ease: V2_EASE };
  return { duration, delay, ease: V2_EASE };
}

export function isHomePreviewRoot(pathname: string): boolean {
  if (pathname === '/home-preview' || pathname === '/home-preview/') return true;
  return pathname === '/' || pathname === '';
}

export function isDetailShellPath(pathname: string): boolean {
  if (!pathname) return false;
  if (
    pathname.startsWith('/home-preview/movie/') ||
    pathname.startsWith('/home-preview/tv/') ||
    pathname.startsWith('/movie-preview/') ||
    pathname.startsWith('/tv-preview/')
  ) {
    return true;
  }
  return pathname.startsWith('/movie/') || pathname.startsWith('/tv/');
}

/**
 * Unique key per top-level nav section so AnimatePresence triggers between tabs.
 * Sub-route changes within the same section (filters, pagination) share the same key
 * and therefore don't re-trigger the animation.
 */
export function getV2MainColumnKey(pathname: string): string {
  if (isDetailShellPath(pathname)) return 'v2-detail';
  if (isHomePreviewRoot(pathname)) return 'v2-home';
  if (pathname.startsWith('/home-preview/browse') || pathname.startsWith('/browse/')) {
    const normalized = pathname.replace('/home-preview', '');
    // ['browse','movies'] → 'movies', ['browse','provider','netflix'] → 'provider-netflix'
    const parts = normalized.split('/').filter(Boolean).slice(1);
    return `v2-browse-${parts.join('-')}`;
  }
  if (pathname.startsWith('/home-preview/library') || pathname === '/library') {
    return 'v2-library';
  }
  return pathname;
}

/** Ordered list of top-level nav keys — used to compute slide direction. */
export const V2_NAV_ORDER = [
  'v2-home',
  'v2-browse-movies',
  'v2-browse-tv',
  'v2-browse-anime',
  'v2-library',
  'v2-browse-provider-netflix',
  'v2-browse-provider-max',
  'v2-browse-provider-disney',
  'v2-browse-provider-prime',
];
