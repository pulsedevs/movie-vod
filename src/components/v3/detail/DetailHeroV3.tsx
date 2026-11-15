'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Clapperboard, Play, Plus, Star, Volume2, VolumeX } from 'lucide-react';
import type { MediaItem } from '@/types';
import { useHybridData } from '@/hooks/useHybridData';
import { AmbientFrom, ambientSrc } from '../ambient/AmbientContext';
import { useV3Scroll } from '../V3Shell';
import { useTrailersPref } from '../prefs';
import TrailerModal from './TrailerModal';
import BackdropTrailer, { preconnectYouTube } from './BackdropTrailer';

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
  /** Where Play goes: the player page (/watch/...). */
  playHref: string;
  /** Play button text, e.g. "Resume S2 E4". */
  playLabel?: string;
}

/** The overview, 3 lines with "Read more" when it is longer (like cinejoy's). */
function Overview({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setLong(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  return (
    <div className="max-w-[620px]">
      <p ref={ref} className={`text-sm leading-relaxed text-white/80 md:text-[15px] ${open ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {(long || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-1.5 text-sm font-semibold text-white/60 transition hover:text-white"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

const GLASS_BTN =
  'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20';

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
    playHref,
    playLabel = 'Play',
  } = props;
  const search = useSearchParams();
  const router = useRouter();
  const scroll = useV3Scroll();
  const [trailer, setTrailer] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();
  const saved = isInWatchlist(item.id, kind);
  const Heading = headingLevel;

  // Background trailer: desktop only, never under reduced motion or data saver, and only while
  // the hero is on screen, the tab is visible and the trailer modal is closed.
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

  // Connect to YouTube while the page is still loading (in the server HTML), so the trailer starts sooner.
  if (trailerKey && trailersOn) preconnectYouTube();
  const bgTrailer = !!trailerKey && trailersOn && canAutoplay;
  const bgActive = bgTrailer && !trailer && inView && tabVisible;

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

  // Old ?play=1 links (bookmarks, shared links): on to the player page.
  useEffect(() => {
    if (search?.get('play') === '1') router.replace(playHref);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full">
      <AmbientFrom image={ambientSrc(backdropPath)} />

      {backdropPath && (
        <div className="v3-hero-mask pointer-events-none absolute inset-y-0 right-0 h-[92vh] max-h-[960px] w-full md:w-[78%]">
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

      <div className="v3-gutter relative z-10 flex min-h-[min(86vh,960px)] flex-col justify-end pb-10 pt-28">
        {/* Bottom of the hero: the text column and the info box side by side, bottoms lined up. */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
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
            <Link
              href={playHref}
              className="flex h-11 items-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-black shadow-[0_8px_30px_rgba(255,255,255,0.18)] transition hover:scale-[1.03] hover:bg-white/90 active:scale-[0.98]"
            >
              <Play className="h-5 w-5 fill-black" /> {playLabel}
            </Link>
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

          {overview && <Overview text={overview} />}
        </div>

        {/* The info box's bottom lines up with the text column's (low, so it covers less of the
            picture); the overview's 3-line clamp keeps that column short enough for the box to stay in
            view. The network logo hangs just below it. */}
        <aside className="relative w-full shrink-0 md:w-[280px]">
          {info.length > 0 && (
            <dl className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04] text-xs backdrop-blur-sm">
              {info.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-4 px-4 py-2.5 ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
                >
                  <dt className="text-white/45">{row.label}</dt>
                  <dd className="text-right font-medium text-white/85">
                    {row.value}
                    {row.label === 'Runtime' && ends && <span className="text-white/45"> · Ends {ends}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {companies.some((c) => c.logo_path) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 md:absolute md:inset-x-0 md:top-full md:mt-3 md:flex-nowrap md:gap-x-5">
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
                    className="h-7 w-auto max-w-[120px] object-contain opacity-70 brightness-0 invert md:max-w-[80px]"
                  />
                ))}
            </div>
          )}
        </aside>
        </div>
      </div>

      {trailer && trailerKey && <TrailerModal youtubeKey={trailerKey} title={title} onClose={() => setTrailer(false)} />}
    </section>
  );
}
