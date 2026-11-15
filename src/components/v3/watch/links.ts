/**
 * The dedicated player page. A show without an episode resolves to where this viewer left off
 * (else its first episode) on arrival.
 */
export function watchHref(
  type: 'movie' | 'tv',
  id: number | string,
  season?: number | null,
  episode?: number | null,
): string {
  if (type === 'movie') return `/watch/movie/${id}`;
  return season != null && episode != null ? `/watch/tv/${id}/${season}/${episode}` : `/watch/tv/${id}`;
}
