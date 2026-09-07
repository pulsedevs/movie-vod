'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { ContinueWatchingItem } from '@/hooks/useContinueWatchingLocal';
import { useDetailHref } from '@/hooks/useDetailHref';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
}

export default function ContinueWatchingCard({ item }: ContinueWatchingCardProps) {
  const { movieHref, tvHref } = useDetailHref();
  const title = item.title || item.name || 'Untitled';
  const href =
    item.media_type === 'movie' ? movieHref(item.id, title) : tvHref(item.id, title);

  const imagePath = item.backdrop_path || item.poster_path;
  const imageSrc = imagePath
    ? `${TMDB_IMAGE_BASE_URL}w300${imagePath}`
    : '/images/placeholder-poster.png';

  return (
    <Link
      href={href}
      className="relative flex-none w-64 sm:w-72 h-40 rounded-xl overflow-hidden group block"
    >
      <Image src={imageSrc} alt={title} fill className="object-cover" sizes="288px" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-sm font-semibold line-clamp-1">{title}</p>
        {item.season != null && item.episode != null && (
          <p className="text-gray-400 text-xs mt-0.5">
            S{item.season} · E{item.episode}
          </p>
        )}
        {item.progress != null && item.progress > 0 && (
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${Math.min(item.progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
