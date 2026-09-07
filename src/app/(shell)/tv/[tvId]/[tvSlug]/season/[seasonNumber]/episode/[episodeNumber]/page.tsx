import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { OPTIMIZED_IMAGE_SIZES, TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import { generateOptimizedImageSet, generateOpenGraphImages } from '@/utils/imageMetadata';
import { discoverStreamSources } from '@/utils/sourceHelper';
import { createSlug } from '@/utils/movieLinks';
import { buildCanonicalUrl, getCanonicalOrigin } from '@/utils/siteUrl';
import { buildEpisodeFaqItems, buildEpisodeFaqJsonLd } from '@/utils/seoFaq';
import { loadTvDetail } from '@/lib/detail/loadTvDetail';
import { loadEpisodeDetail } from '@/lib/detail/loadEpisodeDetail';
import TvDetailV2 from '@/components/detail/v2/TvDetailV2';
import DetailV2Faq from '@/components/detail/v2/DetailV2Faq';
import { getHomeLayout } from '@/utils/homeLayout';

/**
 * Per-episode page: /tv/{id}/{slug}/season/{s}/episode/{e}
 *
 * Episode-level demand ("<show> season 3 episode 5 online") was completely uncovered — episodes
 * were client-side state with no URL, so there was nothing for Google to rank. Unlike movie
 * pages, the per-episode synopsis is genuinely unique text rather than the same TMDB blob every
 * other site republishes.
 */

type Props = {
  params: Promise<{
    tvId: string;
    tvSlug: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
};

const episodePath = (tvId: string, slug: string, s: number | string, e: number | string) =>
  `/tv/${tvId}/${slug}/season/${s}/episode/${e}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tvId, seasonNumber, episodeNumber } = await params;
  const [show, found] = await Promise.all([
    loadTvDetail(tvId),
    loadEpisodeDetail(tvId, seasonNumber, episodeNumber),
  ]);

  if (!show || !found) {
    return { title: 'Episode Not Found | BoredFlix', robots: { index: false, follow: true } };
  }

  const { episode } = found;
  const slug = createSlug(show.name);
  const se = `Season ${episode.season_number} Episode ${episode.episode_number}`;
  const title = `${show.name} ${se}${episode.name ? `: ${episode.name}` : ''} | Watch Free | BoredFlix`;

  // Lead with the phrase people search, then the episode's own synopsis (the unique part).
  const head = `Watch ${show.name} S${episode.season_number}E${episode.episode_number} online free`;
  const tail = ' No sign up on BoredFlix.';
  const budget = 155 - head.length - 3 - tail.length;
  const body = (episode.overview || episode.name || '').trim();
  const clipped =
    body.length > budget && budget > 20
      ? `${body.slice(0, budget - 1).replace(/\s+\S*$/, '')}…`
      : body;
  const description = clipped ? `${head} — ${clipped}${tail}` : `${head}.${tail}`;

  const url = buildCanonicalUrl(
    episodePath(tvId, slug, episode.season_number, episode.episode_number)
  );
  const domain = getCanonicalOrigin();
  const stillUrl = episode.still_path ? `${TMDB_IMAGE_BASE_URL}w780${episode.still_path}` : null;
  const images = generateOptimizedImageSet(show.poster_path, domain);

  return {
    title,
    description,
    metadataBase: new URL(domain),
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'video.episode',
      url,
      images: stillUrl
        ? [{ url: stillUrl, width: 780, height: 439, alt: `${show.name} ${se}` }]
        : generateOpenGraphImages(images, `${show.name} poster`),
      siteName: 'BoredFlix',
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { tvId, tvSlug, seasonNumber, episodeNumber } = await params;

  const [show, found] = await Promise.all([
    loadTvDetail(tvId),
    loadEpisodeDetail(tvId, seasonNumber, episodeNumber),
  ]);
  if (!show || !found) notFound();

  const { season, episode } = found;

  // Same slug normalisation the show page does, so one episode has exactly one URL.
  const canonicalSlug = createSlug(show.name);
  if (tvSlug !== canonicalSlug) {
    redirect(episodePath(tvId, canonicalSlug, episode.season_number, episode.episode_number));
  }

  const sources = discoverStreamSources();
  const images = generateOptimizedImageSet(show.poster_path);
  const backdropUrl = show.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${OPTIMIZED_IMAGE_SIZES.backdrop.large}${show.backdrop_path}`
    : null;
  const firstAirYear = show.first_air_date ? show.first_air_date.substring(0, 4) : 'N/A';
  const videos = show.videos?.results || [];
  const trailerId = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer')?.key;

  const domain = getCanonicalOrigin();
  const canonicalUrl = buildCanonicalUrl(
    episodePath(tvId, canonicalSlug, episode.season_number, episode.episode_number)
  );
  const showUrl = buildCanonicalUrl(`/tv/${tvId}/${canonicalSlug}`);

  const faqInput = {
    showTitle: show.name,
    episodeName: episode.name,
    seasonNumber: episode.season_number,
    episodeNumber: episode.episode_number,
    overview: episode.overview,
    airDate: episode.air_date,
    runtime: episode.runtime,
    rating: episode.vote_average,
  };

  const episodeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: episode.name || `Episode ${episode.episode_number}`,
    episodeNumber: episode.episode_number,
    description: episode.overview || undefined,
    url: canonicalUrl,
    datePublished: episode.air_date || undefined,
    image: episode.still_path ? [`${TMDB_IMAGE_BASE_URL}w780${episode.still_path}`] : undefined,
    timeRequired: episode.runtime ? `PT${episode.runtime}M` : undefined,
    partOfSeason: {
      '@type': 'TVSeason',
      seasonNumber: episode.season_number,
      name: season.name || `Season ${episode.season_number}`,
    },
    partOfSeries: { '@type': 'TVSeries', name: show.name, url: showUrl },
    potentialAction: { '@type': 'WatchAction', target: canonicalUrl },
    aggregateRating:
      episode.vote_average && episode.vote_count && episode.vote_average > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: episode.vote_average.toFixed(1),
            bestRating: '10',
            worstRating: '0',
            ratingCount: episode.vote_count,
          }
        : undefined,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: domain },
      { '@type': 'ListItem', position: 2, name: 'TV Shows', item: `${domain}/browse/tv` },
      { '@type': 'ListItem', position: 3, name: show.name, item: showUrl },
      {
        '@type': 'ListItem',
        position: 4,
        name: `Season ${episode.season_number} Episode ${episode.episode_number}`,
        item: canonicalUrl,
      },
    ],
  };

  // Prev/next within the season — makes the whole episode set crawlable from any entry point.
  const nums = season.episodes.map((e) => e.episode_number).sort((a, b) => a - b);
  const idx = nums.indexOf(episode.episode_number);
  const prev = idx > 0 ? nums[idx - 1] : null;
  const next = idx >= 0 && idx < nums.length - 1 ? nums[idx + 1] : null;

  const airDatePretty = episode.air_date
    ? new Date(episode.air_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const stillUrl = episode.still_path ? `${TMDB_IMAGE_BASE_URL}w780${episode.still_path}` : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(episodeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildEpisodeFaqJsonLd(faqInput)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <TvDetailV2
        show={show}
        sources={sources}
        posterUrl={images.standard}
        backdropUrl={backdropUrl}
        firstAirYear={firstAirYear}
        trailerId={trailerId}
        inShell={getHomeLayout() === 'v2'}
        initialSeasonNumber={episode.season_number}
        initialEpisodeNumber={episode.episode_number}
        asSubheading
      />

      {/* Episode content — server-rendered, and the only genuinely unique text on the page. */}
      <section className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-zinc-500">
          <Link href="/browse/tv" className="hover:text-zinc-300">
            TV Shows
          </Link>
          <span className="px-1.5">/</span>
          <Link href={`/tv/${tvId}/${canonicalSlug}`} className="hover:text-zinc-300">
            {show.name}
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-zinc-400">
            S{episode.season_number} E{episode.episode_number}
          </span>
        </nav>

        <div className="flex flex-col gap-5 sm:flex-row">
          {stillUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={stillUrl}
              alt={`${show.name} season ${episode.season_number} episode ${episode.episode_number} still`}
              width={390}
              height={219}
              loading="lazy"
              className="w-full rounded-xl sm:w-[390px]"
            />
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl">
              {show.name}: Season {episode.season_number} Episode {episode.episode_number}
              {episode.name ? ` — ${episode.name}` : ''}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
              {episode.vote_average != null && episode.vote_average > 0 && (
                <>
                  <span className="font-semibold text-amber-400">
                    ★ {episode.vote_average.toFixed(1)}
                  </span>
                  <span className="text-zinc-600">·</span>
                </>
              )}
              {airDatePretty && <span>Aired {airDatePretty}</span>}
              {episode.runtime ? (
                <>
                  <span className="text-zinc-600">·</span>
                  <span>{episode.runtime} min</span>
                </>
              ) : null}
            </div>

            {episode.overview && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{episode.overview}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {prev && (
                <Link
                  href={episodePath(tvId, canonicalSlug, episode.season_number, prev)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08]"
                >
                  ← Episode {prev}
                </Link>
              )}
              {next && (
                <Link
                  href={episodePath(tvId, canonicalSlug, episode.season_number, next)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08]"
                >
                  Episode {next} →
                </Link>
              )}
              <Link
                href={`/tv/${tvId}/${canonicalSlug}`}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08]"
              >
                All episodes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <DetailV2Faq
        title={`${show.name} S${episode.season_number}E${episode.episode_number}`}
        items={buildEpisodeFaqItems(faqInput)}
      />
    </>
  );
}
