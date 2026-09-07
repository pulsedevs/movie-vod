'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, BookmarkCheck } from 'lucide-react';
import { Movie, TVShow } from '@/types';
import { useDetailHref } from '@/hooks/useDetailHref';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

type TrendingItem = Movie | TVShow;

const CARD_HEIGHT = 'h-[200px] sm:h-[220px] xl:h-[280px]';

interface TrendingWideCardProps {
  item: TrendingItem;
  onAddWatchlist?: () => void;
  inWatchlist?: boolean;
  featured?: boolean;
}

export default function TrendingWideCard({
  item,
  onAddWatchlist,
  inWatchlist,
  featured = false,
}: TrendingWideCardProps) {
  const { movieHref, tvHref } = useDetailHref();
  const isMovie = item.media_type === 'movie';
  const title = isMovie ? item.title : item.name;
  const year = (isMovie ? item.release_date : item.first_air_date)?.slice(0, 4);
  const href = isMovie
    ? movieHref(item.id, title ?? 'movie')
    : tvHref(item.id, title ?? 'show');

  const imagePath = item.backdrop_path || item.poster_path;
  if (!imagePath) return null;

  const imageSrc = item.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${featured ? 'w1280' : 'w780'}${item.backdrop_path}`
    : `${TMDB_IMAGE_BASE_URL}w780${item.poster_path}`;

  return (
    <div
      className={`relative flex-none ${CARD_HEIGHT} rounded-2xl overflow-hidden group ${
        featured ? 'w-full sm:w-[520px] xl:w-[560px]' : 'w-full sm:w-[360px]'
      }`}
    >
      <Image
        src={imageSrc}
        alt={title ?? 'Title'}
        fill
        className="object-cover"
        sizes={featured ? '560px' : '360px'}
        priority={featured}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        {featured && (
          <span className="inline-block mb-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
            Featured
          </span>
        )}
        <h3
          className={`text-white font-bold line-clamp-2 mb-1 ${
            featured ? 'text-xl sm:text-2xl' : 'text-lg'
          }`}
        >
          {title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-300 mb-3">
          {year && <span>{year}</span>}
          {item.vote_average != null && (
            <span className="text-amber-400">★ {item.vote_average.toFixed(1)}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch now
          </Link>
          {onAddWatchlist && (
            <button
              type="button"
              onClick={onAddWatchlist}
              className={`p-2 rounded-lg transition-colors ${
                inWatchlist
                  ? 'bg-green-600/80 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              aria-label={inWatchlist ? 'In watchlist' : 'Add to watchlist'}
            >
              {inWatchlist ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
