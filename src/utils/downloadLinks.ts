const DEFAULT_MOVIE_BASE = 'https://vidvault.ru/movie/';
const DEFAULT_TV_BASE = 'https://vidvault.ru/tv/';

function normalizeBase(base: string): string {
  return base.endsWith('/') ? base : `${base}/`;
}

export function getMovieDownloadUrl(mediaId: string | number): string {
  const base = process.env.NEXT_PUBLIC_DOWNLOAD_MOVIE_BASE || DEFAULT_MOVIE_BASE;
  return `${normalizeBase(base)}${mediaId}`;
}

export function getTvDownloadUrl(
  mediaId: string | number,
  seasonNumber?: number,
  episodeNumber?: number
): string {
  const base = process.env.NEXT_PUBLIC_DOWNLOAD_TV_BASE || DEFAULT_TV_BASE;
  const season = seasonNumber ?? 1;
  const episode = episodeNumber ?? 1;
  return `${normalizeBase(base)}${mediaId}/${season}/${episode}`;
}
