'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarClock, Play } from 'lucide-react';
import type { Season } from '@/types';
import { readContinueWatching } from '@/utils/libraryStorage';
import DetailHeroV3 from './DetailHeroV3';
import { watchHref } from '../watch/links';
import RowScroller from '../rows/RowScroller';

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

      {/* Episodes: one sideways row of cards (like the home rows), season tabs on the right. */}
      <div id="v3-episodes" className="scroll-mt-24">
        <RowScroller
          title="Episodes"
          gap="gap-4"
          action={
            tabs.length > 1 ? (
              <div className="v3-scroller -my-1 flex min-w-0 max-w-[60vw] gap-2 overflow-x-auto py-1" role="tablist" aria-label="Seasons">
                {tabs.map((t) => {
                  const on = t.season_number === season;
                  return (
                    <button
                      key={t.season_number}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setSeason(t.season_number)}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
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
            ) : undefined
          }
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video w-60 shrink-0 animate-pulse rounded-xl bg-white/[0.06] md:w-72" />
            ))
          ) : !episodes?.length ? (
            <p className="py-6 text-sm text-white/50">No episodes listed for this season yet.</p>
          ) : (
            episodes.map((ep) => {
              const isResume = resume?.s === season && resume?.e === ep.episode_number;
              const ok = aired(ep.air_date);
              const runtime = fmtMin(ep.runtime);
              const card = (
                <>
                  <div
                    className={`relative aspect-video overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.4)] transition duration-300 ${
                      ok ? 'group-hover/ep:ring-white/30' : 'opacity-50'
                    }`}
                  >
                    {ep.still_path ? (
                      <Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" fill sizes="288px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white/15">E{ep.episode_number}</span>
                    )}
                    {ok && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/ep:opacity-100">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black">
                          <Play className="ml-0.5 h-5 w-5 fill-black" />
                        </span>
                      </span>
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[12px] font-semibold text-white backdrop-blur">
                      E{ep.episode_number}
                    </span>
                    {isResume && ok && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-black">
                        <Play className="h-3 w-3 fill-black" /> Continue
                      </span>
                    )}
                    {ok && runtime && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                        {runtime}
                      </span>
                    )}
                    {!ok && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        <CalendarClock className="h-3 w-3" /> {fmtDate(ep.air_date)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 line-clamp-1 text-[15px] font-semibold text-white">{ep.name || `Episode ${ep.episode_number}`}</p>
                  {ep.overview && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/60">{ep.overview}</p>}
                </>
              );
              const cls = 'block w-60 shrink-0 md:w-72';
              return ok && season != null ? (
                <Link key={ep.episode_number} href={watchHref('tv', tvId, season, ep.episode_number)} className={`group/ep ${cls}`}>
                  {card}
                </Link>
              ) : (
                <div key={ep.episode_number} aria-disabled className={`${cls} cursor-not-allowed`}>
                  {card}
                </div>
              );
            })
          )}
        </RowScroller>
      </div>
    </>
  );
}
