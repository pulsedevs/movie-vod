import Link from 'next/link';
import type { MediaItem, StreamSource } from '@/types';
import type { MovieWithCredits } from '@/lib/detail/movieTypes';
import type { TvShowWithCredits } from '@/lib/detail/tvTypes';
import { getMediaLogo, getSimilarMovies, getSimilarTvShows } from '@/services/api';
import MovieDetailV2 from '@/components/detail/v2/MovieDetailV2';
import TvDetailV2 from '@/components/detail/v2/TvDetailV2';
import DetailV2Faq from '@/components/detail/v2/DetailV2Faq';
import { buildFaqItems } from '@/utils/seoFaq';
import { movieFaqInput, tvFaqInput } from '@/lib/detail/faqInput';
import DetailHeroV3, { type InfoRow } from './DetailHeroV3';
import { CastCircles, TrailersRow, type VideoItem } from './DetailRowsV3';
import { PosterRow } from '../rows/Rows';

/* TMDB fields the v3 page reads that the shared types don't declare. */
type Company = { name: string; logo_path?: string | null };
type Video = { site: string; type: string; key: string; name?: string; official?: boolean };
type Extra = {
  production_companies?: Company[];
  networks?: Company[];
  spoken_languages?: Array<{ english_name?: string; name?: string }>;
  original_language?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  last_air_date?: string;
  content_ratings?: { results?: Array<{ iso_3166_1: string; rating?: string }> };
  videos?: { results?: Video[] };
};

const fmtRuntime = (min?: number | null) =>
  min ? `${Math.floor(min / 60) ? `${Math.floor(min / 60)}h ` : ''}${min % 60}m` : null;
const fmtDate = (d?: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
const langName = (x: Extra) =>
  x.spoken_languages?.[0]?.english_name ||
  (x.original_language ? new Intl.DisplayNames(['en'], { type: 'language' }).of(x.original_language) : null) ||
  null;
const trailers = (x: Extra): VideoItem[] =>
  (x.videos?.results ?? [])
    .filter((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    .sort((a, b) => Number(b.type === 'Trailer') - Number(a.type === 'Trailer') || Number(!!b.official) - Number(!!a.official))
    .slice(0, 10)
    .map((v) => ({ key: v.key, name: v.name, type: v.type }));

/* ─────────────────────────────── Movie ─────────────────────────────── */

interface MovieDetailV3Props {
  movie: MovieWithCredits;
  sources: StreamSource[];
  posterUrl: string;
  backdropUrl: string | null;
  releaseYear: string;
  trailerId?: string;
  initialSourceIndex?: number;
}

export async function MovieDetailV3(props: MovieDetailV3Props) {
  const { movie, releaseYear, trailerId } = props;
  const x = movie as MovieWithCredits & Extra;
  const [logo, similar] = await Promise.all([
    getMediaLogo('movie', movie.id).catch(() => null),
    getSimilarMovies(movie.id).catch(() => []),
  ]);

  const us = movie.release_dates?.results?.find((r) => r.iso_3166_1 === 'US');
  const cert = us?.release_dates?.find((d) => d.certification)?.certification || null;
  const directors = movie.credits?.crew?.filter((c) => c.job === 'Director').map((d) => d.name) ?? [];
  const info: InfoRow[] = [
    fmtRuntime(movie.runtime) && { label: 'Runtime', value: fmtRuntime(movie.runtime)! },
    langName(x) && { label: 'Language', value: langName(x)! },
    fmtDate(movie.release_date) && { label: 'Release Date', value: fmtDate(movie.release_date)! },
  ].filter(Boolean) as InfoRow[];

  return (
    <div className="text-white">
      <DetailHeroV3
        kind="movie"
        item={{ ...movie, media_type: 'movie' } as MediaItem}
        title={movie.title}
        logoPath={logo}
        backdropPath={movie.backdrop_path ?? null}
        genres={(movie.genres ?? []).slice(0, 3).map((g) => g.name)}
        facts={[releaseYear !== 'N/A' ? releaseYear : '', fmtRuntime(movie.runtime) ?? ''].filter(Boolean)}
        certification={cert}
        rating={movie.vote_average}
        credits={directors.length ? { label: directors.length > 1 ? 'Directors' : 'Director', names: directors } : null}
        overview={movie.overview}
        info={info}
        runtimeMin={movie.runtime}
        companies={x.production_companies ?? []}
        trailerKey={trailerId}
        player={<MovieDetailV2 {...props} playerOnly />}
      />
      <CastCircles cast={(movie.credits?.cast ?? []).slice(0, 16)} />
      <TrailersRow videos={trailers(x)} title={movie.title} />
      <PosterRow title="More like this" items={similar} />
      <div className="v3-gutter">
        <DetailV2Faq title={movie.title} items={buildFaqItems(movieFaqInput(movie, releaseYear))} />
      </div>
    </div>
  );
}

/* ──────────────────────────────── TV ──────────────────────────────── */

interface TvDetailV3Props {
  show: TvShowWithCredits;
  sources: StreamSource[];
  posterUrl: string;
  backdropUrl: string | null;
  firstAirYear: string;
  trailerId?: string;
  initialSourceIndex?: number;
  initialSeasonNumber?: number;
  initialEpisodeNumber?: number;
  /** Episode pages own the <h1>. */
  asSubheading?: boolean;
  episodeLinks?: {
    slug: string;
    latestSeason: number;
    episodes: Array<{ episode_number: number; name?: string }>;
    otherSeasons: number[];
  } | null;
}

export async function TvDetailV3(props: TvDetailV3Props) {
  const { show, firstAirYear, trailerId, episodeLinks, asSubheading } = props;
  const x = show as TvShowWithCredits & Extra;
  const [logo, similar] = await Promise.all([
    getMediaLogo('tv', show.id).catch(() => null),
    getSimilarTvShows(show.id).catch(() => []),
  ]);

  const cert = x.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US')?.rating || null;
  const creators = (show as { created_by?: Array<{ name: string }> }).created_by?.map((c) => c.name) ?? [];
  const seasons = x.number_of_seasons;
  const runtime = x.episode_run_time?.[0] ?? null;
  const info: InfoRow[] = [
    seasons ? { label: 'Seasons', value: `${seasons}${x.number_of_episodes ? ` · ${x.number_of_episodes} episodes` : ''}` } : null,
    langName(x) && { label: 'Language', value: langName(x)! },
    fmtDate(show.first_air_date) && { label: 'First Aired', value: fmtDate(show.first_air_date)! },
    x.status ? { label: 'Status', value: x.status } : null,
  ].filter(Boolean) as InfoRow[];
  const cast = ((show as { credits?: { cast?: Array<{ id: number; name: string; character?: string; profile_path: string | null }> } })
    .credits?.cast ?? []).slice(0, 16);

  return (
    <div className="text-white">
      <DetailHeroV3
        kind="tv"
        item={{ ...show, media_type: 'tv' } as MediaItem}
        title={show.name}
        headingLevel={asSubheading ? 'h2' : 'h1'}
        logoPath={logo}
        backdropPath={show.backdrop_path ?? null}
        genres={((show as { genres?: Array<{ name: string }> }).genres ?? []).slice(0, 3).map((g) => g.name)}
        facts={[
          firstAirYear !== 'N/A' ? firstAirYear : '',
          seasons ? `${seasons} Season${seasons > 1 ? 's' : ''}` : '',
          fmtRuntime(runtime) ? `${fmtRuntime(runtime)} / ep` : '',
        ].filter(Boolean)}
        certification={cert}
        rating={show.vote_average}
        credits={creators.length ? { label: 'Created by', names: creators } : null}
        overview={show.overview}
        info={info}
        companies={x.networks ?? x.production_companies ?? []}
        trailerKey={trailerId}
        playTargetId="v3-episodes"
      />

      <section id="v3-episodes" className="v3-gutter scroll-mt-24 py-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight md:text-[22px]">Episodes</h2>
        <TvDetailV2 {...props} inShell={false} playerOnly />
      </section>

      <CastCircles cast={cast} />
      <TrailersRow videos={trailers(x)} title={show.name} />
      <PosterRow title="More like this" items={similar} />

      {episodeLinks && episodeLinks.episodes.length > 0 && (
        <section className="v3-gutter py-6" aria-labelledby="ep-links-heading">
          <h2 id="ep-links-heading" className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/45">
            {show.name} Season {episodeLinks.latestSeason} episodes
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {episodeLinks.episodes.map((ep) => (
              <li key={ep.episode_number}>
                <Link
                  href={`/tv/${show.id}/${episodeLinks.slug}/season/${episodeLinks.latestSeason}/episode/${ep.episode_number}`}
                  title={ep.name || `Episode ${ep.episode_number}`}
                  className="inline-block rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  E{ep.episode_number}
                </Link>
              </li>
            ))}
            {episodeLinks.otherSeasons.map((s) => (
              <li key={`s${s}`}>
                <Link
                  href={`/tv/${show.id}/${episodeLinks.slug}/season/${s}/episode/1`}
                  className="inline-block rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Season {s}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="v3-gutter">
        <DetailV2Faq title={show.name} items={buildFaqItems(tvFaqInput(show, firstAirYear))} />
      </div>
    </div>
  );
}
