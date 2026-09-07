import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { OPTIMIZED_IMAGE_SIZES, TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import { generateOptimizedImageSet } from '@/utils/imageMetadata';
import { discoverStreamSources } from '@/utils/sourceHelper';
import { createSlug } from '@/utils/movieLinks';
import { loadTvDetail } from '@/lib/detail/loadTvDetail';
import TvDetailV2 from '@/components/detail/v2/TvDetailV2';

type TvShellPageProps = {
  params: Promise<{ tvId: string; tvSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: TvShellPageProps): Promise<Metadata> {
  const { tvId } = await props.params;
  const show = await loadTvDetail(tvId);

  if (!show) {
    return {
      title: 'TV Show Not Found | BoredFlix',
      description: 'The requested TV show could not be found. Explore more TV shows and stream online in HD on BoredFlix.',
      robots: { index: false, follow: false },
    };
  }

  const firstAirYear = show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A';
  const genreNames = show.genres?.map((g: { name: string }) => g.name).join(', ') || 'TV Shows';
  const seasonsText = show.number_of_seasons ? `${show.number_of_seasons} season${show.number_of_seasons > 1 ? 's' : ''}` : 'all available episodes';
  const firstSentence = `Where can I watch ${show.name} online for free? You can watch ${show.name} (${firstAirYear}) on BoredFlix with ${seasonsText} in HD and no registration required.`;
  const detailSentence = show.overview ? ` ${show.overview.substring(0, 85).trim()}` : ` Stream this ${genreNames} series now.`;
  const full = `${firstSentence}${detailSentence}`;
  const description = full.length > 158 ? `${full.substring(0, 155).trim()}...` : full;

  return {
    title: `${show.name} (${firstAirYear}) TV Series | Watch Online Free | BoredFlix`,
    description,
    robots: { index: false, follow: false },
  };
}

export default async function HomePreviewTvPage({ params, searchParams }: TvShellPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { tvId, tvSlug } = resolvedParams;

  const show = await loadTvDetail(tvId);
  if (!show) {
    notFound();
  }

  const canonicalSlug = createSlug(show.name);
  if (tvSlug !== canonicalSlug) {
    redirect(`/home-preview/tv/${tvId}/${canonicalSlug}`);
  }

  const sources = discoverStreamSources();
  const images = generateOptimizedImageSet(show.poster_path);
  const posterUrl = images.standard;
  const backdropUrl = show.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${OPTIMIZED_IMAGE_SIZES.backdrop.large}${show.backdrop_path}`
    : null;
  const firstAirYear = show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A';

  const officialTrailer = show.videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  const trailerId = officialTrailer?.key;

  const initialSourceIndex =
    resolvedSearchParams.source && !Array.isArray(resolvedSearchParams.source)
      ? parseInt(resolvedSearchParams.source, 10)
      : undefined;

  return (
    <TvDetailV2
      show={show}
      sources={sources}
      posterUrl={posterUrl}
      backdropUrl={backdropUrl}
      firstAirYear={firstAirYear}
      trailerId={trailerId}
      initialSourceIndex={initialSourceIndex}
      inShell
    />
  );
}
