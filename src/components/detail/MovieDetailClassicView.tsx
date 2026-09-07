import { Suspense } from 'react';
import type { StreamSource } from '@/types';
import type { MovieWithCredits } from '@/lib/detail/movieTypes';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import OptimizedImage from '@/components/common/OptimizedImage';
import Description from '@/components/movie/Description';
import MoviePlayerWrapper from '@/components/movie/MoviePlayerWrapper';
import MovieReleaseHandler from '@/components/movie/MovieReleaseHandler';
import { MoviePlayerLoading } from '@/components/common/StreamingLoading';

interface MovieDetailClassicViewProps {
  movie: MovieWithCredits;
  sources: StreamSource[];
  posterUrl: string;
  backdropUrl: string | null;
  releaseYear: string;
  trailerId?: string;
  initialSourceIndex?: number;
}

export default function MovieDetailClassicView({
  movie,
  sources,
  posterUrl,
  backdropUrl,
  releaseYear,
  trailerId,
  initialSourceIndex,
}: MovieDetailClassicViewProps) {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Movies', href: '/browse/movies' },
          { label: movie.title, current: true },
        ]}
        className="container mx-auto px-4 py-2"
      />

      <main>
        <header className="relative h-48 w-full sm:h-64 md:h-80 lg:h-96">
          {backdropUrl ? (
            <OptimizedImage
              src={backdropUrl}
              alt={`${movie.title} backdrop`}
              fill
              className="object-cover object-center opacity-40"
              priority
              imageType="backdrop"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
              quality={75}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-700 opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
        </header>

        <article className="container relative z-10 mx-auto -mt-16 px-4 pb-8 sm:-mt-20 md:-mt-32 md:px-6">
          <div className="flex items-start gap-4 sm:gap-6 md:gap-8">
            <aside className="w-28 shrink-0 sm:w-36 md:w-48 lg:w-60">
              <OptimizedImage
                src={posterUrl}
                alt={`${movie.title} movie poster`}
                width={300}
                height={450}
                className="h-auto w-full rounded-lg border-2 border-gray-800 shadow-xl sm:border-4"
                priority
                imageType="poster"
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 192px, 240px"
                quality={80}
              />
            </aside>

            <div className="min-w-0 flex-grow pt-2 sm:pt-4 md:pt-0">
              <div className="mb-2">
                <h1 className="text-base font-bold leading-tight text-white sm:text-lg md:text-xl lg:text-2xl">
                  {movie.title}
                </h1>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-300">
                  <span>{releaseYear}</span>
                  {movie.runtime && (
                    <>
                      <span>•</span>
                      <span>
                        {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-2 space-y-1.5">
                {movie.vote_average != null && movie.vote_average > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">
                      ({movie.vote_count?.toLocaleString()})
                    </span>
                  </div>
                )}

                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="shrink-0 whitespace-nowrap rounded-full bg-gray-700/80 px-2 py-0.5 text-xs"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <section>
                <h2 className="mb-1.5 text-xs font-semibold text-white sm:text-sm md:text-base">Overview</h2>
                <Description overview={movie.overview} />
              </section>

              {(movie.production_companies?.length ||
                movie.credits?.crew?.some((c) => c.job === 'Director')) && (
                <section className="sr-only mt-4 space-y-2">
                  {movie.credits?.crew?.some((c) => c.job === 'Director') && (
                    <div>
                      <h3 className="mb-1 text-xs font-medium text-gray-300">Director</h3>
                      <p className="text-xs text-gray-400">
                        {movie.credits.crew.filter((c) => c.job === 'Director').map((d) => d.name).join(', ')}
                      </p>
                    </div>
                  )}

                  {movie.production_companies && movie.production_companies.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-xs font-medium text-gray-300">Production</h3>
                      <p className="text-xs text-gray-400">
                        {movie.production_companies.slice(0, 2).map((company) => company.name).join(', ')}
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </article>

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
            <section className="px-0 md:px-6">
              <div className="container mx-auto">
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
                  />
                </Suspense>
              </div>
            </section>
          ) : (
            <section className="container mx-auto px-4 md:px-6">
              <div className="rounded-lg bg-gray-800/50 p-6 text-center">
                <h3 className="mb-4 text-xl font-semibold text-white">Streaming Currently Unavailable</h3>
                <p className="mb-6 text-gray-300">
                  We&apos;re temporarily unable to provide streaming links for {movie.title}. This could be due to
                  maintenance or regional restrictions.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <a
                      href={`https://www.themoviedb.org/movie/${movie.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                      View on TMDB
                    </a>
                    <a
                      href={`https://www.imdb.com/title/${movie.external_ids?.imdb_id || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
                    >
                      View on IMDb
                    </a>
                  </div>
                  {trailerId && (
                    <div className="mt-4">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailerId}`}
                        title={`${movie.title} Trailer`}
                        className="aspect-video w-full rounded-lg"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </MovieReleaseHandler>

        <section className="container mx-auto mb-8 mt-8 px-4 md:px-6 sr-only">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-xl font-bold text-white">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="rounded-lg bg-gray-800/50 p-4">
                <summary className="cursor-pointer font-semibold text-white">
                  Where can I watch {movie.title} online for free?
                </summary>
                <p className="mt-2 text-sm text-gray-300">
                  You can watch {movie.title} online for free on BoredFlix. We offer high-quality streaming in HD with
                  no registration required.
                </p>
              </details>

              <details className="rounded-lg bg-gray-800/50 p-4">
                <summary className="cursor-pointer font-semibold text-white">What is {movie.title} about?</summary>
                <p className="mt-2 text-sm text-gray-300">
                  {movie.overview
                    ? `${movie.overview.substring(0, 200)}...`
                    : `${movie.title} is a ${movie.genres?.map((g) => g.name).join(', ') || 'movie'} available for free streaming on BoredFlix.`}
                </p>
              </details>

              {movie.runtime && (
                <details className="rounded-lg bg-gray-800/50 p-4">
                  <summary className="cursor-pointer font-semibold text-white">How long is {movie.title}?</summary>
                  <p className="mt-2 text-sm text-gray-300">
                    {movie.title} has a runtime of {Math.floor(movie.runtime / 60)} hours and {movie.runtime % 60}{' '}
                    minutes.
                  </p>
                </details>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
