'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useDetailHref } from '@/hooks/useDetailHref';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

interface PersonalListItemProps {
  id: number | string;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  progress?: number;
  season?: number;
  episode?: number;
  subtitle?: string;
  showPlay?: boolean;
  accentColor?: string;
}

export default function PersonalListItem({
  id,
  mediaType,
  title,
  posterPath,
  progress,
  season,
  episode,
  subtitle,
  showPlay = true,
  accentColor = '#34d399',
}: PersonalListItemProps) {
  const { movieHref, tvHref } = useDetailHref();
  const href = mediaType === 'movie' ? movieHref(id, title) : tvHref(id, title);

  const poster = posterPath
    ? `${TMDB_IMAGE_BASE_URL}w154${posterPath}`
    : '/images/placeholder-poster.png';

  return (
    <Link
      href={href}
      style={{ '--item-accent': accentColor } as React.CSSProperties}
      className="flex items-center gap-3 rounded-xl p-2 -mx-1 hover:bg-white/[0.04] transition-all group border-l-2 border-transparent hover:[border-left-color:var(--item-accent)]"
    >
      <div className="relative w-12 h-[4.5rem] rounded-lg overflow-hidden shrink-0 bg-gray-800 shadow-md group-hover:shadow-lg transition-shadow">
        <Image src={poster} alt={title} fill className="object-cover" sizes="48px" />
        {showPlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium line-clamp-2 leading-snug group-hover:text-white/90 transition-colors">
          {title}
        </p>
        {season != null && episode != null && (
          <p className="text-gray-500 text-xs mt-0.5">
            S{season} · E{episode}
          </p>
        )}
        {subtitle && (
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1 capitalize">{subtitle}</p>
        )}
        {progress != null && progress > 0 && (
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: accentColor }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
