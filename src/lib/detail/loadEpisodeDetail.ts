import type { TvShowWithCredits } from '@/lib/detail/tvTypes';

/**
 * Episode data for a single TV episode page.
 *
 * TMDB has no per-episode endpoint worth calling per page — `/tv/{id}/season/{n}` returns the
 * whole season in one request, so a single cached fetch serves every episode page in that season.
 */
export interface EpisodeDetail {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
  vote_average: number | null;
  vote_count: number | null;
  guest_stars?: Array<{ id: number; name: string; character?: string }>;
}

export interface SeasonDetail {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  episodes: EpisodeDetail[];
}

/** Whole season (cached 24h) — one fetch backs every episode page in the season. */
export async function loadSeasonDetail(
  tvId: string | number,
  seasonNumber: string | number
): Promise<SeasonDetail | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('Episode Page: TMDB_API_KEY is not defined.');
    throw new Error('API Key is missing');
  }

  const id = Number(tvId);
  const season = Number(seasonNumber);
  // Season 0 is TMDB's "Specials" — valid, so only reject negatives/NaN.
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(season) || season < 0) return null;

  const url = `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${apiKey}&language=en-US`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      if (res.status >= 400 && res.status < 500) return null;
      throw new Error(`Failed to fetch season ${season} of ${id}: ${res.status}`);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.episodes)) return null;
    return data as SeasonDetail;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timeout loading season ${season} of show ${id}.`);
    }
    console.error(`Episode Page: fetch error for show ${id} season ${season}:`, error);
    throw new Error(`Unable to load season data for show ${id}.`);
  }
}

/** A single episode, or null when the show/season/episode doesn't exist. */
export async function loadEpisodeDetail(
  tvId: string | number,
  seasonNumber: string | number,
  episodeNumber: string | number
): Promise<{ season: SeasonDetail; episode: EpisodeDetail } | null> {
  const epNum = Number(episodeNumber);
  if (!Number.isInteger(epNum) || epNum <= 0) return null;

  const season = await loadSeasonDetail(tvId, seasonNumber);
  if (!season) return null;

  const episode = season.episodes.find((e) => e.episode_number === epNum);
  if (!episode) return null;

  return { season, episode };
}

/**
 * Whether a show is worth generating episode pages for.
 *
 * Blanket generation would be ~24k URLs and would repeat the crawl-budget problem, so episode
 * pages target shows with LIVE demand: still running, or finished within the last ~6 months.
 */
export function isShowAiring(show: Pick<TvShowWithCredits, 'status' | 'last_air_date'>): boolean {
  const status = (show.status || '').toLowerCase();
  if (status.includes('returning') || status.includes('in production') || status.includes('pilot')) {
    return true;
  }
  const last = show.last_air_date ? Date.parse(show.last_air_date) : NaN;
  if (Number.isNaN(last)) return false;
  const sixMonths = 1000 * 60 * 60 * 24 * 183;
  return Date.now() - last < sixMonths;
}

/** A just-aired episode, for the homepage row. */
export interface RecentEpisode {
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string | null;
  stillPath: string | null;
}

/**
 * Most recently aired episodes across currently-airing shows.
 *
 * Uses `last_episode_to_air` from the show detail, so it costs ONE request per show and needs no
 * per-season fetch. Heavily revalidate-cached because this renders on the homepage — the highest
 * traffic page on the site — and must not add latency on a cache hit.
 */
export async function loadRecentEpisodes(limit = 18): Promise<RecentEpisode[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  try {
    const list = await fetch(
      `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=en-US&page=1`,
      { next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const ids: number[] = (list?.results ?? [])
      .map((s: { id?: number }) => s?.id)
      .filter((id: unknown): id is number => typeof id === 'number')
      .slice(0, 20);
    if (!ids.length) return [];

    const details = await Promise.all(
      ids.map((id) =>
        fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US`, {
          next: { revalidate: 21600 },
          signal: AbortSignal.timeout(8000),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    const out: RecentEpisode[] = [];
    for (const show of details) {
      const last = show?.last_episode_to_air;
      if (!show?.id || !show?.name || !last) continue;
      // Same gate as the sitemap — the row must not surface talk shows and daily strips.
      if (!isEpisodeWorthIndexing(show)) continue;
      const seasonNumber = Number(last.season_number);
      const episodeNumber = Number(last.episode_number);

      out.push({
        showId: show.id,
        showName: show.name,
        seasonNumber,
        episodeNumber,
        episodeName: last.name || `Episode ${episodeNumber}`,
        airDate: last.air_date ?? null,
        stillPath: last.still_path ?? show.backdrop_path ?? null,
      });
    }

    // Newest first — the row is a freshness signal, so ordering matters.
    out.sort((a, b) => (b.airDate || '').localeCompare(a.airDate || ''));
    return out.slice(0, limit);
  } catch (error) {
    console.error('loadRecentEpisodes failed', error);
    return [];
  }
}

/**
 * Whether a show's episodes are worth their own indexable pages.
 *
 * TMDB's "on the air" list is dominated by daily strips — talk shows, news bulletins and foreign
 * reality formats — which air constantly but nobody searches per-episode ("watch The Tonight Show
 * season 13 episode 145"). Those are exactly the thin pages that land in "Discovered - not indexed".
 *
 * Calibrated against real numbers rather than guessed:
 *   keep   Love Island USA (179 votes, 35 eps, Reality)  The Rookie (3469, 18)  Euphoria (11030, 8)
 *   drop   Gran hermano (4 votes, 149 eps)  Tonight Show (Talk)  Tagesschau (News)  Secret Story (13)
 *
 * Note vote_count ALONE does not separate them — Tonight Show (384) outscores Love Island (179) —
 * so genre and episodes-per-season do the real work. Reality is deliberately NOT excluded: Love
 * Island is the single best-performing page on the site.
 */
const EXCLUDED_TV_GENRES = new Set([
  10763, // News
  10767, // Talk
]);
const MIN_VOTE_COUNT = 100;
const MAX_EPISODES_IN_SEASON = 60; // a season this long is a daily strip, not a weekly drop

export function isEpisodeWorthIndexing(show: {
  vote_count?: number | null;
  genres?: Array<{ id?: number }> | null;
  genre_ids?: number[] | null;
  last_episode_to_air?: { season_number?: number; episode_number?: number } | null;
}): boolean {
  const last = show?.last_episode_to_air;
  if (!last) return false;

  const seasonNumber = Number(last.season_number);
  const airedCount = Number(last.episode_number);
  // Season 0 is Specials — not what "new episode" searches mean.
  if (!Number.isInteger(seasonNumber) || seasonNumber < 1) return false;
  if (!Number.isInteger(airedCount) || airedCount < 1) return false;
  if (airedCount > MAX_EPISODES_IN_SEASON) return false;

  if ((show.vote_count ?? 0) < MIN_VOTE_COUNT) return false;

  const genreIds = [
    ...(show.genres ?? []).map((g) => g?.id),
    ...(show.genre_ids ?? []),
  ].filter((id): id is number => typeof id === 'number');
  if (genreIds.some((id) => EXCLUDED_TV_GENRES.has(id))) return false;

  return true;
}
