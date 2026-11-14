'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clapperboard, Play, Plus, Star, Volume2, VolumeX, X } from 'lucide-react';
import type { MediaItem } from '@/types';
import { useHybridData } from '@/hooks/useHybridData';
import { AmbientFrom, ambientSrc } from '../ambient/AmbientContext';
import { useV3Scroll } from '../V3Shell';
import { useTrailersPref } from '../prefs';
import TrailerModal from './TrailerModal';
import BackdropTrailer from './BackdropTrailer';

export interface InfoRow {
  label: string;
  value: string;
}

interface DetailHeroV3Props {
  kind: 'movie' | 'tv';
  /** Minimal item for My List. */
  item: MediaItem;
  title: string;
  /** The page's <h1> unless an episode page owns it. */
  headingLevel?: 'h1' | 'h2';
  logoPath: string | null;
  backdropPath: string | null;
  genres: string[];
  /** Small facts under the buttons: year, runtime / seasons, ... */
  facts: string[];
  certification?: string | null;
  rating?: number;
  credits?: { label: string; names: string[] } | null;
  overview?: string;
  info: InfoRow[];
  /** Runtime in minutes: adds "Ends 9:41 PM" to the info card. */
  runtimeMin?: number | null;
  companies: Array<{ name: string; logo_path?: string | null }>;
  trailerKey?: string | null;
  /** The player that replaces the hero on Play. */
  player?: React.ReactNode;
  /** Controlled mode (TV: the page picks the episode): whether the player is showing ... */
  playing?: boolean;
  /** ... what Play does (pick an episode, then set playing) ... */
  onPlay?: () => void;
  /** ... and what closing the player does. */
  onClosePlayer?: () => void;
  /** Play button text, e.g. "Resume S2 E4". */
  playLabel?: string;
  /** Title over the player (default: the title). */
  playerTitle?: string;
  /** Extra controls next to the player's "Details" button (e.g. next episode). */
  playerActions?: React.ReactNode;
}

const GLASS_BTN =
  'flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20';

export default function DetailHeroV3(props: DetailHeroV3Props) {
  const {
    kind,
    item,
    title,
    headingLevel = 'h1',
    logoPath,
    backdropPath,
    genres,
    facts,
    certification,
    rating,
    credits,
    overview,
    info,
    runtimeMin,
    companies,
    trailerKey,
    player,
    playing: playingProp,
    onPlay,
    onClosePlayer,
    playLabel = 'Play',
    playerTitle,
    playerActions,
  } = props;
  const search = useSearchParams();
  const scroll = useV3Scroll();
  const [playingState, setPlayingState] = useState(false);
  const controlled = playingProp !== undefined;
  const playing = controlled ? playingProp : playingState;
  const [trailer, setTrailer] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();
  const saved = isInWatchlist(item.id, kind);
  const Heading = headingLevel;

  // Background trailer: desktop only, never under reduced motion or data saver, and only while
  // the hero is on screen, the tab is visible and nothing else is playing.
  const sectionRef = useRef<HTMLElement>(null);
  const [trailersOn] = useTrailersPref();
  const [canAutoplay, setCanAutoplay] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [bgPlaying, setBgPlaying] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 768px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const check = () => setCanAutoplay(wide.matches && !still.matches && !saveData);
    check();
    wide.addEventListener('change', check);
    still.addEventListener('change', check);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      wide.removeEventListener('change', check);
      still.removeEventListener('change', check);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio > 0.35), {
      root: scroll?.current ?? null,
      threshold: [0, 0.35, 0.6],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [scroll]);

  const bgTrailer = !!trailerKey && trailersOn && canAutoplay;
  const bgActive = bgTrailer && !playing && !trailer && inView && tabVisible;

  // The viewer's clock and timezone, so it is computed in the browser only (no hydration mismatch).
  const [ends, setEnds] = useState<string | null>(null);
  useEffect(() => {
    if (!runtimeMin) return;
    const tick = () =>
      setEnds(new Date(Date.now() + runtimeMin * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [runtimeMin]);

  const play = () => {
    if (onPlay) onPlay();
    else if (player) setPlayingState(true);
    scroll?.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closePlayer = () => (onClosePlayer ? onClosePlayer() : setPlayingState(false));

  // Whenever the player opens (Play, or an episode picked further down), bring it into view.
  useEffect(() => {
    if (playing) scroll?.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [playing, scroll]);

  // ?play=1 (hero / Continue Watching links): start right away.
  useEffect(() => {
    if (search?.get('play') === '1') {
      const id = setTimeout(play, 350);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full">
      <AmbientFrom image={ambientSrc(backdropPath)} />

      {backdropPath && (
        <div
          className={`v3-hero-mask pointer-events-none absolute inset-y-0 right-0 h-[92vh] max-h-[960px] w-full transition-opacity duration-700 md:w-[78%] ${
            playing ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <Image
            src={`https://image.tmdb.org/t/p/original${backdropPath}`}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 78vw"
            className="object-cover object-[center_20%]"
          />
          {bgTrailer && trailerKey && (
            <BackdropTrailer youtubeKey={trailerKey} active={bgActive} muted={muted} onPlayingChange={setBgPlaying} />
          )}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {playing && player ? (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            className="v3-gutter relative z-10 pb-8 pt-20 md:pt-24"
          >
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="truncate text-lg font-semibold text-white/90">{playerTitle ?? title}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {playerActions}
                  <button
                    type="button"
                    onClick={closePlayer}
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-xl transition hover:bg-white/20"
                  >
                    <X className="h-4 w-4" /> Details
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">{player}</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="v3-gutter relative z-10 flex min-h-[min(86vh,960px)] flex-col justify-end gap-8 pb-10 pt-28 md:flex-row md:items-end md:justify-between"
          >
            <div className="max-w-[680px]">
              {logoPath && logoOk ? (
                <>
                  <Heading className="sr-only">{title}</Heading>
                  {/* eslint-disable-next-line @next/next/no-img-element -- logos vary wildly in aspect */}
                  <img
                    src={`https://image.tmdb.org/t/p/w780${logoPath}`}
                    alt={title}
                    onError={() => setLogoOk(false)}
                    className="mb-4 max-h-[110px] w-auto max-w-[80%] object-contain object-left drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] md:max-h-[170px] md:max-w-[560px]"
                  />
                </>
              ) : (
                <Heading className="v3-display mb-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">{title}</Heading>
              )}

              {genres.length > 0 && (
                <p className="mb-5 flex flex-wrap items-center gap-x-2 text-[17px] font-semibold text-white/90">
                  {genres.map((g, i) => (
                    <span key={g} className="flex items-center gap-2">
                      {i > 0 && <span className="h-1 w-1 rounded-full bg-white/50" />}
                      {g}
                    </span>
                  ))}
                </p>
              )}

              <div className="mb-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={play}
                  className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-black shadow-[0_8px_30px_rgba(255,255,255,0.18)] transition hover:scale-[1.03] hover:bg-white/90 active:scale-[0.98]"
                >
                  <Play className="h-5 w-5 fill-black" /> {playLabel}
                </button>
                <button
                  type="button"
                  onClick={() => (saved ? removeFromWatchlist(item.id, kind) : addToWatchlist(item))}
                  aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                  className={GLASS_BTN}
                >
                  {saved ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
                {trailerKey && (
                  <button type="button" onClick={() => setTrailer(true)} aria-label="Watch trailer" className={GLASS_BTN}>
                    <Clapperboard className="h-5 w-5" />
                  </button>
                )}
                {bgPlaying && (
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
                    aria-pressed={!muted}
                    className={GLASS_BTN}
                  >
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                )}
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-medium text-white/90">
                {facts.map((f) => (
                  <span key={f}>{f}</span>
                ))}
                {certification && (
                  <span className="rounded-md border border-white/40 px-1.5 py-0.5 text-xs font-semibold leading-none">{certification}</span>
                )}
                {rating != null && rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
                  </span>
                )}
              </div>

              {credits && credits.names.length > 0 && (
                <p className="mb-3 text-[15px] text-white/60">
                  {credits.label}: <span className="text-white/90">{credits.names.join(', ')}</span>
                </p>
              )}

              {overview && <p className="max-w-[620px] text-base leading-relaxed text-white/80 md:text-[17px]">{overview}</p>}
            </div>

            <aside className="w-full shrink-0 md:w-[300px]">
              {info.length > 0 && (
                <dl className="overflow-hidden rounded-xl border border-white/[0.09] bg-black/25 text-sm backdrop-blur-xl">
                  {info.map((row, i) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between gap-4 px-4 py-3 ${i > 0 ? 'border-t border-white/[0.07]' : ''}`}
                    >
                      <dt className="text-white/50">{row.label}</dt>
                      <dd className="text-right font-medium text-white/90">
                        {row.value}
                        {row.label === 'Runtime' && ends && <span className="text-white/45"> · Ends {ends}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {companies.some((c) => c.logo_path) && (
                <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-4">
                  {companies
                    .filter((c) => c.logo_path)
                    .slice(0, 3)
                    .map((c) => (
                      // eslint-disable-next-line @next/next/no-img-element -- small monochrome logos
                      <img
                        key={c.name}
                        src={`https://image.tmdb.org/t/p/w185${c.logo_path}`}
                        alt={c.name}
                        title={c.name}
                        className="h-7 w-auto max-w-[120px] object-contain opacity-70 brightness-0 invert"
                      />
                    ))}
                </div>
              )}
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      {trailer && trailerKey && <TrailerModal youtubeKey={trailerKey} title={title} onClose={() => setTrailer(false)} />}
    </section>
  );
}
