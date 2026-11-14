'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Info, Play, Plus, Volume2, VolumeX } from 'lucide-react';
import type { MediaItem } from '@/types';
import { useHybridData } from '@/hooks/useHybridData';
import BackdropTrailer from '../detail/BackdropTrailer';
import { useTrailersPref } from '../prefs';
import { savedPosition, timeLeft, usePreview } from '../preview';

export interface PreviewTarget {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  href: string;
  season?: number;
  episode?: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  /** The card it grows out of (viewport coordinates). */
  rect: DOMRect;
}

const WIDTH_SCALE = 1.22;

/**
 * The card that grows out of a Continue Watching card on hover: the trailer playing silently
 * (same embed as the detail hero) over the backdrop, the title art, how much is left, and
 * Resume / More info / My List. Drawn in a portal at the card's position, so it can grow past
 * the row's edges; it closes when the pointer leaves it or the page scrolls.
 */
export default function ContinuePreview({
  target,
  onEnter,
  onLeave,
}: {
  target: PreviewTarget;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const preview = usePreview(target.type, target.id);
  const [trailersOn] = useTrailersPref();
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState<{ pct: number; label: string } | null>(null);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();
  const saved = isInWatchlist(target.id, target.type);

  useEffect(() => {
    setLeft(timeLeft(preview?.runtime, savedPosition(target.type, target.id, target.season, target.episode)));
  }, [preview, target]);

  // Position: centred on the card, wider, the video over the card, kept inside the window.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const w = Math.max(320, target.rect.width * WIDTH_SCALE);
  const videoH = (w * 9) / 16;
  const x = Math.min(Math.max(12, target.rect.left + target.rect.width / 2 - w / 2), vw - w - 12);
  const y = Math.max(72, target.rect.top + target.rect.height / 2 - videoH / 2);
  const backdrop = preview?.backdropPath ?? target.backdropPath;
  const subtitle = target.type === 'tv' && target.season != null && target.episode != null ? `S${target.season} · E${target.episode}` : null;

  const item = {
    id: target.id,
    media_type: target.type,
    title: target.type === 'movie' ? target.title : undefined,
    name: target.type === 'tv' ? target.title : undefined,
    poster_path: target.posterPath ?? null,
    backdrop_path: backdrop ?? null,
    overview: '',
    vote_average: 0,
  } as unknown as MediaItem;

  return createPortal(
    <motion.div
      role="dialog"
      aria-label={target.title}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
      style={{ position: 'fixed', left: x, top: y, width: w, zIndex: 60, transformOrigin: 'center 30%' }}
      className="v3-root overflow-hidden rounded-2xl border border-white/[0.1] bg-[#16181d]/95 text-white shadow-[0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {backdrop && (
          <Image src={`https://image.tmdb.org/t/p/w780${backdrop}`} alt="" fill sizes="420px" className="object-cover" />
        )}
        {trailersOn && preview?.trailerKey && (
          <BackdropTrailer youtubeKey={preview.trailerKey} active muted={muted} delayMs={350} onPlayingChange={setPlaying} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16181d] via-transparent to-transparent" />
        <div className="absolute inset-x-4 bottom-3">
          {preview?.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element -- logos vary wildly in aspect
            <img
              src={`https://image.tmdb.org/t/p/w500${preview.logoPath}`}
              alt={target.title}
              className="max-h-[64px] w-auto max-w-[75%] object-contain object-left drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
            />
          ) : (
            <p className="v3-display line-clamp-2 text-2xl font-extrabold leading-tight drop-shadow">{target.title}</p>
          )}
        </div>
        {playing && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md transition hover:bg-black/60"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        {(left || subtitle) && (
          <div className="mb-3 flex items-center gap-3">
            {left && (
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white" style={{ width: `${left.pct}%` }} />
              </div>
            )}
            <span className="shrink-0 text-xs font-medium text-white/60">
              {[subtitle, left?.label].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link
            href={`${target.href}?play=1`}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Play className="h-4 w-4 fill-black" /> Resume
          </Link>
          <Link
            href={target.href}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 py-2.5 text-sm font-semibold transition hover:bg-white/20"
          >
            <Info className="h-4 w-4" /> More Info
          </Link>
          <button
            type="button"
            onClick={() => (saved ? removeFromWatchlist(target.id, target.type) : addToWatchlist(item))}
            aria-label={saved ? 'Remove from My List' : 'Add to My List'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
          >
            {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
