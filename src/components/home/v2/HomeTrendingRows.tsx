'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Clock, MoreVertical, Play, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useContinueWatchingLocal, type ContinueWatchingItem } from '@/hooks/useContinueWatchingLocal';
import HorizontalScroll from './HorizontalScroll';
import { useDetailHref } from '@/hooks/useDetailHref';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import { useToast } from '@/components/ui/toast';
import {
  LIBRARY_KEYS,
  readContinueWatching,
  readWatchedHistory,
  writeContinueWatching,
  writeWatchedHistory,
  notifyLibraryStorageUpdated,
} from '@/utils/libraryStorage';

function ContinuePosterCard({
  item,
  onRemove,
  onMarkFinished,
  onSaveLater,
}: {
  item: ContinueWatchingItem;
  onRemove: () => void;
  onMarkFinished: () => void;
  onSaveLater: () => void;
}) {
  const { movieHref, tvHref } = useDetailHref();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = item.title || item.name || 'Untitled';
  const href = item.media_type === 'movie' ? movieHref(item.id, title) : tvHref(item.id, title);
  const imageSrc = item.poster_path
    ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}`
    : '/images/placeholder-poster.png';

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div className="relative flex-none w-[96px] sm:w-[120px] group/card">
      <Link href={href} className="block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2">
          <Image src={imageSrc} alt={title} fill className="object-cover" sizes="150px" />

          {/* play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 group-active/card:opacity-100 transition-opacity bg-black/40">
            <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* progress bar */}
          {item.progress != null && item.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-red-500" style={{ width: `${Math.min(item.progress, 100)}%` }} />
            </div>
          )}
        </div>
      </Link>

      {/* Three-dots menu */}
      <div className="absolute top-1 right-1 z-20" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-black/65 backdrop-blur-sm"
          aria-label="Options"
        >
          <MoreVertical className="w-3.5 h-3.5 text-white" />
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-1 w-[148px] rounded-xl border border-white/[0.10] bg-[#161616]/95 backdrop-blur-md shadow-2xl overflow-hidden z-30">
            <button
              onClick={(e) => { e.stopPropagation(); onMarkFinished(); setMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] font-medium text-left text-white/90 hover:bg-white/[0.07] transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Mark as finished
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSaveLater(); setMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] font-medium text-left text-white/90 hover:bg-white/[0.07] transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Save for later
            </button>
            <div className="h-px bg-white/[0.06] mx-2" />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); setMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] font-medium text-left text-red-400 hover:bg-white/[0.07] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              Remove
            </button>
          </div>
        )}
      </div>

      <p className="text-white text-xs font-medium line-clamp-2 leading-tight mb-0.5">{title}</p>
      {item.season != null && item.episode != null && (
        <p className="text-gray-500 text-[10px]">S{item.season} · E{item.episode}</p>
      )}
    </div>
  );
}

export default function HomeTrendingRows() {
  const items = useContinueWatchingLocal(12);
  const { showToast } = useToast();

  const handleRemove = (item: ContinueWatchingItem) => {
    const all = readContinueWatching();
    writeContinueWatching(all.filter((i) => !(i.id === item.id && i.media_type === item.media_type)));
    showToast('Removed', 'info');
  };

  const handleMarkFinished = (item: ContinueWatchingItem) => {
    const all = readContinueWatching();
    const history = readWatchedHistory();
    writeWatchedHistory([
      {
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        name: item.name,
        poster_path: item.poster_path,
        watchedAt: new Date().toISOString(),
      },
      ...history.filter((h) => !(h.id === item.id && h.media_type === item.media_type)),
    ]);
    writeContinueWatching(all.filter((i) => !(i.id === item.id && i.media_type === item.media_type)));
    showToast('Marked as finished', 'success');
  };

  const handleSaveLater = (item: ContinueWatchingItem) => {
    const all = readContinueWatching();
    writeContinueWatching(all.filter((i) => !(i.id === item.id && i.media_type === item.media_type)));
    try {
      const raw = localStorage.getItem(LIBRARY_KEYS.watchlist) || '[]';
      const watchlist: unknown[] = JSON.parse(raw);
      const exists = watchlist.some(
        (w: any) => String(w.id) === String(item.id) && w.media_type === item.media_type,
      );
      if (!exists) {
        const t = item.title || item.name || 'Untitled';
        watchlist.unshift({
          id: item.id,
          media_type: item.media_type,
          title: item.media_type === 'movie' ? t : undefined,
          name: item.media_type === 'tv' ? t : undefined,
          poster_path: item.poster_path ?? null,
          overview: '',
          vote_average: 0,
        });
        localStorage.setItem(LIBRARY_KEYS.watchlist, JSON.stringify(watchlist));
        notifyLibraryStorageUpdated(LIBRARY_KEYS.watchlist);
      }
    } catch {}
    showToast('Saved for later', 'success');
  };

  if (items.length === 0) return null;

  return (
    <div className="md:hidden px-4 sm:px-5 py-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-4 w-1 rounded-full shrink-0 bg-red-500" />
        <h2 className="text-sm font-semibold text-white">Continue Watching</h2>
      </div>
      <HorizontalScroll>
        {items.map((item) => (
          <ContinuePosterCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            onRemove={() => handleRemove(item)}
            onMarkFinished={() => handleMarkFinished(item)}
            onSaveLater={() => handleSaveLater(item)}
          />
        ))}
      </HorizontalScroll>
    </div>
  );
}
