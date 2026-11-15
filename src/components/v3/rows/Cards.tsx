'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import type { MediaItem } from '@/types';
import { useDetailHref } from '@/hooks/useDetailHref';
import { watchHref } from '../watch/links';

const titleOf = (i: MediaItem) => (i.media_type === 'movie' ? i.title : i.name) || 'Untitled';
const yearOf = (i: MediaItem) => ((i.media_type === 'movie' ? i.release_date : i.first_air_date) || '').slice(0, 4);

export const CARD =
  'relative block overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 ease-out';

/**
 * A portrait poster (2:3). On hover (or keyboard focus) it darkens and shows a white Play circle
 * (starts the title) with the title, year and rating; anywhere else on the card opens the details.
 * The two links are siblings, never nested.
 */
export function PosterFrame({
  item,
  priority = false,
  sizes,
  className = '',
}: {
  item: MediaItem;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const { mediaHref } = useDetailHref();
  const title = titleOf(item);
  const href = mediaHref(item);
  const year = yearOf(item);
  return (
    <div
      className={`${CARD} group/poster aspect-[2/3] hover:-translate-y-1 hover:scale-[1.035] hover:ring-white/25 hover:shadow-[0_18px_44px_rgba(0,0,0,0.6)] focus-within:ring-white/40 ${className}`}
    >
      {item.poster_path ? (
        <Image
          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
          alt={title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-sm text-white/60">{title}</span>
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/55 opacity-0 transition-opacity duration-300 group-hover/poster:opacity-100 group-focus-within/poster:opacity-100" />
      <Link href={href} title={title} aria-label={title} className="absolute inset-0 z-10" />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 px-3 text-center opacity-0 transition duration-300 group-hover/poster:opacity-100 group-focus-within/poster:opacity-100">
        <Link
          href={watchHref(item.media_type === 'movie' ? 'movie' : 'tv', item.id)}
          aria-label={`Play ${title}`}
          tabIndex={-1}
          className="pointer-events-auto flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition duration-300 hover:scale-110 group-hover/poster:scale-100"
        >
          <Play className="ml-0.5 h-6 w-6 fill-black" />
        </Link>
        <p className="line-clamp-2 text-[15px] font-bold leading-tight text-white drop-shadow">{title}</p>
        <p className="flex items-center gap-2 text-[13px] font-medium text-white/85">
          {year && <span>{year}</span>}
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {item.vote_average.toFixed(1)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/** Portrait poster card for the rows. */
export function PosterCard({ item, priority = false }: { item: MediaItem; priority?: boolean }) {
  return (
    <div className="w-[136px] shrink-0 md:w-[178px] xl:w-[196px]">
      <PosterFrame item={item} priority={priority} sizes="(max-width: 768px) 136px, 196px" />
    </div>
  );
}

/** Landscape card (16:9): backdrop with the title, for "new"/"upcoming" style rows. */
export function WideCard({ item, subtitle }: { item: MediaItem; subtitle?: string }) {
  const { mediaHref } = useDetailHref();
  const title = titleOf(item);
  return (
    <Link href={mediaHref(item)} className="group/wide w-[250px] shrink-0 md:w-[300px] xl:w-[330px]">
      <div
        className={`${CARD} aspect-video group-hover/wide:-translate-y-1 group-hover/wide:scale-[1.035] group-hover/wide:ring-white/25`}
      >
        {item.backdrop_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w780${item.backdrop_path}`}
            alt={title}
            fill
            sizes="330px"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <p className="line-clamp-1 text-[15px] font-semibold text-white">{title}</p>
          {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
        </div>
      </div>
    </Link>
  );
}
