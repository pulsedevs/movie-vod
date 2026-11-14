'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { CalendarClock, Play, SkipForward } from 'lucide-react';
import type { Season, StreamSource } from '@/types';
import LemurVodPlayer from '@/components/player/LemurVodPlayer';
import MoviePlayer from '@/components/player/MoviePlayer';
import { readContinueWatching, writeContinueWatching } from '@/utils/libraryStorage';
import DetailHeroV3 from './DetailHeroV3';

type HeroProps = Omit<
  React.ComponentProps<typeof DetailHeroV3>,
  'player' | 'playing' | 'onPlay' | 'onClosePlayer' | 'playLabel' | 'playerTitle' | 'playerActions'
>;

interface TvWatchV3Props {
  hero: HeroProps;
  tvId: number;
  showName: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasons: Season[];
  sources: StreamSource[];
  trailerId?: string;
  voteCount?: number;
  initialSourceIndex?: number;
  /** Episode pages: open the player on this episode. */
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
 * The TV detail page's interactive part: the hero (its Play resumes where the viewer left off, or
 * starts the first episode) whose player is the chosen episode, and the v3 episodes section -
 * season tabs + episode cards; picking one plays it in the hero. Episodes play from the LemurPlay
 * VOD backend; one the panel doesn't have falls back to the legacy external player.
 */
export default function TvWatchV3(props: TvWatchV3Props) {
  const { hero, tvId, showName, posterPath, backdropPath, seasons, sources, trailerId, voteCount } = props;

  const tabs = useMemo(() => {
    const real = seasons.filter((s) => s.season_number > 0 && s.episode_count > 0).sort((a, b) => a.season_number - b.season_number);
    const specials = seasons.filter((s) => s.season_number === 0 && s.episode_count > 0);
    return [...real, ...specials];
  }, [seasons]);

  const [season, setSeason] = useState<number | null>(props.initialSeasonNumber ?? tabs[0]?.season_number ?? null);
  const [data, setData] = useState<Record<number, SeasonEps | null>>(() =>
    props.initialSeasonData ? { [props.initialSeasonData.season]: props.initialSeasonData.data } : {},
  );
  const [current, setCurrent] = useState<Ep | null>(null);
  const [playing, setPlaying] = useState(false);
  const [resume, setResume] = useState<Ep | null>(null);
  const [missingKey, setMissingKey] = useState('');
  const [sourceIndex, setSourceIndex] = useState(props.initialSourceIndex ?? 0);

  // Resume point (browser only), and its season as the open tab unless the page chose one.
  useEffect(() => {
    const r = resumePoint(tvId);
    setResume(r);
    if (r && props.initialSeasonNumber == null && tabs.some((t) => t.season_number === r.s)) setSeason(r.s);
  }, [tvId, tabs, props.initialSeasonNumber]);

  // Episodes of the open season and of the playing one (its name, the next-episode button), cached.
  const playingSeason = current?.s;
  useEffect(() => {
    const want = [season, playingSeason].filter((s): s is number => s != null && !(s in data));
    if (!want.length) return;
    let alive = true;
    for (const s of new Set(want)) {
      fetch(`/api/tv/season?tvId=${tvId}&seasonNumber=${s}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((d: SeasonEps | null) => {
          if (alive) setData((prev) => (s in prev ? prev : { ...prev, [s]: d }));
        });
    }
    return () => {
      alive = false;
    };
  }, [season, playingSeason, tvId, data]);

  const start = useCallback(
    (ep: Ep) => {
      setCurrent(ep);
      setPlaying(true);
      setResume(ep);
      // Continue Watching: both field styles, so every row on the site reads it.
      const rest = readContinueWatching().filter((x) => !(Number(x.id) === tvId && x.media_type === 'tv'));
      writeContinueWatching([
        {
          id: tvId,
          media_type: 'tv',
          name: showName,
          title: showName,
          poster_path: posterPath,
          backdrop_path: backdropPath,
          season: ep.s,
          episode: ep.e,
          ...({ season_number: ep.s, episode_number: ep.e, last_watched: new Date().toISOString() } as object),
        },
        ...rest,
      ]);
    },
    [tvId, showName, posterPath, backdropPath],
  );

  // Episode pages start on their episode.
  useEffect(() => {
    if (props.initialSeasonNumber != null && props.initialEpisodeNumber != null) {
      start({ s: props.initialSeasonNumber, e: props.initialEpisodeNumber });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const firstEp = (): Ep | null => {
    const s = tabs[0]?.season_number;
    if (s == null) return null;
    const eps = data[s]?.episodes;
    return { s, e: eps?.length ? eps[0].episode_number : 1 };
  };
  const onPlay = () => {
    const ep = resume ?? firstEp();
    if (ep) start(ep);
  };

  // Next episode: the next one in this season, else episode 1 of the next season.
  const next = useMemo((): Ep | null => {
    if (!current) return null;
    const eps = data[current.s]?.episodes ?? [];
    const i = eps.findIndex((x) => x.episode_number === current.e);
    if (i >= 0 && i + 1 < eps.length && aired(eps[i + 1].air_date)) return { s: current.s, e: eps[i + 1].episode_number };
    const ti = tabs.findIndex((t) => t.season_number === current.s);
    const nt = tabs[ti + 1];
    return nt && nt.season_number > 0 && aired(nt.air_date) ? { s: nt.season_number, e: 1 } : null;
  }, [current, data, tabs]);

  const curEp = current ? data[current.s]?.episodes?.find((x) => x.episode_number === current.e) : undefined;
  const key = current ? `${tvId}:${current.s}:${current.e}` : '';
  const player = current ? (
    missingKey === key ? (
      <MoviePlayer
        sources={sources}
        mediaType="tv"
        mediaId={tvId}
        title={showName}
        seasonNumber={current.s}
        episodeNumber={current.e}
        selectedSourceIndex={sourceIndex}
        setSelectedSourceIndex={setSourceIndex}
        trailerId={trailerId}
        likeCount={voteCount}
        embedded
      />
    ) : (
      <div className="relative aspect-video w-full bg-black">
        <LemurVodPlayer
          key={key}
          tmdbId={tvId}
          season={current.s}
          episode={current.e}
          title={`${showName} · S${current.s}E${current.e}`}
          onMissing={() => setMissingKey(key)}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    )
  ) : null;

  const episodes = season != null ? data[season]?.episodes : undefined;
  const loading = season != null && !(season in data);

  return (
    <>
      <DetailHeroV3
        {...hero}
        player={player}
        playing={playing && !!current}
        onPlay={onPlay}
        onClosePlayer={() => setPlaying(false)}
        playLabel={resume ? `Resume S${resume.s} E${resume.e}` : 'Play S1 E1'}
        playerTitle={
          current ? `${showName} · S${current.s} E${current.e}${curEp?.name ? ` · ${curEp.name}` : ''}` : undefined
        }
        playerActions={
          next ? (
            <button
              type="button"
              onClick={() => start(next)}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <SkipForward className="h-4 w-4 fill-black" /> Next episode
            </button>
          ) : null
        }
      />

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
              const isOn = current?.s === season && current?.e === ep.episode_number && playing;
              const isResume = !isOn && resume?.s === season && resume?.e === ep.episode_number;
              const ok = aired(ep.air_date);
              return (
                <button
                  key={ep.episode_number}
                  type="button"
                  disabled={!ok}
                  onClick={() => season != null && start({ s: season, e: ep.episode_number })}
                  className="group/ep text-left disabled:cursor-not-allowed"
                >
                  <div
                    className={`relative aspect-video overflow-hidden rounded-xl bg-white/[0.05] ring-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 ${
                      isOn ? 'ring-2 ring-white' : 'ring-white/[0.08] group-hover/ep:-translate-y-1 group-hover/ep:ring-white/25'
                    } ${ok ? '' : 'opacity-50'}`}
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
                    {(isOn || isResume) && (
                      <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-black">
                        {isOn ? 'Now playing' : 'Continue'}
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
                </button>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
