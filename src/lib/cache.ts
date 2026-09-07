/**
 * CDN cache-control presets.
 * s-maxage = Cloudflare edge TTL, max-age = browser TTL (kept short so CF does the work).
 * stale-while-revalidate = serve stale while refreshing in background at the edge.
 */
export function cacheHeaders(sMxAge: number, staleWhileRevalidate = sMxAge * 4) {
  return {
    'Cache-Control': `public, max-age=60, s-maxage=${sMxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

export const CACHE = {
  /** Genre lists — almost never change */
  genres:   () => cacheHeaders(604800,  604800),
  /** Trending — changes weekly */
  trending: () => cacheHeaders(604800,  604800),
  /** Popular / top-rated */
  popular:  () => cacheHeaders(604800,  604800),
  /** Similar titles — stable per title */
  similar:  () => cacheHeaders(604800,  604800),
  /** Full detail page — cast/info rarely change */
  details:  () => cacheHeaders(604800,  604800),
  /** TV season episode lists */
  season:   () => cacheHeaders(604800,  604800),
  /** Discover with user filters */
  discover: () => cacheHeaders(604800,  604800),
  /** YouTube/trailer metadata */
  youtube:  () => cacheHeaders(604800,  604800),
  /** Search queries — must stay short so new releases appear */
  search:   () => cacheHeaders(300,     3600),
};
