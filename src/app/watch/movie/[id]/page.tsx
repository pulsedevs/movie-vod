import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadMovieDetail } from '@/lib/detail/loadMovieDetail';
import { createSlug } from '@/utils/movieLinks';
import { buildCanonicalUrl } from '@/utils/siteUrl';
import WatchScreen from '@/components/v3/watch/WatchScreen';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await loadMovieDetail(id);
  if (!movie) return { title: 'Movie Not Found | BoredFlix', robots: { index: false } };
  return {
    title: `Watch ${movie.title} | BoredFlix`,
    // The details page is the one to index; this is just its player.
    robots: { index: false, follow: true },
    alternates: { canonical: buildCanonicalUrl(`/movie/${id}/${createSlug(movie.title)}`) },
  };
}

/** The movie player page: the film fills the window. */
export default async function WatchMoviePage({ params }: Props) {
  const { id } = await params;
  const movie = await loadMovieDetail(id);
  if (!movie) notFound();

  return (
    <WatchScreen
      kind="movie"
      tmdbId={movie.id}
      title={movie.title}
      detailsHref={`/movie/${movie.id}/${createSlug(movie.title)}`}
      posterPath={movie.poster_path ?? null}
      backdropPath={movie.backdrop_path ?? null}
      origLang={movie.original_language}
    />
  );
}
