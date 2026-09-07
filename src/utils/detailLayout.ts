import { getHomeLayout } from '@/utils/homeLayout';
import { createSlug } from '@/utils/movieLinks';

export type DetailLayout = 'classic' | 'v2';

export function getDetailLayout(): DetailLayout {
  return process.env.NEXT_PUBLIC_DETAIL_LAYOUT === 'v2' ? 'v2' : 'classic';
}

export function isDetailPreviewPath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/home-preview/movie/') ||
    pathname.startsWith('/home-preview/tv/') ||
    pathname.startsWith('/movie-preview/') ||
    pathname.startsWith('/tv-preview/')
  );
}

export function isDetailV2Path(pathname: string): boolean {
  if (isDetailPreviewPath(pathname)) return true;
  if (getDetailLayout() !== 'v2') return false;
  return (
    pathname.startsWith('/movie/') ||
    pathname.startsWith('/tv/')
  );
}

/** Whether movie links from the current shell should use `/movie-preview`. */
export function shouldUseMoviePreview(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/home-preview') ||
    pathname.startsWith('/movie-preview')
  );
}

/**
 * Movie detail href that stays in the v2 preview stack when browsing `/home-preview`.
 * Live v2 home (`/`) uses production `/movie/...` (UI controlled by `NEXT_PUBLIC_DETAIL_LAYOUT`).
 */
export function toMovieHref(pathname: string, id: number | string, title: string): string {
  const slug = createSlug(title);
  if (shouldUseMoviePreview(pathname)) {
    return `/home-preview/movie/${id}/${slug}`;
  }
  return `/movie/${id}/${slug}`;
}

/** Whether TV links from the current shell should stay in `/home-preview`. */
export function shouldUseTvPreview(pathname: string): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/home-preview') || pathname.startsWith('/tv-preview');
}

/**
 * TV detail href that stays in the v2 preview stack when browsing `/home-preview`.
 */
export function toTvHref(pathname: string, id: number | string, title: string): string {
  const slug = createSlug(title);
  if (shouldUseTvPreview(pathname)) {
    return `/home-preview/tv/${id}/${slug}`;
  }
  return `/tv/${id}/${slug}`;
}

/** Home link from detail pages — respects home layout preview vs live v2. */
export function getDetailHomeHref(): string {
  return getHomeLayout() === 'v2' ? '/' : '/home-preview';
}

export function getDetailBrowseHref(mediaType: 'movie' | 'tv'): string {
  const base = getHomeLayout() === 'v2' ? '' : '/home-preview';
  const segment = mediaType === 'movie' ? 'movies' : 'tv';
  return `${base}/browse/${segment}`;
}