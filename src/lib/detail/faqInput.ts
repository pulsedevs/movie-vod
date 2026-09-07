import type { MovieFaqInput, TvFaqInput } from '@/utils/seoFaq';
import type { MovieWithCredits } from './movieTypes';
import type { TvShowWithCredits } from './tvTypes';

/**
 * Maps detail payloads onto the shared FAQ builder input.
 *
 * Both the visible FAQ (MovieDetailV2 / TvDetailV2) and the FAQPage JSON-LD (the page's
 * generateMetadata) go through these, so the rendered questions and the structured data are
 * built from exactly the same values and cannot drift.
 */

/** First US certification TMDB reports, e.g. "PG-13". Falls back to any region that has one. */
function certificationOf(movie: MovieWithCredits): string | null {
  const results = movie.release_dates?.results ?? [];
  for (const entry of results) {
    const cert = entry.release_dates?.find((r) => r.certification?.trim())?.certification;
    if (cert?.trim()) return cert.trim();
  }
  return null;
}

export function movieFaqInput(movie: MovieWithCredits, year?: string): MovieFaqInput {
  return {
    kind: 'movie',
    title: movie.title,
    year,
    overview: movie.overview,
    genres: movie.genres?.map((g) => g.name),
    cast: movie.credits?.cast,
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    runtime: movie.runtime,
    directors: movie.credits?.crew?.filter((c) => c.job === 'Director').map((c) => c.name),
    certification: certificationOf(movie),
  };
}

export function tvFaqInput(show: TvShowWithCredits, year?: string): TvFaqInput {
  return {
    kind: 'tv',
    title: show.name,
    year,
    overview: show.overview,
    genres: show.genres?.map((g) => g.name),
    cast: show.credits?.cast,
    rating: show.vote_average,
    voteCount: show.vote_count,
    seasons: show.number_of_seasons,
    episodes: show.number_of_episodes,
    status: show.status,
    creators: show.created_by?.map((c) => c.name),
  };
}
