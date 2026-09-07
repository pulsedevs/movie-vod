import { notFound, redirect } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { OPTIMIZED_IMAGE_SIZES, TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import {
  generateOptimizedImageSet,
  generateOpenGraphImages,
  generateStructuredDataImages,
} from '@/utils/imageMetadata';
import { discoverStreamSources } from '@/utils/sourceHelper';
import { createSlug } from '@/utils/movieLinks';
import { buildCanonicalUrl, getCanonicalOrigin } from '@/utils/siteUrl';
import { buildDetailDescription } from '@/utils/seoDescription';
import { buildFaqJsonLd } from '@/utils/seoFaq';
import { movieFaqInput } from '@/lib/detail/faqInput';
import { loadMovieDetail } from '@/lib/detail/loadMovieDetail';
import type { MovieWithCredits } from '@/lib/detail/movieTypes';
import MovieDetailV2 from '@/components/detail/v2/MovieDetailV2';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { getHomeLayout } from '@/utils/homeLayout';

type MovieDetailPageProps = {
  params: Promise<{ movieId: string; movieSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: MovieDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const { movieId } = params;
  const movie = await loadMovieDetail(movieId);

  if (!movie) {
    return {
      title: 'Movie Not Found | BoredFlix',
      description:
        'The requested movie could not be found. Explore more movies and stream online in HD on BoredFlix.',
    };
  }

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
  const genreNames = movie.genres?.map((g) => g.name).join(', ') || 'Movies';
  const title = `${movie.title} (${releaseYear}) Movie | Watch Online Free | BoredFlix`;

  const description = buildDetailDescription({
    title: movie.title,
    year: releaseYear,
    overview: movie.overview,
    genres: genreNames,
    kind: 'movie',
  });

  const canonicalSlug = createSlug(movie.title);
  const canonicalUrl = buildCanonicalUrl(`/movie/${movieId}/${canonicalSlug}`);
  const domain = getCanonicalOrigin();
  const images = generateOptimizedImageSet(movie.poster_path, domain);

  return {
    title,
    description,
    metadataBase: new URL(domain),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url: canonicalUrl,
      images: generateOpenGraphImages(images, `${movie.title} poster`),
      siteName: 'BoredFlix',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: movie.poster_path ? [images.googleOptimized] : [],
      creator: '@boredflix',
      site: '@boredflix',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: `where to watch ${movie.title} for free, watch ${movie.title}, ${movie.title} online, stream ${movie.title}, ${genreNames}, movies online, free streaming`,
  };
}

function buildMovieJsonLd(movie: MovieWithCredits, movieId: string, canonicalSlug: string) {
  const images = generateOptimizedImageSet(movie.poster_path);
  const canonicalPageUrl = buildCanonicalUrl(`/movie/${movieId}/${canonicalSlug}`);

  let contentRating = movie.adult ? 'Mature' : 'Family';
  if (movie.release_dates?.results) {
    const usRelease = movie.release_dates.results.find((r) => r.iso_3166_1 === 'US');
    if (usRelease?.release_dates?.[0]?.certification) {
      contentRating = usRelease.release_dates[0].certification;
    }
  }

  const creators = Array.isArray(movie.created_by)
    ? movie.created_by.map((creator) => ({
        '@type': 'Person',
        name: creator.name,
      }))
    : [];

  let keywords =
    movie.keywords?.results?.map((k) => k.name).join(',') ||
    movie.genres?.map((g) => g.name).join(',') ||
    '';
  keywords = `where to watch ${movie.title} for free, ${keywords}`;

  // Backdrop (landscape 16:9) first — Google prefers it for movie/video rich results
  const backdropImages = movie.backdrop_path
    ? [
        `${TMDB_IMAGE_BASE_URL}w1280${movie.backdrop_path}`,
        `${TMDB_IMAGE_BASE_URL}w780${movie.backdrop_path}`,
      ]
    : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview || `Watch ${movie.title} online free on BoredFlix`,
    image: [...backdropImages, ...generateStructuredDataImages(images)],
    url: canonicalPageUrl,
    datePublished: movie.release_date || undefined,
    inLanguage: 'en',
    contentRating,
    genre: movie.genres?.map((g) => g.name) || [],
    keywords,
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    potentialAction: {
      '@type': 'WatchAction',
      target: canonicalPageUrl,
    },
    productionCompany:
      movie.production_companies?.slice(0, 3).map((company) => ({
        '@type': 'Organization',
        name: company.name,
        ...(company.origin_country && {
          address: { '@type': 'PostalAddress', addressCountry: company.origin_country },
        }),
      })) || [],
    aggregateRating:
      movie.vote_average && movie.vote_count && movie.vote_average > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: movie.vote_average.toFixed(1),
            bestRating: '10',
            worstRating: '0',
            ratingCount: movie.vote_count,
          }
        : undefined,
    actor:
      movie.credits?.cast?.slice(0, 10).map((actor) => ({
        '@type': 'Person',
        name: actor.name,
        ...(actor.character && { characterName: actor.character }),
      })) || [],
    director:
      movie.credits?.crew
        ?.filter((c) => c.job === 'Director')
        .map((d) => ({
          '@type': 'Person',
          name: d.name,
        })) || [],
    creator: creators,
  };

  // Same builder as the visible FAQ (MovieDetailV2) — markup and rendered text can't diverge.
  const faqJsonLd = buildFaqJsonLd(
    movieFaqInput(movie, movie.release_date ? movie.release_date.substring(0, 4) : undefined)
  );

  return { jsonLd, faqJsonLd };
}

export default async function MovieDetailPage({ params, searchParams }: MovieDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { movieId, movieSlug } = resolvedParams;

  const movie = await loadMovieDetail(movieId);
  if (!movie) {
    notFound();
  }

  const canonicalSlug = createSlug(movie.title);
  if (movieSlug !== canonicalSlug) {
    redirect(`/movie/${movieId}/${canonicalSlug}`);
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

  const { jsonLd, faqJsonLd } = buildMovieJsonLd(movie, movieId, canonicalSlug);
  const initialSourceIndex =
    resolvedSearchParams.source && !Array.isArray(resolvedSearchParams.source)
      ? parseInt(resolvedSearchParams.source, 10)
      : undefined;

  const domain = getCanonicalOrigin();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {getHomeLayout() !== 'v2' && (
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Movies', href: '/browse/movies' },
            { label: movie.title, current: true },
          ]}
          baseUrl={domain}
        />
      )}
      <MovieDetailV2
        movie={movie}
        sources={sources}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        releaseYear={releaseYear}
        trailerId={trailerId}
        initialSourceIndex={initialSourceIndex}
        inShell={getHomeLayout() === 'v2'}
      />
    </>
  );
}
