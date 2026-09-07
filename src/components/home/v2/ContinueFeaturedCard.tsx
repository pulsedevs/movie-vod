'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { useDetailHref } from '@/hooks/useDetailHref';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import type { ContinueWatchingItem } from '@/hooks/useContinueWatchingLocal';
import type { NavTheme } from './navThemes';

interface ContinueFeaturedCardProps {
  item: ContinueWatchingItem;
  theme: NavTheme;
}

export default function ContinueFeaturedCard({ item, theme }: ContinueFeaturedCardProps) {
  const { movieHref, tvHref } = useDetailHref();
  const title = item.title || item.name || 'Untitled';
  const href =
    item.media_type === 'movie' ? movieHref(item.id, title) : tvHref(item.id, title);

  const imagePath = item.backdrop_path || item.poster_path;
  const imageSrc = imagePath
    ? `${TMDB_IMAGE_BASE_URL}w780${imagePath}`
    : '/images/placeholder-poster.png';

  const progress = item.progress != null ? Math.min(item.progress, 100) : 0;

  return (
    <Link
      href={href}
      className="block relative rounded-xl overflow-hidden group mb-3 shrink-0"
    >
      <div className="relative h-32 w-full bg-gray-800">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
          sizes="256px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: theme.iconActive }}
          >
            Continue watching
          </p>
          <p className="text-white text-sm font-bold line-clamp-1 mb-1">{title}</p>
          {item.season != null && item.episode != null && (
            <p className="text-gray-300 text-xs mb-2">
              S{item.season} · E{item.episode}
            </p>
          )}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-black text-xs font-bold rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.icon }}
          >
            <Play className="w-3 h-3 fill-current" />
            Resume
          </span>
        </div>
      </div>

      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full"
            style={{ width: `${progress}%`, backgroundColor: theme.icon }}
          />
        </div>
      )}
    </Link>
  );
}
