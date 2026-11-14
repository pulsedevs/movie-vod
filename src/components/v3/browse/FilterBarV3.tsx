'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Check, ChevronDown, X } from 'lucide-react';
import type { Genre } from '@/types';
import { useFilters } from '@/components/browse/FilterContext';
import type { BrowseMediaType } from '@/lib/browse/loadBrowsePage';
import {
  genreTriggerLabel,
  ratingOptions,
  sortOptions,
  voteCountOptions,
  votesTriggerLabel,
  yearOptions,
} from '@/components/home/v2/browse/BrowseV2FilterBar';
import { useV3Scroll } from '../V3Shell';

type Id = 'genres' | 'year' | 'sort' | 'rating' | 'votes';
type Option = { value: string; label: string };

interface PillDef {
  id: Id;
  label: string;
  /** Shows the dot before the label. */
  hasValue: boolean;
  options: Option[];
  isSelected: (value: string) => boolean;
  pick: (value: string) => void;
  /** Genres: several can be ticked, so the menu stays open. */
  multi?: boolean;
  /** The last pills open their menu leftwards so it stays on screen. */
  alignRight?: boolean;
}

const PILL =
  'flex h-[38px] w-full min-w-0 items-center justify-between gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 text-[15px] text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.13] md:min-w-[140px] md:px-4';

const DOCK_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** One row of filter pills with their menus (used twice: in the page, and docked at the bottom). */
function Pills({ defs, up, onClear }: { defs: PillDef[]; up?: boolean; onClear?: () => void }) {
  const [openId, setOpenId] = useState<Id | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  return (
    <div ref={ref} className="contents">
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear filters"
          className="group flex h-[38px] max-w-[38px] shrink-0 items-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-white transition-[max-width,background-color] duration-300 ease-out hover:max-w-[120px] hover:bg-white/10"
        >
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center">
            <X className="h-4 w-4" />
          </span>
          <span className="whitespace-nowrap pr-4 text-sm">Clear</span>
        </button>
      )}
      {defs.map((d) => {
        const open = openId === d.id;
        return (
          <div key={d.id} className={`relative min-w-0 md:flex-none ${open ? 'z-50' : ''}`}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : d.id)}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={PILL}
            >
              <span className="flex min-w-0 items-center gap-2">
                {d.hasValue && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
                <span className="truncate">{d.label}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div
                role="listbox"
                aria-multiselectable={d.multi || undefined}
                // Docked, the menu sits inside the bar's own backdrop blur, where a second blur has
                // nothing to work on: it needs a near-solid background to stay readable.
                className={`absolute z-50 max-h-[302px] w-full min-w-[180px] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-[28px] backdrop-saturate-[1.8] [scrollbar-width:thin] ${
                  up ? 'bottom-full mb-2 bg-[rgba(18,18,20,0.94)]' : 'top-full mt-2 bg-[rgba(20,20,20,0.6)]'
                } ${d.alignRight ? 'right-0' : 'left-0'}`}
              >
                {d.options.map((o) => {
                  const selected = d.isSelected(o.value);
                  return (
                    <button
                      key={o.value || 'all'}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        d.pick(o.value);
                        if (!d.multi) setOpenId(null);
                      }}
                      className={`flex h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
                        selected ? 'bg-white/[0.12] text-white' : 'text-white/75 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{o.label}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * v3 browse filters: compact pills on the right under the page title. Once they scroll off the
 * top, a copy slides up docked at the bottom centre (desktop), with a back-to-top button.
 */
export default function FilterBarV3({ mediaType, genres }: { mediaType: BrowseMediaType; genres: Genre[] }) {
  const { filters, setFilters, clearFilters } = useFilters();
  const scroll = useV3Scroll();
  const inlineRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Docked = the in-page pills have gone above the top of the scroll area.
  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setDocked(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)),
      { root: scroll?.current ?? null },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scroll]);

  const sorts: Option[] = [...sortOptions[mediaType]];
  const sortBy = filters.sortBy || 'popularity.desc';
  const rating = filters.minRating && filters.minRating !== '0' ? filters.minRating : '';
  const votes = filters.minVoteCount && filters.minVoteCount !== 'auto' ? filters.minVoteCount : '';

  const defs: PillDef[] = [
    {
      id: 'genres',
      label: genreTriggerLabel(genres, filters.genres),
      hasValue: filters.genres.length > 0,
      options: [{ value: '', label: 'All Genres' }, ...genres.map((g) => ({ value: String(g.id), label: g.name }))],
      isSelected: (v) => (v === '' ? filters.genres.length === 0 : filters.genres.includes(v)),
      pick: (v) =>
        setFilters({
          genres: v === '' ? [] : filters.genres.includes(v) ? filters.genres.filter((g) => g !== v) : [...filters.genres, v],
        }),
      multi: true,
    },
    {
      id: 'year',
      label: filters.year || 'Year',
      hasValue: !!filters.year,
      options: yearOptions.map((o) => (o.value === '' ? { value: '', label: 'All Years' } : o)),
      isSelected: (v) => v === (filters.year || ''),
      pick: (v) => setFilters({ year: v || undefined }),
    },
    {
      id: 'sort',
      label: sorts.find((o) => o.value === sortBy)?.label ?? 'Sort',
      hasValue: true,
      options: sorts,
      isSelected: (v) => v === sortBy,
      pick: (v) => setFilters({ sortBy: v }),
    },
    {
      id: 'rating',
      label: rating ? `${ratingOptions.find((o) => o.value === rating)?.label ?? rating} rating` : 'Rating',
      hasValue: !!rating,
      options: ratingOptions.map((o) => (o.value === '0' ? { value: '0', label: 'Any rating' } : { ...o, label: `${o.label} ★` })),
      isSelected: (v) => v === (rating || '0'),
      pick: (v) => setFilters({ minRating: v }),
      alignRight: true,
    },
    {
      id: 'votes',
      label: votes ? `${votesTriggerLabel(votes)} votes` : 'Votes',
      hasValue: !!votes,
      options: voteCountOptions.map((o) => (o.value === '0' ? { value: '0', label: 'Any votes' } : { ...o, label: `${o.label} votes` })),
      isSelected: (v) => v === votes,
      pick: (v) => setFilters({ minVoteCount: v || 'auto' }),
      alignRight: true,
    },
  ];

  const active =
    filters.genres.length > 0 || !!filters.year || sortBy !== 'popularity.desc' || !!rating || !!votes;
  const onClear = active ? clearFilters : undefined;

  return (
    <>
      <div ref={inlineRef} className="relative z-30 mb-6 flex flex-wrap items-center justify-end gap-2 md:gap-3">
        <Pills defs={defs} onClear={onClear} />
      </div>

      {mounted &&
        createPortal(
          <div className="v3-root">
            <div
              aria-hidden={!docked}
              className={`fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 lg:block ${docked ? 'visible translate-y-0' : 'invisible translate-y-[calc(100%+24px)]'}`}
              style={{
                transition: `translate 260ms ${DOCK_EASE}, visibility 0s linear ${docked ? '0s' : '260ms'}`,
              }}
            >
              <div className="flex items-center gap-3 rounded-full border border-white/[0.07] bg-[rgba(16,16,18,0.72)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-[14px] backdrop-saturate-[1.4]">
                {/* Remounted on each dock / undock, so a menu left open never reappears. */}
                <Pills key={docked ? 'docked' : 'hidden'} defs={defs} up onClear={onClear} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => scroll?.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Back to top"
              tabIndex={docked ? 0 : -1}
              className={`fixed bottom-[84px] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md transition duration-300 hover:bg-white/20 md:bottom-8 md:right-8 ${
                docked ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'
              }`}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
