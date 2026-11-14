'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Play, X } from 'lucide-react';
import { useContinueWatchingLocal } from '@/hooks/useContinueWatchingLocal';
import { useDetailHref } from '@/hooks/useDetailHref';
import { readContinueWatching, writeContinueWatching, type ContinueWatchingItem } from '@/utils/libraryStorage';
import RowScroller from './RowScroller';
import ContinuePreview, { type PreviewTarget } from './ContinuePreview';
import { loadPreview, savedPosition, timeLeft, usePreview } from '../preview';
import { useV3Scroll } from '../V3Shell';

const OPEN_DELAY_MS = 450;
const CLOSE_DELAY_MS = 140;

type Entry = ContinueWatchingItem & { season_number?: number; episode_number?: number };

function ContinueCard({
  it,
  editing,
  onRemove,
  onHoverStart,
  onHoverEnd,
}: {
  it: Entry;
  editing: boolean;
  onRemove: () => void;
  onHoverStart: (t: Omit<PreviewTarget, 'rect'>, el: HTMLElement) => void;
  onHoverEnd: () => void;
}) {
  const { movieHref, tvHref } = useDetailHref();
  const ref = useRef<HTMLDivElement>(null);
  const id = Number(it.id);
  const type = it.media_type;
  const title = it.title || it.name || 'Untitled';
  const href = type === 'movie' ? movieHref(id, title) : tvHref(id, title);
  // Older TV entries use season_number / episode_number.
  const season = it.season ?? it.season_number;
  const episode = it.episode ?? it.episode_number;
  const preview = usePreview(type, id);
  const [left, setLeft] = useState<{ pct: number; label: string } | null>(null);

  useEffect(() => {
    setLeft(timeLeft(preview?.runtime, savedPosition(type, id, season, episode)));
  }, [preview, type, id, season, episode]);

  const backdrop = it.backdrop_path || preview?.backdropPath || null;
  const img = backdrop
    ? `https://image.tmdb.org/t/p/w780${backdrop}`
    : it.poster_path
      ? `https://image.tmdb.org/t/p/w500${it.poster_path}`
      : null;
  const pct = left?.pct ?? Math.min(100, Math.max(0, it.progress ?? 0));
  const sub = [season != null && episode != null ? `S${season} · E${episode}` : null, left?.label].filter(Boolean).join(' · ');

  return (
    <div
      ref={ref}
      className="relative w-[250px] shrink-0 md:w-[300px] xl:w-[330px]"
      onMouseEnter={() =>
        ref.current &&
        onHoverStart(
          { id, type, title, href, season, episode, posterPath: it.poster_path, backdropPath: backdrop },
          ref.current,
        )
      }
      onMouseLeave={onHoverEnd}
    >
      <Link href={`${href}?play=1`} className="group/cw block">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 group-hover/cw:ring-white/25">
          {img && <Image src={img} alt={title} fill sizes="330px" className="object-cover" />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-focus-visible/cw:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
              <Play className="ml-0.5 h-5 w-5 fill-black" />
            </span>
          </div>
          {pct > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
              <div className="h-full bg-white" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <p className="mt-2.5 line-clamp-1 text-[15px] font-semibold text-white">{title}</p>
        {sub && <p className="text-xs text-white/55">{sub}</p>}
      </Link>
      {editing && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Continue Watching: wide cards with progress and time left; the pencil switches to remove mode.
 * On a mouse, resting on a card grows it into a preview (trailer, title art, Resume / More info).
 */
export default function ContinueRow() {
  const items = useContinueWatchingLocal(16) as Entry[];
  const scroll = useV3Scroll();
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState<PreviewTarget | null>(null);
  const [canHover, setCanHover] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const set = () => setCanHover(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const onHoverStart = useCallback(
    (t: Omit<PreviewTarget, 'rect'>, el: HTMLElement) => {
      if (!canHover || editing) return;
      clearTimers();
      loadPreview(t.type, t.id); // start fetching while the pointer rests
      openTimer.current = setTimeout(() => setTarget({ ...t, rect: el.getBoundingClientRect() }), OPEN_DELAY_MS);
    },
    [canHover, editing],
  );
  const closeSoon = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setTarget(null), CLOSE_DELAY_MS);
  }, []);
  const keepOpen = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // The preview sits at fixed coordinates: scrolling or resizing closes it.
  useEffect(() => {
    if (!target) return;
    const close = () => setTarget(null);
    const el = scroll?.current;
    el?.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      el?.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [target, scroll]);

  useEffect(() => () => clearTimers(), []);

  if (!items.length) return null;

  const remove = (it: ContinueWatchingItem) => {
    setTarget(null);
    writeContinueWatching(readContinueWatching().filter((x) => !(x.id === it.id && x.media_type === it.media_type)));
  };

  return (
    <>
      <RowScroller
        title="Continue Watching"
        href="/library"
        action={
          <button
            type="button"
            onClick={() => {
              setTarget(null);
              setEditing((v) => !v);
            }}
            aria-label={editing ? 'Done' : 'Edit'}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              editing ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      >
        {items.map((it) => (
          <ContinueCard
            key={`${it.media_type}-${it.id}`}
            it={it}
            editing={editing}
            onRemove={() => remove(it)}
            onHoverStart={onHoverStart}
            onHoverEnd={closeSoon}
          />
        ))}
      </RowScroller>
      {target && <ContinuePreview key={`${target.type}-${target.id}`} target={target} onEnter={keepOpen} onLeave={closeSoon} />}
    </>
  );
}
