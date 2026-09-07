'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, BookmarkCheck } from 'lucide-react';
import { Movie, TVShow } from '@/types';
import { useDetailHref } from '@/hooks/useDetailHref';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

type RatedItem = Movie | TVShow;

interface TopRatedCardProps {
  item: RatedItem;
  onAddWatchlist?: () => void;
  inWatchlist?: boolean;
  compact?: boolean;
}

export default function TopRatedCard({
  item,
  onAddWatchlist,
  inWatchlist,
  compact = false,
}: TopRatedCardProps) {
  const { movieHref, tvHref } = useDetailHref();
  const isMovie = item.media_type === 'movie';
  const title = isMovie ? item.title : item.name;
  const year = (isMovie ? item.release_date : item.first_air_date)?.slice(0, 4);
  const href = isMovie
    ? movieHref(item.id, title ?? 'movie')
    : tvHref(item.id, title ?? 'show');

  const poster = item.poster_path
    ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}`
    : '/images/placeholder-poster.png';

  if (compact) {
    return (
      <div className="relative flex-none w-[120px] sm:w-[130px] h-full flex flex-col">
        <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-800 mb-1.5">
          <Image src={poster} alt={title ?? 'Poster'} fill className="object-cover" sizes="130px" />
          {item.vote_average != null && (
            <span className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-black/70 text-amber-400 text-[10px] font-bold">
              ★ {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-white text-xs font-medium line-clamp-1 leading-tight">{title}</p>
        {year && <p className="text-gray-500 text-[10px] mb-1.5">{year}</p>}
        <div className="flex gap-1">
          <Link
            href={href}
            className="flex-1 inline-flex items-center justify-center gap-0.5 px-1.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-semibold rounded-md transition-colors"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            Watch
          </Link>
          {onAddWatchlist && (
            <button
              type="button"
              onClick={onAddWatchlist}
              className={`p-1 rounded-md transition-colors ${
                inWatchlist
                  ? 'bg-green-600/80 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              aria-label={inWatchlist ? 'In watchlist' : 'Add to watchlist'}
            >
              {inWatchlist ? (
                <BookmarkCheck className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-none w-[140px] sm:w-[160px]">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2">
        <Image src={poster} alt={title ?? 'Poster'} fill className="object-cover" sizes="160px" />
        {item.vote_average != null && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-amber-400 text-xs font-bold">
            ★ {item.vote_average.toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-white text-sm font-medium line-clamp-2 leading-tight mb-0.5">{title}</p>
      {year && <p className="text-gray-500 text-xs mb-2">{year}</p>}
      <div className="flex gap-1.5">
        <Link
          href={href}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
          Watch
        </Link>
        {onAddWatchlist && (
          <button
            type="button"
            onClick={onAddWatchlist}
            className={`p-1.5 rounded-lg transition-colors ${
              inWatchlist
                ? 'bg-green-600/80 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            aria-label={inWatchlist ? 'In watchlist' : 'Add to watchlist'}
          >
            {inWatchlist ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
