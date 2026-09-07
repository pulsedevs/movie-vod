'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Check, CheckCircle2, Clock, Film, Trash2, Tv } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useLibraryPageData, type LibraryV2Tab } from '@/hooks/useLibraryPageData';
import type { MediaItem } from '@/types';
import type { ContinueWatchingItem, WatchedHistoryItem } from '@/utils/libraryStorage';
import { BROWSE_V2_GRID_CLASS } from '../browse/browseV2Grid';
import { navThemes, type NavTheme } from '../navThemes';
import { toV2Href } from '@/utils/v2Shell';

type SavedFilter = 'all' | 'movie' | 'tv';

const tabConfig: {
  id: LibraryV2Tab;
  label: string;
  icon: typeof Clock;
  theme: NavTheme;
}[] = [
  { id: 'continue', label: 'Continue', icon: Clock, theme: navThemes.home },
  { id: 'saved', label: 'Saved', icon: Bookmark, theme: navThemes.library },
  { id: 'recent', label: 'Completed', icon: CheckCircle2, theme: navThemes.parties },
];

function watchedToMediaItem(item: WatchedHistoryItem): MediaItem {
  const id = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10) || 0;
  const title = item.title || item.name || 'Untitled';
  if (item.media_type === 'movie') {
    return { id, media_type: 'movie', title, poster_path: item.poster_path ?? null, overview: '', vote_average: 0, release_date: '' };
  }
  return { id, media_type: 'tv', name: title, poster_path: item.poster_path ?? null, overview: '', vote_average: 0, first_air_date: '' };
}

function continueToMediaItem(item: ContinueWatchingItem): MediaItem {
  const id = typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10) || 0;
  const poster = item.poster_path ?? null;
  const title = item.title || item.name || 'Untitled';

  if (item.media_type === 'movie') {
    return {
      id,
      media_type: 'movie',
      title,
      poster_path: poster,
      overview: '',
      vote_average: 0,
      release_date: '',
    };
  }

  return {
    id,
    media_type: 'tv',
    name: title,
    poster_path: poster,
    overview: '',
    vote_average: 0,
    first_air_date: '',
  };
}

function LibraryV2Loading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
    </div>
  );
}

function LibraryEmpty({
  icon: Icon,
  message,
  cta,
  href,
  theme,
}: {
  icon: typeof Clock;
  message: string;
  cta: string;
  href: string;
  theme: NavTheme;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-14 text-center">
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: theme.bgActive, color: theme.iconActive }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mb-4 text-sm leading-relaxed text-white/45">{message}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
        style={{ backgroundColor: theme.icon, color: '#0a0a0a' }}
      >
        {cta}
      </Link>
    </div>
  );
}

export default function LibraryV2View() {
  const pathname = usePathname() ?? '';
  const [activeTab, setActiveTab] = useState<LibraryV2Tab>('continue');
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all');
  const [confirmAction, setConfirmAction] = useState<'saved' | 'continue' | 'recent' | null>(null);

  const {
    isLoading,
    watchlist,
    continueWatching,
    watchedHistory,
    removeFromWatchlist,
    clearWatchlist,
    removeContinue,
    clearContinue,
    removeWatched,
    clearWatched,
    finishLater,
    markAsWatched,
  } = useLibraryPageData();

  const counts: Record<LibraryV2Tab, number> = {
    continue: continueWatching.length,
    saved: watchlist.length,
    recent: watchedHistory.length,
  };

  const movies = watchlist.filter((item) => item.media_type === 'movie');
  const tvShows = watchlist.filter((item) => item.media_type === 'tv');
  const filteredSaved =
    savedFilter === 'movie' ? movies : savedFilter === 'tv' ? tvShows : watchlist;

  const handleConfirm = () => {
    if (confirmAction === 'saved') void clearWatchlist();
    if (confirmAction === 'continue') clearContinue();
    if (confirmAction === 'recent') clearWatched();
    setConfirmAction(null);
  };

  if (isLoading) return <LibraryV2Loading />;

  return (
    <div className="w-full min-w-0 px-4 py-4 pb-8 sm:px-5">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-5 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: navThemes.library.icon }}
          />
          <h1 className="text-base font-semibold leading-none text-white sm:text-lg">Your Library</h1>
          <span className="text-[11px] text-white/35">
            {counts.continue} in progress · {counts.saved} saved
          </span>
        </div>

        {activeTab === 'saved' && watchlist.length > 0 ? (
          <button
            type="button"
            onClick={() => setConfirmAction('saved')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear saved</span>
          </button>
        ) : null}
        {activeTab === 'continue' && continueWatching.length > 0 ? (
          <button
            type="button"
            onClick={() => setConfirmAction('continue')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear all</span>
          </button>
        ) : null}
        {activeTab === 'recent' && watchedHistory.length > 0 ? (
          <button
            type="button"
            onClick={() => setConfirmAction('recent')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear history</span>
          </button>
        ) : null}
      </div>

      <div className="mb-5 flex gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-1">
        {tabConfig.map(({ id, label, icon: Icon, theme }) => {
          const isActive = activeTab === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm"
              style={
                isActive
                  ? { backgroundColor: theme.bgActive, color: theme.label }
                  : { color: '#a1a1aa' }
              }
            >
              <Icon
                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                style={{ color: isActive ? theme.iconActive : theme.icon }}
              />
              <span className="truncate">{label}</span>
              {count > 0 ? (
                <span
                  className="hidden sm:inline rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: isActive ? `${theme.icon}33` : 'rgba(255,255,255,0.06)',
                    color: isActive ? theme.iconActive : theme.icon,
                  }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === 'continue' ? (
        continueWatching.length === 0 ? (
          <LibraryEmpty
            icon={Clock}
            message="Nothing in progress yet. Start watching and pick up right where you left off."
            cta="Browse movies"
            href={toV2Href(pathname, '/browse/movies')}
            theme={navThemes.home}
          />
        ) : (
          <div className={BROWSE_V2_GRID_CLASS}>
            {continueWatching.map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                item={continueToMediaItem(item)}
                compact
                customActions={[
                  {
                    label: 'Mark as finished',
                    onClick: () => markAsWatched(item.id, item.media_type),
                    icon: <Check size={16} className="text-emerald-400" />,
                    toastMessage: 'Marked as finished',
                  },
                  {
                    label: 'Save for later',
                    onClick: () => finishLater(item.id, item.media_type),
                    icon: <Clock size={16} className="text-amber-400" />,
                    toastMessage: 'Saved for later',
                  },
                  {
                    label: 'Remove',
                    onClick: () => removeContinue(item.id, item.media_type),
                    icon: <Trash2 size={16} className="text-red-400" />,
                    toastMessage: 'Removed',
                  },
                ]}
              />
            ))}
          </div>
        )
      ) : null}

      {activeTab === 'saved' ? (
        watchlist.length === 0 ? (
          <LibraryEmpty
            icon={Bookmark}
            message="No saved titles yet. Bookmark movies and shows to watch later."
            cta="Discover movies"
            href={toV2Href(pathname, '/browse/movies')}
            theme={navThemes.library}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all' as const, label: 'All', count: watchlist.length, icon: Bookmark },
                  { id: 'movie' as const, label: 'Movies', count: movies.length, icon: Film },
                  { id: 'tv' as const, label: 'TV Shows', count: tvShows.length, icon: Tv },
                ] as const
              ).map(({ id, label, count, icon: Icon }) => {
                const isActive = savedFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSavedFilter(id)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={
                      isActive
                        ? {
                            borderColor: `${navThemes.library.icon}55`,
                            backgroundColor: navThemes.library.bgActive,
                            color: navThemes.library.label,
                          }
                        : {
                            borderColor: 'rgba(255,255,255,0.08)',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            color: '#9ca3af',
                          }
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {filteredSaved.length === 0 ? (
              <p className="py-10 text-center text-sm text-white/45">
                No {savedFilter === 'movie' ? 'movies' : 'TV shows'} saved yet.
              </p>
            ) : (
              <div className={BROWSE_V2_GRID_CLASS}>
                {filteredSaved.map((item) => (
                  <MediaCard
                    key={`${item.media_type}-${item.id}`}
                    item={item}
                    compact
                    customActions={[
                      {
                        label: 'Remove from saved',
                        onClick: () => void removeFromWatchlist(item.id, item.media_type),
                        icon: <Trash2 size={16} className="text-red-400" />,
                        toastMessage: 'Removed from saved',
                      },
                    ]}
                  />
                ))}
              </div>
            )}
          </div>
        )
      ) : null}

      {activeTab === 'recent' ? (
        watchedHistory.length === 0 ? (
          <LibraryEmpty
            icon={CheckCircle2}
            message="No finished titles yet. Mark shows as done when you finish them."
            cta="Start watching"
            href={toV2Href(pathname, '/')}
            theme={navThemes.parties}
          />
        ) : (
          <div className={BROWSE_V2_GRID_CLASS}>
            {watchedHistory.map((item) => (
              <MediaCard
                key={`${item.id}-${item.media_type}-watched`}
                item={watchedToMediaItem(item)}
                compact
                customActions={[
                  {
                    label: 'Remove',
                    onClick: () => removeWatched(item.id, item.media_type),
                    icon: <Trash2 size={16} className="text-red-400" />,
                    toastMessage: 'Removed from completed',
                  },
                ]}
              />
            ))}
          </div>
        )
      ) : null}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction === 'saved'
            ? 'Clear saved list?'
            : confirmAction === 'continue'
              ? 'Clear continue watching?'
              : 'Clear watch history?'
        }
        message="This action cannot be undone."
        confirmText="Clear"
        type="danger"
      />
    </div>
  );
}
