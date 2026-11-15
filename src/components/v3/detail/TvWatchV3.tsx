'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarClock, Play } from 'lucide-react';
import type { Season } from '@/types';
import { readContinueWatching } from '@/utils/libraryStorage';
import DetailHeroV3 from './DetailHeroV3';
import { watchHref } from '../watch/links';

type HeroProps = Omit<React.ComponentProps<typeof DetailHeroV3>, 'playHref' | 'playLabel'>;

interface TvWatchV3Props {
  hero: HeroProps;
  tvId: number;
  showName: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasons: Season[];
  /** Episode pages: Play starts this episode. */
  initialSeasonNumber?: number;
  initialEpisodeNumber?: number;
  /** The open season's episodes, loaded with the page (no client round trip for the first view). */
  initialSeasonData?: { season: number; data: SeasonEps | null } | null;
}

/** What the page needs of a season (TMDB season details / the server's SeasonDetail). */
export interface SeasonEps {
  episodes?: Array<{
    episode_number: number;
    name?: string;
    overview?: string;
    still_path?: string | null;
    runtime?: number | null;
    air_date?: string | null;
  }>;
}

type Ep = { s: number; e: number };

const fmtMin = (m?: number | null) => (m ? (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`) : null);
const aired = (d?: string | null) => !d || new Date(`${d}T00:00:00`).getTime() <= Date.now();
const fmtDate = (d?: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';

/** Where this viewer left the show (Continue Watching), in either field style the site has written. */
function resumePoint(tvId: number): Ep | null {
  const it = readContinueWatching().find((x) => Number(x.id) === tvId && x.media_type === 'tv') as
    | { season?: number; episode?: number; season_number?: number; episode_number?: number }
    | undefined;
  const s = it?.season ?? it?.season_number;
  const e = it?.episode ?? it?.episode_number;
  return s != null && e != null ? { s: Number(s), e: Number(e) } : null;
}

/**
 * The TV detail page's interactive part: the hero, whose Play opens the player page on the
 * viewer's episode (an episode page's own episode, else where they left off, else the first one),
 * and the episodes section - season tabs + episode cards, each opening that episode's player page.
 */
export default function TvWatchV3(props: TvWatchV3Props) {
  const { hero, tvId, seasons } = props;

  const tabs = useMemo(() => {
    const real = seasons.filter((s) => s.season_number > 0 && s.episode_count > 0).sort((a, b) => a.season_number - b.season_number);
    const specials = seasons.filter((s) => s.season_number === 0 && s.episode_count > 0);
    return [...real, ...specials];
  }, [seasons]);

  const [season, setSeason] = useState<number | null>(props.initialSeasonNumber ?? tabs[0]?.season_number ?? null);
  const [data, setData] = useState<Record<number, SeasonEps | null>>(() =>
    props.initialSeasonData ? { [props.initialSeasonData.season]: props.initialSeasonData.data } : {},
  );
  const [resume, setResume] = useState<Ep | null>(null);

  // Resume point (browser only), and its season as the open tab unless the page chose one.
  useEffect(() => {
    const r = resumePoint(tvId);
    setResume(r);
    if (r && props.initialSeasonNumber == null && tabs.some((t) => t.season_number === r.s)) setSeason(r.s);
  }, [tvId, tabs, props.initialSeasonNumber]);

  // Episodes of the open season, cached per season.
  useEffect(() => {
    if (season == null || season in data) return;
    let alive = true;
    fetch(`/api/tv/season?tvId=${tvId}&seasonNumber=${season}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d: SeasonEps | null) => {
        if (alive) setData((prev) => (season in prev ? prev : { ...prev, [season]: d }));
      });
    return () => {
      alive = false;
    };
  }, [season, tvId, data]);

  const pageEp: Ep | null =
    props.initialSeasonNumber != null && props.initialEpisodeNumber != null
      ? { s: props.initialSeasonNumber, e: props.initialEpisodeNumber }
      : null;
  const target = pageEp ?? resume;
  const playHref = target ? watchHref('tv', tvId, target.s, target.e) : watchHref('tv', tvId);
  const playLabel = pageEp
    ? `Play S${pageEp.s} E${pageEp.e}`
    : resume
      ? `Resume S${resume.s} E${resume.e}`
      : 'Play S1 E1';

  const episodes = season != null ? data[season]?.episodes : undefined;
  const loading = season != null && !(season in data);

  return (
    <>
      <DetailHeroV3 {...hero} playHref={playHref} playLabel={playLabel} />

      <section id="v3-episodes" className="v3-gutter scroll-mt-24 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight md:text-[22px]">Episodes</h2>
          {tabs.length > 1 && (
            <div className="v3-scroller -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Seasons">
              {tabs.map((t) => {
                const on = t.season_number === season;
                return (
                  <button
                    key={t.season_number}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setSeason(t.season_number)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      on
                        ? 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)]'
                        : 'border border-white/10 bg-white/[0.06] text-white/75 backdrop-blur-xl hover:bg-white/[0.12] hover:text-white'
                    }`}
                  >
                    {t.season_number === 0 ? 'Specials' : `Season ${t.season_number}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        ) : !episodes?.length ? (
          <p className="text-sm text-white/50">No episodes listed for this season yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {episodes.map((ep) => {
              const isResume = resume?.s === season && resume?.e === ep.episode_number;
              const ok = aired(ep.air_date);
              const card = (
                <>
                  <div
                    className={`relative aspect-video overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 ${
                      ok ? 'group-hover/ep:-translate-y-1 group-hover/ep:ring-white/25' : 'opacity-50'
                    }`}
                  >
                    {ep.still_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white/15">
                        E{ep.episode_number}
                      </span>
                    )}
                    {ok && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/ep:opacity-100">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
                          <Play className="ml-0.5 h-5 w-5 fill-black" />
                        </span>
                      </span>
                    )}
                    {isResume && ok && (
                      <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-black">
                        Continue
                      </span>
                    )}
                    {!ok && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                        <CalendarClock className="h-3 w-3" /> {fmtDate(ep.air_date)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-medium text-white/50">
                    E{ep.episode_number}
                    {fmtMin(ep.runtime) ? ` · ${fmtMin(ep.runtime)}` : ''}
                    {ep.air_date && ok ? ` · ${fmtDate(ep.air_date)}` : ''}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[15px] font-semibold text-white">{ep.name || `Episode ${ep.episode_number}`}</p>
                  {ep.overview && <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/60">{ep.overview}</p>}
                </>
              );
              return ok && season != null ? (
                <Link key={ep.episode_number} href={watchHref('tv', tvId, season, ep.episode_number)} className="group/ep block">
                  {card}
                </Link>
              ) : (
                <div key={ep.episode_number} aria-disabled className="cursor-not-allowed">
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
