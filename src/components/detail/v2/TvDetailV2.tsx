import { Suspense } from 'react';
import Link from 'next/link';
import type { Season, StreamSource } from '@/types';
import type { TvShowWithCredits } from '@/lib/detail/tvTypes';
import OptimizedImage from '@/components/common/OptimizedImage';
import DetailV2OverviewCollapse from '@/components/detail/v2/DetailV2OverviewCollapse';
import SeasonEpisodeBrowser from '@/components/tv/SeasonEpisodeBrowser';
import TVReleaseHandler from '@/components/tv/TVReleaseHandler';
import { EpisodesLoading } from '@/components/common/StreamingLoading';
import DetailV2CastStrip from '@/components/detail/v2/DetailV2CastStrip';
import DetailV2Faq from '@/components/detail/v2/DetailV2Faq';
import { buildFaqItems } from '@/utils/seoFaq';
import { tvFaqInput } from '@/lib/detail/faqInput';
import DetailV2PlayerEntrance from '@/components/detail/v2/DetailV2PlayerEntrance';
import DetailV2MetadataEntrance from '@/components/detail/v2/DetailV2MetadataEntrance';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import { navThemes } from '@/components/home/v2/navThemes';

interface TvDetailV2Props {
  show: TvShowWithCredits;
  sources: StreamSource[];
  posterUrl: string;
  backdropUrl: string | null;
  firstAirYear: string;
  trailerId?: string;
  initialSourceIndex?: number;
  inShell?: boolean;
  /** Deep-linked episode page — the player opens on this episode. */
  initialSeasonNumber?: number;
  initialEpisodeNumber?: number;
  /** Episode pages own the <h1>, so the show name renders as <h2> there (one h1 per page). */
  asSubheading?: boolean;
  /** Crawlable episode links (the interactive grid is client state, so it has no hrefs). */
  episodeLinks?: {
    slug: string;
    latestSeason: number;
    episodes: Array<{ episode_number: number; name?: string }>;
    otherSeasons: number[];
  } | null;
}

export default function TvDetailV2({
  show,
  sources,
  posterUrl,
  backdropUrl,
  firstAirYear,
  trailerId,
  initialSourceIndex,
  inShell = false,
  initialSeasonNumber,
  initialEpisodeNumber,
  asSubheading = false,
  episodeLinks = null,
}: TvDetailV2Props) {
  const ShowHeading = asSubheading ? 'h2' : 'h1';
  const creators = show.created_by?.map((c) => c.name) ?? [];
  const networks = show.networks?.slice(0, 3).map((n) => n.name) ?? [];
  const cast = show.credits?.cast?.slice(0, 12) ?? [];
  const theme = navThemes.tv;
  const seasons: Season[] = show.seasons ?? [];

  const playerBlock = (
    <TVReleaseHandler
      tvShow={{
        id: show.id,
        name: show.name,
        first_air_date: show.first_air_date,
        poster_path: show.poster_path,
        overview: show.overview,
      }}
      trailerId={trailerId}
    >
      {sources && sources.length > 0 && seasons.length > 0 ? (
        <Suspense fallback={<EpisodesLoading />}>
          <SeasonEpisodeBrowser
            tvId={show.id}
            showTitle={show.name}
            initialSeasons={seasons}
            sources={sources}
            trailerId={trailerId}
            voteCount={show.vote_count}
            initialSourceIndex={initialSourceIndex}
            inShell={inShell}
            posterPath={show.poster_path}
            initialSeasonNumber={initialSeasonNumber}
            initialEpisodeNumber={initialEpisodeNumber}
          />
        </Suspense>
      ) : (
        <div className="mx-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-center sm:mx-0">
          <h3 className="mb-2 text-lg font-semibold text-white">Streaming Currently Unavailable</h3>
          <p className="text-sm text-zinc-400">
            We&apos;re temporarily unable to provide streaming links for {show.name}.
          </p>
        </div>
      )}
    </TVReleaseHandler>
  );

  const statusColor =
    show.status?.toLowerCase() === 'returning series'
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      : show.status?.toLowerCase() === 'ended' || show.status?.toLowerCase() === 'canceled'
      ? 'bg-red-500/10 border-red-500/20 text-red-400'
      : 'bg-sky-500/10 border-sky-500/20 text-sky-400';

  const metadataBlock = (
    <article className={`relative ${inShell ? 'px-4 py-4' : 'mx-auto max-w-[1400px] px-4 py-7 sm:px-6'}`}>
      <div className={`flex gap-4 items-start ${inShell ? '' : 'sm:gap-7'}`}>

        {/* Poster — compact */}
        <aside className={`shrink-0 ${inShell ? 'w-16 sm:w-[100px]' : 'w-[100px] sm:w-[120px] md:w-[130px]'}`} style={{ aspectRatio: '2/3' }}>
          <OptimizedImage
            src={posterUrl}
            alt={`${show.name} poster`}
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
          <ShowHeading className={`font-bold leading-tight text-white ${inShell ? 'text-base sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
            {show.name}
          </ShowHeading>

          {/* Single compact meta line with dots */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-400">
            {show.vote_average != null && show.vote_average > 0 && (
              <span className="font-semibold text-amber-400">★ {show.vote_average.toFixed(1)}</span>
            )}
            {show.vote_average != null && show.vote_average > 0 && <span className="text-zinc-600">·</span>}
            <span>{firstAirYear}</span>
            {show.status && (
              <span className={`ml-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
                {show.status}
              </span>
            )}
          </div>

          {/* Genres — desktop: all pills; mobile: hidden (first pill moves inline with About) */}
          {show.genres && show.genres.length > 0 && (
            <div className="mt-2 hidden md:flex flex-wrap gap-1">
              {show.genres.map((genre) => (
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
            overview={show.overview}
            credits={[
              { label: 'Created by', names: creators },
              { label: 'Network', names: networks },
            ]}
            mobileGenre={
              show.genres?.[0] ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: theme.label, backgroundColor: theme.bgActive }}
                >
                  {show.genres[0].name}
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

      {episodeLinks && episodeLinks.episodes.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6" aria-labelledby="ep-links-heading">
          <h2
            id="ep-links-heading"
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >
            {show.name} Season {episodeLinks.latestSeason} episodes
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {episodeLinks.episodes.map((ep) => (
              <li key={ep.episode_number}>
                <Link
                  href={`/tv/${show.id}/${episodeLinks.slug}/season/${episodeLinks.latestSeason}/episode/${ep.episode_number}`}
                  className="inline-block rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
                  title={ep.name || `Episode ${ep.episode_number}`}
                >
                  E{ep.episode_number}
                </Link>
              </li>
            ))}
          </ul>
          {episodeLinks.otherSeasons.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {episodeLinks.otherSeasons.map((sn) => (
                <li key={sn}>
                  <Link
                    href={`/tv/${show.id}/${episodeLinks.slug}/season/${sn}/episode/1`}
                    className="inline-block rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:border-white/15 hover:text-zinc-300"
                  >
                    Season {sn}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <DetailV2Faq title={show.name} items={buildFaqItems(tvFaqInput(show, firstAirYear))} />
    </div>
  );
}
