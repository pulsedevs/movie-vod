'use client';

import Link from 'next/link';
import type { MediaItem } from '@/types';
import { PROVIDERS } from '@/config/providers';
import RowScroller from './RowScroller';
import { PosterCard, PosterFrame, WideCard } from './Cards';

export function PosterRow({ title, items, href }: { title: string; items: MediaItem[]; href?: string }) {
  const list = items.filter((i) => i.poster_path);
  if (!list.length) return null;
  return (
    <RowScroller title={title} href={href}>
      {list.map((item, i) => (
        <PosterCard key={`${item.media_type}-${item.id}`} item={item} priority={i < 4} />
      ))}
    </RowScroller>
  );
}

export function WideRow({ title, items, href }: { title: string; items: MediaItem[]; href?: string }) {
  const list = items.filter((i) => i.backdrop_path);
  if (!list.length) return null;
  const sub = (i: MediaItem) => {
    const d = i.media_type === 'movie' ? i.release_date : i.first_air_date;
    // Fixed locale + UTC: the same text on the server and in the browser.
    return d
      ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      : undefined;
  };
  return (
    <RowScroller title={title} href={href}>
      {list.map((item) => (
        <WideCard key={`${item.media_type}-${item.id}`} item={item} subtitle={sub(item)} />
      ))}
    </RowScroller>
  );
}

/** Top 10: big hollow rank numbers, each poster tucked over the right edge of its number. */
export function Top10Row({ title, items }: { title: string; items: MediaItem[] }) {
  const list = items.filter((i) => i.poster_path).slice(0, 10);
  if (!list.length) return null;
  return (
    <RowScroller title={title} gap="gap-2 md:gap-4">
      {list.map((item, i) => (
        <div key={`${item.media_type}-${item.id}`} className="flex shrink-0 items-end">
          <span aria-hidden className="v3-rank -mr-2 md:-mr-3">
            {i + 1}
          </span>
          <div className="w-[132px] md:w-[196px]">
            <PosterFrame item={item} sizes="(max-width: 768px) 132px, 196px" />
          </div>
        </div>
      ))}
    </RowScroller>
  );
}

/** Streaming services as app-icon tiles, each opening its browse page. */
export function ProvidersRow() {
  return (
    <RowScroller title="Browse by service" gap="gap-4 md:gap-6">
      {PROVIDERS.map((p) => (
        <Link key={p.slug} href={`/browse/provider/${p.slug}`} className="group/p flex w-[92px] shrink-0 flex-col items-center gap-2 md:w-[112px]">
          <span
            className="flex aspect-square w-full items-center justify-center rounded-[22px] text-center text-[15px] font-extrabold tracking-tight text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition duration-300 group-hover/p:-translate-y-1 group-hover/p:scale-105"
            style={{ background: `linear-gradient(145deg, ${p.color}, ${p.bgColor.replace(/[\d.]+\)$/, '0.9)')})` }}
          >
            {p.name}
          </span>
          <span className="text-xs font-medium text-white/70">{p.name}</span>
        </Link>
      ))}
    </RowScroller>
  );
}

/** Continue Watching, from this browser's history. */
export { default as ContinueRow } from './ContinueRow';
