'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Play, X } from 'lucide-react';
import { useContinueWatchingLocal } from '@/hooks/useContinueWatchingLocal';
import { useDetailHref } from '@/hooks/useDetailHref';
import { readContinueWatching, writeContinueWatching, type ContinueWatchingItem } from '@/utils/libraryStorage';
import RowScroller from './RowScroller';

/** Continue Watching: wide cards with a progress line; the pencil switches to remove mode. */
export default function ContinueRow() {
  const items = useContinueWatchingLocal(16);
  const { movieHref, tvHref } = useDetailHref();
  const [editing, setEditing] = useState(false);

  if (!items.length) return null;

  const remove = (it: ContinueWatchingItem) =>
    writeContinueWatching(readContinueWatching().filter((x) => !(x.id === it.id && x.media_type === it.media_type)));

  return (
    <RowScroller
      title="Continue Watching"
      href="/library"
      action={
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-label={editing ? 'Done' : 'Edit'}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
            editing ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      }
    >
      {items.map((it) => {
        const title = it.title || it.name || 'Untitled';
        const href = it.media_type === 'movie' ? movieHref(it.id, title) : tvHref(it.id, title);
        const img = it.backdrop_path
          ? `https://image.tmdb.org/t/p/w780${it.backdrop_path}`
          : it.poster_path
            ? `https://image.tmdb.org/t/p/w500${it.poster_path}`
            : null;
        const pct = Math.min(100, Math.max(0, it.progress ?? 0));
        const sub =
          it.season != null && it.episode != null
            ? `S${it.season} · E${it.episode}`
            : pct > 0
              ? `${Math.max(1, 100 - Math.round(pct))}% left`
              : '';
        return (
          <div key={`${it.media_type}-${it.id}`} className="relative w-[250px] shrink-0 md:w-[300px] xl:w-[330px]">
            <Link href={`${href}?play=1`} className="group/cw block">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 group-hover/cw:-translate-y-1 group-hover/cw:ring-white/25">
                {img && <Image src={img} alt={title} fill sizes="330px" className="object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/cw:opacity-100">
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
                onClick={() => remove(it)}
                aria-label={`Remove ${title}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </RowScroller>
  );
}
