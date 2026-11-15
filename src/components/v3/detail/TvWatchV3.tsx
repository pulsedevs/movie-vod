'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarArrowDown, CalendarArrowUp, CalendarClock, Check, Eye, Search, X } from 'lucide-react';
import type { Season } from '@/types';
import { readContinueWatching } from '@/utils/libraryStorage';
import DetailHeroV3 from './DetailHeroV3';
import { watchHref } from '../watch/links';
import { savedPosition, useWatched } from '../watch/watched';
import RowScroller from '../rows/RowScroller';
import SeasonPicker from './SeasonPicker';

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

/** Glass pill, like cinejoy's episode toolbar. */
const TOOL =
  'flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border text-sm backdrop-blur-md transition-colors';

/**
 * The TV detail page's interactive part: the hero, whose Play opens the player page on the
 * viewer's episode (an episode page's own episode, else where they left off, else the first one),
 * and the episodes section, like cinejoy's: the season as a dropdown title; search, oldest/newest and
 * "Mark watched" on the right; one sideways row of episode cards with an eye (watched) button and a
 * progress bar.
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
  const [query, setQuery] = useState('');
  const [newest, setNewest] = useState(false);
  const watched = useWatched(tvId);

  // Resume point (browser only), and its season as the open one unless the page chose one.
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
  const playLabel = pageEp ? `Play S${pageEp.s} E${pageEp.e}` : resume ? `Resume S${resume.s} E${resume.e}` : 'Play';

  const all = season != null ? data[season]?.episodes : undefined;
  const loading = season != null && !(season in data);

  // Search (name or episode number) and order.
  const q = query.trim().toLowerCase();
  const episodes = useMemo(() => {
    if (!all) return all;
    const hits = q
      ? all.filter((ep) => (ep.name ?? '').toLowerCase().includes(q) || String(ep.episode_number) === q.replace(/^e/, ''))
      : all;
    return newest ? [...hits].reverse() : hits;
  }, [all, q, newest]);

  // "Mark watched" covers the season's aired episodes.
  const airedEps = useMemo(
    () => (season != null ? (all ?? []).filter((ep) => aired(ep.air_date)).map((ep) => ({ s: season, e: ep.episode_number })) : []),
    [all, season],
  );
  const seasonWatched = airedEps.length > 0 && airedEps.every((x) => watched.has(x.s, x.e));

  const changeSeason = (s: number) => {
    setSeason(s);
    setQuery('');
  };

  const toolbar = (
    <div className="flex min-w-0 items-center gap-2">
      <label className="group hidden h-10 w-60 min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 pl-3.5 pr-1.5 text-white backdrop-blur-md transition-colors focus-within:border-white/30 hover:bg-white/[0.14] sm:flex">
        <Search className="h-4 w-4 shrink-0 text-white/55" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search episodes"
          aria-label="Search episodes"
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/45 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      <button
        type="button"
        onClick={() => setNewest((v) => !v)}
        aria-label={newest ? 'Newest first: show oldest first' : 'Oldest first: show newest first'}
        className={`${TOOL} hidden border-white/10 bg-white/10 px-4 text-white hover:bg-white/20 sm:flex`}
      >
        {newest ? <CalendarArrowUp className="h-4 w-4" /> : <CalendarArrowDown className="h-4 w-4" />}
        {newest ? 'Newest' : 'Oldest'}
      </button>
      {airedEps.length > 0 && (
        <button
          type="button"
          onClick={() => watched.setMany(airedEps, !seasonWatched)}
          aria-pressed={seasonWatched}
          aria-label={seasonWatched ? 'Mark season as unwatched' : 'Mark season as watched'}
          className={`${TOOL} w-10 justify-center sm:w-auto sm:px-4 ${
            seasonWatched ? 'border-white bg-white text-black' : 'border-white/10 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {seasonWatched ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="hidden sm:inline">{seasonWatched ? 'Watched' : 'Mark watched'}</span>
        </button>
      )}
    </div>
  );

  return (
    <>
      <DetailHeroV3 {...hero} playHref={playHref} playLabel={playLabel} />

      <div id="v3-episodes" className="scroll-mt-24">
        <RowScroller
          title={<SeasonPicker seasons={tabs} value={season} onChange={changeSeason} />}
          gap="gap-6"
          cascade
          action={toolbar}
          resetKey={`${season}|${q}|${newest ? 1 : 0}|${loading ? 1 : 0}`}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 md:w-80">
                <div className="aspect-video animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))
          ) : !all?.length ? (
            <p className="py-6 text-sm text-white/50">No episodes listed for this season yet.</p>
          ) : !episodes?.length ? (
            <p className="py-6 text-sm text-white/50">No episodes match &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            episodes.map((ep) => {
              const s = season!;
              const ok = aired(ep.air_date);
              const runtime = fmtMin(ep.runtime);
              const seen = ok && watched.has(s, ep.episode_number);
              // Progress: watched = full; else the player's saved position over the runtime.
              const pos = ok && !seen && ep.runtime ? savedPosition(tvId, s, ep.episode_number) : 0;
              const pct = seen ? 100 : pos > 0 && ep.runtime ? Math.min(100, (pos / (ep.runtime * 60)) * 100) : 0;
              const href = watchHref('tv', tvId, s, ep.episode_number);
              const name = ep.name || `Episode ${ep.episode_number}`;
              const BADGE =
                'absolute rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-md';
              const still = (
                <>
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                      alt=""
                      fill
                      sizes="320px"
                      className="object-cover transition duration-500 group-hover/ep:brightness-110"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white/15">E{ep.episode_number}</span>
                  )}
                  <span className={`${BADGE} left-2 top-2 font-semibold`}>E{ep.episode_number}</span>
                  {ok && runtime && <span className={`${BADGE} bottom-2 right-2 font-medium`}>{runtime}</span>}
                  {!ok && (
                    <span className={`${BADGE} bottom-2 left-2 flex items-center gap-1 font-medium`}>
                      <CalendarClock className="h-3 w-3" /> {fmtDate(ep.air_date)}
                    </span>
                  )}
                  {pct > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                      <span className="block h-full bg-white" style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </>
              );
              return (
                // Keyed by season + order too, so a new season / order remounts the cards and they cascade in.
                <div
                  key={`${s}-${newest ? 'n' : 'o'}-${ep.episode_number}`}
                  className={`group/ep flex w-72 shrink-0 flex-col gap-3 md:w-80 ${ok ? '' : 'opacity-50'}`}
                >
                  <div
                    className={`relative aspect-video overflow-hidden rounded-xl border border-white/5 bg-black/20 transition-all duration-300 ${
                      ok ? 'group-hover/ep:scale-105 group-hover/ep:ring-1 group-hover/ep:ring-white/50' : ''
                    }`}
                  >
                    {ok ? (
                      <Link href={href} aria-label={`Play E${ep.episode_number}: ${name}`} className="absolute inset-0 block">
                        {still}
                      </Link>
                    ) : (
                      still
                    )}
                    {ok && (
                      <button
                        type="button"
                        onClick={() => watched.toggle(s, ep.episode_number)}
                        aria-pressed={seen}
                        aria-label={seen ? 'Mark episode as unwatched' : 'Mark episode as watched'}
                        title={seen ? 'Mark as unwatched' : 'Mark as watched'}
                        className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
                          seen ? 'border-white bg-white text-black' : 'border-white/15 bg-black/45 text-white hover:bg-black/65'
                        }`}
                      >
                        {seen ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {ok ? (
                    <Link href={href} tabIndex={-1} aria-hidden className="block space-y-1 px-1">
                      <h3 className="line-clamp-1 text-base font-bold text-white transition-colors group-hover/ep:text-white/90">{name}</h3>
                      {ep.overview && <p className="line-clamp-2 text-xs leading-relaxed text-white/60">{ep.overview}</p>}
                    </Link>
                  ) : (
                    <div className="space-y-1 px-1">
                      <h3 className="line-clamp-1 text-base font-bold text-white">{name}</h3>
                      {ep.overview && <p className="line-clamp-2 text-xs leading-relaxed text-white/60">{ep.overview}</p>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </RowScroller>
      </div>
    </>
  );
}
