import { Suspense } from 'react';
import type { StreamSource } from '@/types';
import type { MovieWithCredits } from '@/lib/detail/movieTypes';
import OptimizedImage from '@/components/common/OptimizedImage';
import DetailV2OverviewCollapse from '@/components/detail/v2/DetailV2OverviewCollapse';
import MoviePlayerWrapper from '@/components/movie/MoviePlayerWrapper';
import MovieReleaseHandler from '@/components/movie/MovieReleaseHandler';
import { MoviePlayerLoading } from '@/components/common/StreamingLoading';
import DetailV2CastStrip from '@/components/detail/v2/DetailV2CastStrip';
import DetailV2Faq from '@/components/detail/v2/DetailV2Faq';
import { buildFaqItems } from '@/utils/seoFaq';
import { movieFaqInput } from '@/lib/detail/faqInput';
import DetailV2PlayerEntrance from '@/components/detail/v2/DetailV2PlayerEntrance';
import DetailV2MetadataEntrance from '@/components/detail/v2/DetailV2MetadataEntrance';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import { navThemes } from '@/components/home/v2/navThemes';

interface MovieDetailV2Props {
  movie: MovieWithCredits;
  sources: StreamSource[];
  posterUrl: string;
  backdropUrl: string | null;
  releaseYear: string;
  trailerId?: string;
  initialSourceIndex?: number;
  /** When true, player sits inside the v2 3-column shell (no top header, embedded player). */
  inShell?: boolean;
}

export default function MovieDetailV2({
  movie,
  sources,
  posterUrl,
  backdropUrl,
  releaseYear,
  trailerId,
  initialSourceIndex,
  inShell = false,
}: MovieDetailV2Props) {
  const directors =
    movie.credits?.crew?.filter((c) => c.job === 'Director').map((d) => d.name) ?? [];
  const production =
    movie.production_companies?.slice(0, 3).map((company) => company.name) ?? [];
  const cast = movie.credits?.cast?.slice(0, 12) ?? [];
  const theme = navThemes.movies;

  const playerBlock = (
    <MovieReleaseHandler
      movie={{
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        poster_path: movie.poster_path,
        overview: movie.overview,
      }}
      trailerId={trailerId}
    >
      {sources && sources.length > 0 ? (
        <Suspense fallback={<MoviePlayerLoading />}>
          <MoviePlayerWrapper
            sources={sources}
            mediaType="movie"
            mediaId={movie.id.toString()}
            title={movie.title}
            poster_path={movie.poster_path}
            backdrop_path={movie.backdrop_path}
            trailerId={trailerId}
            imdbId={movie.external_ids?.imdb_id}
            year={movie.release_date ? parseInt(movie.release_date.substring(0, 4), 10) : undefined}
            initialSourceIndex={initialSourceIndex}
            embedded={inShell}
            disableAutoScroll={inShell}
            controlsInPanel={inShell}
          />
        </Suspense>
      ) : (
        <div className="mx-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-center sm:mx-0">
          <h3 className="mb-2 text-lg font-semibold text-white">Streaming Currently Unavailable</h3>
          <p className="mb-6 text-sm text-zinc-400">
            We&apos;re temporarily unable to provide streaming links for {movie.title}.
          </p>
          {trailerId && (
            <iframe
              src={`https://www.youtube.com/embed/${trailerId}`}
              title={`${movie.title} Trailer`}
              className="aspect-video w-full rounded-lg"
              allowFullScreen
              loading="lazy"
            />
          )}
        </div>
      )}
    </MovieReleaseHandler>
  );

  const metadataBlock = (
    <article className={`relative ${inShell ? 'px-4 py-4' : 'mx-auto max-w-[1400px] px-4 py-7 sm:px-6'}`}>
      <div className={`flex gap-4 items-start ${inShell ? '' : 'sm:gap-7'}`}>

        {/* Poster — compact */}
        <aside className={`shrink-0 ${inShell ? 'w-16 sm:w-[100px]' : 'w-[100px] sm:w-[120px] md:w-[130px]'}`} style={{ aspectRatio: '2/3' }}>
          <OptimizedImage
            src={posterUrl}
            alt={`${movie.title} poster`}
            width={260}
            height={390}
            className="w-full rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            imageType="poster"
            sizes="130px"
            quality={85}
            priority
          />
        </aside>

        {/* Info — all tight */}
        <div className="min-w-0 flex-1">
          <h1 className={`font-bold leading-tight text-white ${inShell ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
            {movie.title}
          </h1>

          {/* Single compact meta line with dots */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-400">
            {movie.vote_average != null && movie.vote_average > 0 && (
              <span className="font-semibold text-amber-400">★ {movie.vote_average.toFixed(1)}</span>
            )}
            {movie.vote_average != null && movie.vote_average > 0 && <span className="text-zinc-600">·</span>}
            <span>{releaseYear}</span>
            {movie.runtime && (
              <>
                <span className="text-zinc-600">·</span>
                <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
              </>
            )}
          </div>

          {/* Genres — desktop: all pills; mobile: hidden (first pill moves inline with About) */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="mt-2 hidden md:flex flex-wrap gap-1">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ color: theme.label, backgroundColor: theme.bgActive }}
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <DetailV2OverviewCollapse
            overview={movie.overview}
            credits={[
              { label: 'Directed by', names: directors },
              { label: 'Production', names: production },
            ]}
            mobileGenre={
              movie.genres?.[0] ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: theme.label, backgroundColor: theme.bgActive }}
                >
                  {movie.genres[0].name}
                </span>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Cast — collapsible */}
      {cast.length > 0 && (
        <div className={`border-t border-white/[0.05] ${inShell ? 'mt-5' : 'mt-7'}`}>
          <DetailV2CastStrip cast={cast} />
        </div>
      )}
    </article>
  );

  return (
    <div className={`text-white ${inShell ? 'detail-v2-in-shell' : ''}`}>
      <section className="relative w-full">
        {backdropUrl && !inShell && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <OptimizedImage
              src={backdropUrl}
              alt=""
              fill
              className="object-cover object-top opacity-20 blur-sm"
              imageType="backdrop"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/80 to-[#0a0a0a]" />
          </div>
        )}

        <div className={`relative w-full ${inShell ? '' : 'mx-auto max-w-[1400px] px-0 pt-4 sm:px-6 sm:pt-6'}`}>
          {/* Offers banner above the player — outside the aspect-shell so it never crops it */}
          <NativeBannerAdWrapper className="text-center" />
          {inShell ? <DetailV2PlayerEntrance>{playerBlock}</DetailV2PlayerEntrance> : playerBlock}
        </div>
      </section>

      {inShell ? <DetailV2MetadataEntrance>{metadataBlock}</DetailV2MetadataEntrance> : metadataBlock}

      <DetailV2Faq title={movie.title} items={buildFaqItems(movieFaqInput(movie, releaseYear))} />
    </div>
  );
}
