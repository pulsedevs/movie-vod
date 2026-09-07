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
import { tvFaqInput } from '@/lib/detail/faqInput';
import { loadTvDetail } from '@/lib/detail/loadTvDetail';
import { loadSeasonDetail } from '@/lib/detail/loadEpisodeDetail';
import type { TvShowWithCredits } from '@/lib/detail/tvTypes';
import TvDetailV2 from '@/components/detail/v2/TvDetailV2';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { getHomeLayout } from '@/utils/homeLayout';

type TvShowDetailPageProps = {
  params: Promise<{ tvId: string; tvSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: TvShowDetailPageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { tvId } = await props.params;
  const show = await loadTvDetail(tvId);

  if (!show) {
    return {
      title: 'TV Show Not Found | BoredFlix',
      description:
        'The requested TV show could not be found. Explore more TV shows and stream online in HD on BoredFlix.',
    };
  }

  const firstAirYear = show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A';
  const genreNames = show.genres?.map((g) => g.name).join(', ') || 'TV Shows';
  const seasonsText = show.number_of_seasons
    ? `${show.number_of_seasons} season${show.number_of_seasons > 1 ? 's' : ''}`
    : 'all available episodes';

  const title = `${show.name} (${firstAirYear}) TV Series | Watch Online Free | BoredFlix`;

  const description = buildDetailDescription({
    title: show.name,
    year: firstAirYear,
    overview: show.overview,
    genres: genreNames,
    kind: 'tv',
    seasonsText,
  });

  const canonicalSlug = createSlug(show.name);
  const canonicalUrl = buildCanonicalUrl(`/tv/${tvId}/${canonicalSlug}`);
  const domain = getCanonicalOrigin();
  const images = generateOptimizedImageSet(show.poster_path, domain);
  const keywords = `where to watch ${show.name} for free, watch ${show.name}, ${show.name} online, stream ${show.name}, ${genreNames}, TV shows online, free streaming`;

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
      type: 'video.tv_show',
      url: canonicalUrl,
      images: generateOpenGraphImages(images, `${show.name} poster`),
      siteName: 'BoredFlix',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: show.poster_path ? [images.googleOptimized] : [],
      creator: '@boredflix',
      site: '@boredflix',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    keywords,
  };
}

function buildTvJsonLd(show: TvShowWithCredits, tvId: string, canonicalSlug: string) {
  const images = generateOptimizedImageSet(show.poster_path);
  const canonicalUrl = buildCanonicalUrl(`/tv/${tvId}/${canonicalSlug}`);

  // Backdrop (landscape 16:9) first — Google prefers it for TV/video rich results
  const backdropImages = show.backdrop_path
    ? [
        `${TMDB_IMAGE_BASE_URL}w1280${show.backdrop_path}`,
        `${TMDB_IMAGE_BASE_URL}w780${show.backdrop_path}`,
      ]
    : [];

  const contentRating =
    show.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US')?.rating || 'TV-14';
  let keywords =
    show.keywords?.results?.map((k: any) => k.name).join(',') ||
    show.genres?.map((g) => g.name).join(',') ||
    '';
  keywords = `where to watch ${show.name} for free, ${keywords}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    alternativeName: show.original_name !== show.name ? show.original_name : undefined,
    description: show.overview || `Watch ${show.name} online free on BoredFlix`,
    image: [...backdropImages, ...generateStructuredDataImages(images)],
    url: canonicalUrl,
    numberOfSeasons: show.number_of_seasons,
    numberOfEpisodes: show.number_of_episodes,
    datePublished: show.first_air_date || undefined,
    inLanguage: 'en',
    contentRating,
    genre: show.genres?.map((g) => g.name) || [],
    keywords,
    potentialAction: {
      '@type': 'WatchAction',
      target: canonicalUrl,
    },
    productionCompany: show.production_companies?.slice(0, 3).map((c: any) => ({
      '@type': 'Organization',
      name: c.name,
      ...(c.origin_country && {
        address: { '@type': 'PostalAddress', addressCountry: c.origin_country },
      }),
    })) || [],
    aggregateRating:
      show.vote_average && show.vote_count && show.vote_average > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: show.vote_average.toFixed(1),
            bestRating: '10',
            worstRating: '0',
            ratingCount: show.vote_count,
          }
        : undefined,
    actor:
      show.credits?.cast?.slice(0, 10).map((actor) => ({
        '@type': 'Person',
        name: actor.name,
        ...(actor.character && { characterName: actor.character }),
      })) || [],
    director:
      show.credits?.crew
        ?.filter((c) => c.job === 'Director')
        .map((d) => ({ '@type': 'Person', name: d.name })) || [],
    creator:
      show.created_by?.map((creator) => ({ '@type': 'Person', name: creator.name })) || [],
    ...(show.networks?.length && {
      publisher: show.networks.map((n: any) => ({ '@type': 'Organization', name: n.name })),
    }),
  };

  // Same builder as the visible FAQ (TvDetailV2) — markup and rendered text can't diverge.
  const faqJsonLd = buildFaqJsonLd(
    tvFaqInput(show, show.first_air_date ? show.first_air_date.substring(0, 4) : undefined)
  );
  return { jsonLd, faqJsonLd };
}

export default async function TvShowDetailPage({ params, searchParams }: TvShowDetailPageProps) {
  const { tvId, tvSlug } = await params;
  const resolvedSearchParams = await searchParams;

  const show = await loadTvDetail(tvId);
  if (!show) notFound();

  const canonicalSlug = createSlug(show.name);
  if (tvSlug !== canonicalSlug) {
    redirect(`/tv/${tvId}/${canonicalSlug}`);
  }

  const sources = discoverStreamSources();
  const images = generateOptimizedImageSet(show.poster_path);
  const posterUrl = images.standard;
  const backdropUrl = show.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${OPTIMIZED_IMAGE_SIZES.backdrop.large}${show.backdrop_path}`
    : null;
  const firstAirYear = show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A';

  const videos = show.videos?.results || [];
  const officialTrailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube');
  const trailerId = officialTrailer?.key;

  const initialSourceIndex =
    resolvedSearchParams.source && !Array.isArray(resolvedSearchParams.source)
      ? parseInt(resolvedSearchParams.source, 10)
      : undefined;

  const { jsonLd, faqJsonLd } = buildTvJsonLd(show, tvId, canonicalSlug);
  const domain = getCanonicalOrigin();

  // Crawlable episode links. The interactive grid is client state with no hrefs, so without this
  // the per-episode pages would have no inbound links and would never be discovered.
  // Season 0 is Specials; a season with episode_count 0 is announced but not yet aired (TMDB
  // lists it anyway), so linking it would produce an empty list and hide the whole section.
  const realSeasons = (show.seasons ?? [])
    .filter((sn) => typeof sn.season_number === 'number' && sn.season_number > 0)
    .filter((sn) => (sn.episode_count ?? 0) > 0)
    .map((sn) => sn.season_number)
    .sort((a, b) => a - b);
  const latestSeason = realSeasons.length ? realSeasons[realSeasons.length - 1] : null;
  const latest = latestSeason ? await loadSeasonDetail(tvId, latestSeason) : null;
  const episodeLinks =
    latest && latestSeason
      ? {
          slug: canonicalSlug,
          latestSeason,
          episodes: latest.episodes.map((e) => ({
            episode_number: e.episode_number,
            name: e.name,
          })),
          // Entry point per season; prev/next on the episode pages walks the rest.
          otherSeasons: realSeasons.filter((n) => n !== latestSeason),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {getHomeLayout() !== 'v2' && (
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'TV Shows', href: '/browse/tv' },
            { label: show.name, current: true },
          ]}
          baseUrl={domain}
        />
      )}
      <TvDetailV2
        show={show}
        sources={sources}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        firstAirYear={firstAirYear}
        trailerId={trailerId}
        initialSourceIndex={initialSourceIndex}
        inShell={getHomeLayout() === 'v2'}
        episodeLinks={episodeLinks}
      />
    </>
  );
}
