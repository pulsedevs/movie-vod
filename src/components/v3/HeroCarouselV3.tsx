'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Check, Info, Play, Plus, Star } from 'lucide-react';
import type { MediaItem } from '@/types';
import { useHybridData } from '@/hooks/useHybridData';
import { useDetailHref } from '@/hooks/useDetailHref';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { ambientSrc, useAmbient } from './ambient/AmbientContext';
import { genreIcon, genreName } from './genres';

const SLIDE_MS = 8000;

const titleOf = (i: MediaItem) => (i.media_type === 'movie' ? i.title : i.name) || 'Untitled';
const yearOf = (i: MediaItem) =>
  ((i.media_type === 'movie' ? i.release_date : i.first_air_date) || '').slice(0, 4);

interface HeroCarouselV3Props {
  mediaType?: 'movie' | 'tv';
  /** Browse pages use a shorter hero with the page title under it. */
  short?: boolean;
}

/**
 * Full-bleed featured carousel. The backdrop fades (mask) into the moving background, and each
 * slide hands its colours to that background. Title art = TMDB logo, falling back to the title.
 */
export default function HeroCarouselV3({ mediaType = 'movie', short = false }: HeroCarouselV3Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [badLogos, setBadLogos] = useState<Set<number>>(new Set());
  const { setFromImage } = useAmbient();
  const { mediaHref } = useDetailHref();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();

  useEffect(() => {
    let alive = true;
    fetchWithRetry<MediaItem[]>(
      `/api/trending?timeWindow=day&mediaType=${mediaType}&withLogos=true&limit=8`,
      `v3-hero-${mediaType}`,
      3,
    )
      .then((data) => {
        if (alive) setItems((data || []).filter((i) => i.backdrop_path && i.overview).slice(0, 8));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mediaType]);

  const go = useCallback((i: number) => setIndex(((i % items.length) + items.length) % items.length), [items.length]);

  // Auto-advance; held while hovered or while the tab is hidden.
  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setTimeout(() => {
      if (!document.hidden) go(index + 1);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused, items.length, go]);

  const item = items[index];
  useEffect(() => {
    if (item) setFromImage(ambientSrc(item.backdrop_path));
  }, [item, setFromImage]);

  // Warm the next backdrop so the crossfade never shows an empty frame.
  useEffect(() => {
    const next = items[(index + 1) % Math.max(1, items.length)];
    if (next?.backdrop_path) {
      const img = new window.Image();
      img.src = `https://image.tmdb.org/t/p/w1280${next.backdrop_path}`;
    }
  }, [index, items]);

  const height = short ? 'h-[62vh] min-h-[440px] max-h-[720px]' : 'h-[86vh] min-h-[560px] max-h-[940px]';

  if (!item) {
    return <section className={`relative w-full ${height}`} aria-busy="true" />;
  }

  const type = item.media_type as 'movie' | 'tv';
  const saved = isInWatchlist(item.id, type);
  const href = mediaHref(item);
  const gid = item.genre_ids?.[0];
  const GenreIcon = genreIcon(gid, type);
  const genre = genreName(gid);
  const year = yearOf(item);
  const title = titleOf(item);

  return (
    <section
      className={`relative w-full overflow-hidden ${height}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={item.id}
          className="v3-hero-mask absolute inset-y-0 right-0 w-full md:w-[82%]"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <Image
            src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
            alt=""
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 82vw"
            className="object-cover object-[center_25%]"
          />
        </motion.div>
      </AnimatePresence>

      <div className={`v3-gutter absolute inset-x-0 ${short ? 'bottom-[22%]' : 'bottom-[18%]'} z-10`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            className="max-w-[640px]"
          >
            {item.logo_path && !badLogos.has(item.id) ? (
              // eslint-disable-next-line @next/next/no-img-element -- logos vary wildly in aspect; a plain img sizes them best
              <img
                src={`https://image.tmdb.org/t/p/w780${item.logo_path}`}
                alt={title}
                className="mb-5 max-h-[90px] w-auto max-w-[78%] object-contain object-left drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] md:max-h-[150px] md:max-w-[520px]"
                onError={() => setBadLogos((s) => new Set(s).add(item.id))}
              />
            ) : (
              <h2 className="v3-display mb-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">{title}</h2>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-white/95">
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-white" /> {item.vote_average.toFixed(1)}
                </span>
              )}
              {year && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" /> {year}
                  </span>
                </>
              )}
              {genre && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="flex items-center gap-1.5">
                    <GenreIcon className="h-4 w-4" /> {genre}
                  </span>
                </>
              )}
            </div>

            {!short && (
              <p className="mb-7 line-clamp-3 max-w-[560px] text-base leading-relaxed text-white/85 md:text-lg">
                {item.overview}
              </p>
            )}

            <div className={`flex items-center gap-3 ${short ? 'mt-5' : ''}`}>
              <Link
                href={`${href}?play=1`}
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-black shadow-[0_8px_30px_rgba(255,255,255,0.18)] transition hover:scale-[1.03] hover:bg-white/90 active:scale-[0.98]"
              >
                <Play className="h-5 w-5 fill-black" /> Play
              </Link>
              <div className="flex items-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => (saved ? removeFromWatchlist(item.id, type) : addToWatchlist(item))}
                  aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                  className="flex h-12 w-14 items-center justify-center rounded-l-full transition hover:bg-white/10"
                >
                  {saved ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
                <span className="h-6 w-px bg-white/20" />
                <Link
                  href={href}
                  aria-label="More info"
                  className="flex h-12 w-14 items-center justify-center rounded-r-full transition hover:bg-white/10"
                >
                  <Info className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div
          className={`v3-gutter absolute right-0 z-10 hidden items-center gap-2 md:flex ${short ? 'bottom-[24%]' : 'bottom-[24%]'} ${
            paused ? 'v3-dot-paused' : ''
          }`}
          style={{ ['--v3-slide-ms' as string]: `${SLIDE_MS}ms` }}
        >
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${titleOf(it)}`}
              aria-current={i === index}
              className={`relative h-2 overflow-hidden rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-white/30' : 'w-2 bg-white/45 hover:bg-white/70'
              }`}
            >
              {i === index && <span key={`${it.id}-${index}`} className="v3-dot-fill absolute inset-0 rounded-full bg-white" />}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
