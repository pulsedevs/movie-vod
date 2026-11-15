'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { Season } from '@/types';

export const seasonLabel = (s?: Pick<Season, 'season_number' | 'name'> | null) =>
  !s ? '' : s.name?.trim() || (s.season_number === 0 ? 'Specials' : `Season ${s.season_number}`);

/**
 * The episodes section's title: the open season's name with a chevron; it opens a glass list of the
 * seasons (poster, name, episode count, a check on the open one). Like cinejoy's "Series 1 ⌄".
 */
export default function SeasonPicker({
  seasons,
  value,
  onChange,
}: {
  seasons: Season[];
  value: number | null;
  onChange: (season: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const current = seasons.find((s) => s.season_number === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    // Open on the current season.
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (seasons.length < 2) return <span>{seasonLabel(current) || 'Episodes'}</span>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group flex max-w-full items-center gap-1.5 text-white/95 transition-colors hover:text-white"
      >
        <span className="truncate">{seasonLabel(current)}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Seasons"
          className="v3-pop v3-cascade absolute left-0 top-full z-40 mt-3 max-h-80 w-[286px] overflow-y-auto rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.6)] p-1.5 text-base font-normal tracking-normal shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-[28px] backdrop-saturate-[1.8] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {seasons.map((s) => {
            const on = s.season_number === value;
            return (
              <button
                key={s.season_number}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange(s.season_number);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  on ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex h-13.5 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/[0.06]">
                  {s.poster_path && (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny thumbnails, straight from TMDB
                    <img src={`https://image.tmdb.org/t/p/w154${s.poster_path}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-white">{seasonLabel(s)}</span>
                  <span className="block text-[13px] text-white/50">
                    {s.episode_count} episode{s.episode_count === 1 ? '' : 's'}
                  </span>
                </span>
                {on && <Check className="h-4 w-4 shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
