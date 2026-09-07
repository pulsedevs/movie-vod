'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { MediaItem, Movie, TVShow } from '@/types';
import { useHybridData } from '@/hooks/useHybridData';
import HorizontalScroll from './HorizontalScroll';
import MediaCard from '@/components/media/MediaCard';

type RowItem = Movie | TVShow;

interface HomeRowProps {
  title: string;
  /** Accent bar colour — pass a navThemes[...].icon value. */
  accent: string;
  movieItems: RowItem[];
  tvItems: RowItem[];
}

/** A single V2 content row: accent header + movie/TV toggle + horizontal poster scroll. */
export default function HomeRow({ title, accent, movieItems, tvItems }: HomeRowProps) {
  const [tab, setTab] = useState<'movie' | 'tv'>('movie');
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();

  const items = (tab === 'movie' ? movieItems : tvItems).filter((i) => i.poster_path);
  if (movieItems.length === 0 && tvItems.length === 0) return null;

  const toggleWatchlist = (item: RowItem) => {
    const type = item.media_type as 'movie' | 'tv';
    if (isInWatchlist(item.id, type)) {
      removeFromWatchlist(item.id, type);
    } else {
      addToWatchlist(item as MediaItem);
    }
  };

  return (
    <section className="px-4 sm:px-5 py-3">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-5 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <h2 className="text-base font-semibold leading-none text-white sm:text-lg">{title}</h2>

        {/* Movie / TV toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
          {(['movie', 'tv'] as const).map((value) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:text-[11px]"
                style={
                  active
                    ? { backgroundColor: accent, color: '#0a0a0a' }
                    : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                {value === 'movie' ? 'Movies' : 'TV'}
              </button>
            );
          })}
        </div>
      </div>

      {items.length > 0 ? (
        <HorizontalScroll>
          {items.map((item) => {
            const saved = isInWatchlist(item.id, item.media_type as 'movie' | 'tv');
            return (
              <div key={`${item.media_type}-${item.id}`} className="relative flex-none w-[108px] sm:w-[118px]">
                <MediaCard item={item} compact alwaysDense />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWatchlist(item);
                  }}
                  className="absolute top-1 left-1 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm transition-colors hover:bg-black/90"
                  aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {saved ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              </div>
            );
          })}
        </HorizontalScroll>
      ) : (
        <p className="text-xs text-white/40">Nothing here yet.</p>
      )}
    </section>
  );
}
