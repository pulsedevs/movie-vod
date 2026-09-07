import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { OPTIMIZED_IMAGE_SIZES, TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import { generateOptimizedImageSet } from '@/utils/imageMetadata';
import { discoverStreamSources } from '@/utils/sourceHelper';
import { createSlug } from '@/utils/movieLinks';
import { loadMovieDetail } from '@/lib/detail/loadMovieDetail';
import MovieDetailV2 from '@/components/detail/v2/MovieDetailV2';

type MovieShellPageProps = {
  params: Promise<{ movieId: string; movieSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: MovieShellPageProps): Promise<Metadata> {
  const { movieId } = await props.params;
  const movie = await loadMovieDetail(movieId);

  if (!movie) {
    return {
      title: 'Movie Not Found | BoredFlix',
      description: 'The requested movie could not be found. Explore more movies and stream online in HD on BoredFlix.',
      robots: { index: false, follow: false },
    };
  }

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
  const genreNames = movie.genres?.map((g: { name: string }) => g.name).join(', ') || 'Movies';
  const firstSentence = `Where can I watch ${movie.title} online for free? You can stream ${movie.title} (${releaseYear}) on BoredFlix in HD with no registration required.`;
  const detailSentence = movie.overview ? ` ${movie.overview.substring(0, 95).trim()}` : ` Watch this ${genreNames} movie now.`;
  const full = `${firstSentence}${detailSentence}`;
  const description = full.length > 158 ? `${full.substring(0, 155).trim()}...` : full;

  return {
    title: `${movie.title} (${releaseYear}) Movie | Watch Online Free | BoredFlix`,
    description,
    robots: { index: false, follow: false },
  };
}

export default async function HomePreviewMoviePage({ params, searchParams }: MovieShellPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { movieId, movieSlug } = resolvedParams;

  const movie = await loadMovieDetail(movieId);
  if (!movie) {
    notFound();
  }

  const canonicalSlug = createSlug(movie.title);
  if (movieSlug !== canonicalSlug) {
    redirect(`/home-preview/movie/${movieId}/${canonicalSlug}`);
  }

  const sources = discoverStreamSources();
  const images = generateOptimizedImageSet(movie.poster_path);
  const posterUrl = images.standard;
  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${OPTIMIZED_IMAGE_SIZES.backdrop.large}${movie.backdrop_path}`
    : null;
  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';

  const officialTrailer = movie.videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  const trailerId = officialTrailer?.key;

  const initialSourceIndex =
    resolvedSearchParams.source && !Array.isArray(resolvedSearchParams.source)
      ? parseInt(resolvedSearchParams.source, 10)
      : undefined;

  return (
    <MovieDetailV2
      movie={movie}
      sources={sources}
      posterUrl={posterUrl}
      backdropUrl={backdropUrl}
      releaseYear={releaseYear}
      trailerId={trailerId}
      initialSourceIndex={initialSourceIndex}
      inShell
    />
  );
}
