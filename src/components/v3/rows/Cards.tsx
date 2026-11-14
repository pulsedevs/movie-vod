'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MediaItem } from '@/types';
import { useDetailHref } from '@/hooks/useDetailHref';

const titleOf = (i: MediaItem) => (i.media_type === 'movie' ? i.title : i.name) || 'Untitled';

const CARD =
  'relative block overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.035] hover:ring-white/25 hover:shadow-[0_18px_44px_rgba(0,0,0,0.6)]';

/** Portrait poster (2:3). */
export function PosterCard({ item, priority = false }: { item: MediaItem; priority?: boolean }) {
  const { mediaHref } = useDetailHref();
  const title = titleOf(item);
  return (
    <Link href={mediaHref(item)} title={title} className="w-[136px] shrink-0 md:w-[178px] xl:w-[196px]">
      <div className={`${CARD} aspect-[2/3]`}>
        {item.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 136px, 196px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-sm text-white/60">{title}</span>
        )}
      </div>
    </Link>
  );
}

/** Landscape card (16:9): backdrop with the title, for "new"/"upcoming" style rows. */
export function WideCard({ item, subtitle }: { item: MediaItem; subtitle?: string }) {
  const { mediaHref } = useDetailHref();
  const title = titleOf(item);
  return (
    <Link href={mediaHref(item)} className="w-[250px] shrink-0 md:w-[300px] xl:w-[330px]">
      <div className={`${CARD} aspect-video`}>
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
