/** DOM id for the detail-page right panel portal mount point. */
export const DETAIL_PLAYER_PANEL_PORTAL_ID = 'detail-player-panel-portal';

/** DOM id for TV season/episode picker in the v2 right panel (below servers/actions). */
export const DETAIL_TV_SEASONS_PORTAL_ID = 'detail-tv-seasons-portal';

export function isDetailPanelPath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/home-preview/movie/') ||
    pathname.startsWith('/home-preview/tv/') ||
    pathname.startsWith('/movie-preview/') ||
    pathname.startsWith('/tv-preview/') ||
    pathname.startsWith('/movie/') ||
    pathname.startsWith('/tv/')
  );
}

export function parseDetailPanelPath(
  pathname: string
): { mediaType: 'movie' | 'tv'; id: string } | null {
  const homeMovie = pathname.match(/^\/home-preview\/movie\/(\d+)/);
  if (homeMovie) return { mediaType: 'movie', id: homeMovie[1] };

  const legacyMovie = pathname.match(/^\/movie-preview\/(\d+)/);
  if (legacyMovie) return { mediaType: 'movie', id: legacyMovie[1] };

  const homeTv = pathname.match(/^\/home-preview\/tv\/(\d+)/);
  if (homeTv) return { mediaType: 'tv', id: homeTv[1] };

  const legacyTv = pathname.match(/^\/tv-preview\/(\d+)/);
  if (legacyTv) return { mediaType: 'tv', id: legacyTv[1] };

  const liveMovie = pathname.match(/^\/movie\/(\d+)/);
  if (liveMovie) return { mediaType: 'movie', id: liveMovie[1] };

  const liveTv = pathname.match(/^\/tv\/(\d+)/);
  if (liveTv) return { mediaType: 'tv', id: liveTv[1] };

  return null;
}
