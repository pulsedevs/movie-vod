'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { Season, TvSeasonDetailsResponse } from '@/types';
import { navThemes } from '@/components/home/v2/navThemes';
import { V2_DURATION, v2Transition } from '@/utils/v2Transitions';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

type EpisodeViewMode = 'grid' | 'list';

const DRAG_THRESHOLD_PX = 10;

interface DetailPanelSeasonEpisodesProps {
  validSeasons: Season[];
  selectedSeasonNumber: number | null;
  selectedEpisodeNumber: number | null;
  seasonData: TvSeasonDetailsResponse | null;
  isLoadingEpisodes: boolean;
  onSeasonSelect: (seasonNum: number) => void;
  onPlayEpisode: (seasonNum: number, episodeNum: number) => void;
}

function seasonLabel(season: Season): string {
  if (season.season_number === 0) return 'Specials';
  return season.name || `Season ${season.season_number}`;
}

/** Compact season + episode picker for the 256px v2 right panel (below servers/actions). */
export default function DetailPanelSeasonEpisodes({
  validSeasons,
  selectedSeasonNumber,
  selectedEpisodeNumber,
  seasonData,
  isLoadingEpisodes,
  onSeasonSelect,
  onPlayEpisode,
}: DetailPanelSeasonEpisodesProps) {
  const theme = navThemes.tv;
  const reducedMotion = useReducedMotion();
  const seasonScrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<EpisodeViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem('episodeViewMode') as EpisodeViewMode) ?? 'grid';
  });

  const toggleViewMode = (mode: EpisodeViewMode) => {
    setViewMode(mode);
    localStorage.setItem('episodeViewMode', mode);
  };
  const dragRef = useRef({
    active: false,
    dragged: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: -1,
  });
  const dragListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
  } | null>(null);

  const clearDragListeners = () => {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    window.removeEventListener('pointercancel', listeners.up);
    dragListenersRef.current = null;
  };

  useEffect(() => () => clearDragListeners(), []);

  const handleSeasonPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Touch uses native horizontal scroll — custom drag breaks taps
    if (e.pointerType === 'touch') return;

    const el = seasonScrollRef.current;
    if (!el) return;

    clearDragListeners();

    dragRef.current = {
      active: true,
      dragged: false,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      pointerId: e.pointerId,
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== dragRef.current.pointerId || !seasonScrollRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      if (!dragRef.current.dragged && Math.abs(dx) > DRAG_THRESHOLD_PX) {
        dragRef.current.dragged = true;
      }
      if (dragRef.current.dragged) {
        ev.preventDefault();
        seasonScrollRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
      }
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== dragRef.current.pointerId) return;
      dragRef.current.active = false;
      clearDragListeners();
      if (!dragRef.current.dragged) {
        dragRef.current.dragged = false;
      }
    };

    dragListenersRef.current = { move: onMove, up: onUp };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleSeasonClick = (seasonNum: number) => {
    if (dragRef.current.dragged) {
      dragRef.current.dragged = false;
      return;
    }
    onSeasonSelect(seasonNum);
  };

  useEffect(() => {
    const el = seasonScrollRef.current;
    if (!el) return;
    const selected = el.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedSeasonNumber]);

  const activeSeason = validSeasons.find((s) => s.season_number === selectedSeasonNumber);

  return (
    <motion.section
      className="mt-2.5 w-full min-w-0 max-w-full overflow-hidden border-t border-white/[0.06] pt-2.5"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={v2Transition(V2_DURATION.panel, 0.2, reducedMotion ?? false)}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Seasons
        </h3>
        {activeSeason && (
          <span className="truncate text-[9px] text-zinc-600">
            {activeSeason.episode_count} ep{activeSeason.episode_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {validSeasons.length > 0 ? (
        <div className="relative mb-2.5 w-full min-w-0 max-w-full group/seasons">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#111111] to-transparent opacity-0 transition-opacity group-hover/seasons:opacity-100" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#111111] to-transparent" />
          <div
            ref={seasonScrollRef}
            onPointerDown={handleSeasonPointerDown}
            className="flex w-full min-w-0 max-w-full flex-nowrap gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-0.5 py-0.5 [touch-action:pan-x] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:cursor-grab md:active:cursor-grabbing"
          >
            {validSeasons.map((season) => {
              const isActive = selectedSeasonNumber === season.season_number;
              const shortLabel =
                season.season_number === 0 ? 'SP' : `S${season.season_number}`;
              return (
                <button
                  key={season.season_number}
                  type="button"
                  data-season={season.season_number}
                  data-selected={isActive ? 'true' : undefined}
                  title={seasonLabel(season)}
                  onClick={() => handleSeasonClick(season.season_number)}
                  className="relative shrink-0 select-none rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors"
                  style={
                    isActive
                      ? {
                          backgroundColor: theme.bgActive,
                          color: theme.label,
                          borderColor: `${theme.icon}55`,
                        }
                      : {
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          color: '#a1a1aa',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }
                  }
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mb-2 text-[10px] text-zinc-500">No seasons available</p>
      )}

      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Episodes
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => toggleViewMode('grid')}
            title="Grid view"
            className="flex h-5 w-5 items-center justify-center rounded transition-colors"
            style={viewMode === 'grid' ? { color: theme.iconActive } : { color: '#52525b' }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => toggleViewMode('list')}
            title="Poster view"
            className="flex h-5 w-5 items-center justify-center rounded transition-colors"
            style={viewMode === 'list' ? { color: theme.iconActive } : { color: '#52525b' }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <rect x="1" y="1" width="5" height="4" rx="0.5" />
              <rect x="7" y="2" width="8" height="1.5" rx="0.5" />
              <rect x="7" y="4" width="5" height="1" rx="0.5" />
              <rect x="1" y="7" width="5" height="4" rx="0.5" />
              <rect x="7" y="8" width="8" height="1.5" rx="0.5" />
              <rect x="7" y="10" width="5" height="1" rx="0.5" />
              <rect x="1" y="13" width="5" height="2" rx="0.5" />
              <rect x="7" y="13.5" width="8" height="1.5" rx="0.5" />
            </svg>
          </button>
        </div>
      </div>

      {isLoadingEpisodes ? (
        <div className="grid grid-cols-5 gap-0.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-[22px] animate-pulse rounded bg-white/[0.06]" />
          ))}
        </div>
      ) : seasonData?.episodes?.length ? (
        viewMode === 'grid' ? (
          <div className="grid max-h-[min(38vh,280px)] min-h-0 grid-cols-5 gap-0.5 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {seasonData.episodes.map((episode) => {
              const isSelected = selectedEpisodeNumber === episode.episode_number;
              return (
                <button
                  key={episode.id}
                  type="button"
                  onClick={() => onPlayEpisode(selectedSeasonNumber!, episode.episode_number)}
                  title={episode.name || `Episode ${episode.episode_number}`}
                  className="flex h-[22px] items-center justify-center rounded border text-[9px] font-bold leading-none transition-colors hover:bg-white/[0.07]"
                  style={
                    isSelected
                      ? { backgroundColor: theme.bgActive, borderColor: `${theme.icon}55`, color: theme.iconActive }
                      : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#a1a1aa' }
                  }
                >
                  {episode.episode_number}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex max-h-[min(38vh,280px)] min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {seasonData.episodes.map((episode) => {
              const isSelected = selectedEpisodeNumber === episode.episode_number;
              const stillUrl = episode.still_path
                ? `${TMDB_IMAGE_BASE_URL}w300${episode.still_path}`
                : null;
              const airDate = episode.air_date
                ? new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null;
              return (
                <button
                  key={episode.id}
                  type="button"
                  onClick={() => onPlayEpisode(selectedSeasonNumber!, episode.episode_number)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded border px-1.5 py-1 text-left transition-colors hover:bg-white/[0.05]"
                  style={
                    isSelected
                      ? { backgroundColor: theme.bgActive, borderColor: `${theme.icon}55` }
                      : { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }
                  }
                >
                  <div className="relative h-[36px] w-[64px] shrink-0 overflow-hidden rounded bg-white/[0.06]">
                    {stillUrl ? (
                      <Image src={stillUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-[10px] font-bold text-zinc-600">{episode.episode_number}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-px text-[8px] font-bold text-white">
                      E{episode.episode_number}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold leading-tight" style={{ color: isSelected ? theme.iconActive : '#e4e4e7' }}>
                      {episode.name || `Episode ${episode.episode_number}`}
                    </p>
                    {airDate && (
                      <p className="mt-0.5 text-[9px] text-zinc-500">{airDate}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <p className="text-[10px] text-zinc-500">No episodes for this season</p>
      )}
    </motion.section>
  );
}
