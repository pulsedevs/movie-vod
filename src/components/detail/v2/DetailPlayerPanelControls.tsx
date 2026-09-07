'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Share2, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import DownloadButton from '@/components/player/DownloadButton';
import YouTubeComments from '@/components/movie/YouTubeComments';
import { navThemes } from '@/components/home/v2/navThemes';
import { V2_DURATION, v2Transition } from '@/utils/v2Transitions';

interface SourceOption {
  name: string;
  url: string;
  hasAds?: boolean;
}

interface DetailPlayerPanelControlsProps {
  availableSources: SourceOption[];
  selectedSourceIndex: number;
  is4KSelected: boolean;
  onSourceChange: (url: string, index: number) => void;
  is4KAvailable: boolean;
  onToggle4K?: () => void;
  mediaType: 'movie' | 'tv';
  mediaId: string | number;
  title: string;
  trailerId?: string;
  likeCount?: number;
  onShare: () => void;
  isItemInWatchlist: boolean;
  isProcessingWatchlist: boolean;
  isWatchlistLoading: boolean;
  onWatchlistToggle: () => void;
  /** When true, renders servers as a compact horizontal swipable row instead of a grid */
  inline?: boolean;
}

/** Compact tile for the 256px right panel — shared height across all actions */
const panelActionTile =
  'flex h-7 w-full flex-row items-center justify-center gap-1 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 text-zinc-200 transition-colors hover:bg-white/[0.07] disabled:opacity-50';

const panelIconClass = 'h-3 w-3 shrink-0';
const panelLabelClass = 'text-[9px] font-semibold leading-none';

const tileClass = panelActionTile;

export default function DetailPlayerPanelControls({
  availableSources,
  selectedSourceIndex,
  is4KSelected,
  onSourceChange,
  is4KAvailable,
  onToggle4K,
  mediaType,
  mediaId,
  title,
  trailerId,
  likeCount,
  onShare,
  isItemInWatchlist,
  isProcessingWatchlist,
  isWatchlistLoading,
  onWatchlistToggle,
  inline = false,
}: DetailPlayerPanelControlsProps) {
  const theme = mediaType === 'movie' ? navThemes.movies : navThemes.tv;
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={v2Transition(V2_DURATION.panel, 0.14, reducedMotion ?? false)}
    >
      {availableSources.length > 0 && (
        <section>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Servers
          </h3>

          {inline ? (
            /* Horizontal swipable pill row for mobile inline */
            <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] pb-0.5">
              {availableSources.map((source, index) => {
                const isSelected = selectedSourceIndex === index && !is4KSelected;
                return (
                  <button
                    key={`inline-source-${index}`}
                    type="button"
                    onClick={() => { if (!isSelected) onSourceChange(source.url, index); }}
                    className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border text-[10px] font-semibold transition-colors"
                    style={
                      isSelected
                        ? {
                            backgroundColor: theme.bgActive,
                            borderColor: `${theme.icon}55`,
                            color: theme.label,
                          }
                        : {
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderColor: 'rgba(255,255,255,0.10)',
                            color: 'rgba(255,255,255,0.7)',
                          }
                    }
                  >
                    {isSelected ? (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.iconActive }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: theme.iconActive }} />
                      </span>
                    ) : (
                      <Sparkles className="h-2.5 w-2.5 shrink-0" style={{ color: theme.icon }} />
                    )}
                    P{index + 1}
                    {source.hasAds && <span className="text-[8px] font-bold uppercase text-amber-400/80">ADS</span>}
                    {isSelected && <span className="text-[7px] font-bold uppercase opacity-70">ON</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Grid for desktop right panel */
            <div className="grid grid-cols-3 gap-1">
              {availableSources.map((source, index) => {
                const isSelected = selectedSourceIndex === index && !is4KSelected;
                return (
                  <button
                    key={`panel-source-${index}`}
                    type="button"
                    onClick={() => { if (!isSelected) onSourceChange(source.url, index); }}
                    className={`relative ${tileClass} disabled:cursor-default transition-all duration-200 ${isSelected ? 'scale-[1.04] ring-1' : 'hover:scale-[1.02]'}`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: theme.bgActive,
                            borderColor: `${theme.icon}70`,
                            color: theme.label,

                            boxShadow: `0 0 10px ${theme.icon}30`,
                          }
                        : undefined
                    }
                  >
                    {/* Live dot — top-left corner */}
                    {isSelected && (
                      <span className="absolute top-1 left-1 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                    )}
                    <Sparkles className="h-3 w-3 shrink-0" style={{ color: isSelected ? theme.iconActive : theme.icon }} />
                    <span className="text-[9px] font-semibold leading-none">P{index + 1}</span>
                    {source.hasAds && (
                      <span className="text-[8px] font-bold uppercase leading-none text-amber-400/80">ADS</span>
                    )}
                    {isSelected && (
                      <span className="text-[7px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.iconActive }}>
                        ON
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Actions
        </h3>

        {inline ? (
          /* Horizontal swipable pill row for mobile inline */
          <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] pb-0.5">
            {is4KAvailable && !is4KSelected && onToggle4K && (
              <button
                type="button"
                onClick={onToggle4K}
                className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border border-blue-400/30 bg-blue-400/10 text-[10px] font-semibold text-blue-300 transition-colors hover:bg-blue-400/20 whitespace-nowrap"
              >
                <Sparkles className="h-2.5 w-2.5 shrink-0 text-blue-400" />
                4K
              </button>
            )}

            <DownloadButton
              mediaType={mediaType}
              mediaId={mediaId}
              showLabel
              className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/[0.10] bg-white/[0.04] text-[10px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.07] whitespace-nowrap [&_svg]:!h-2.5 [&_svg]:!w-2.5 [&_svg]:shrink-0"
            />

            <button
              type="button"
              onClick={onShare}
              className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/[0.10] bg-white/[0.04] text-[10px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.07] whitespace-nowrap"
            >
              <Share2 className="h-2.5 w-2.5 shrink-0 text-zinc-300" />
              Share
            </button>

            <button
              type="button"
              onClick={onWatchlistToggle}
              disabled={isProcessingWatchlist || isWatchlistLoading}
              className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border text-[10px] font-semibold transition-colors hover:bg-white/[0.07] whitespace-nowrap disabled:opacity-50"
              style={
                isItemInWatchlist
                  ? {
                      backgroundColor: navThemes.library.bgActive,
                      borderColor: `${navThemes.library.icon}44`,
                      color: navThemes.library.label,
                    }
                  : {
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.88)',
                    }
              }
            >
              {isProcessingWatchlist || isWatchlistLoading ? (
                <div className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border border-white/30 border-t-white" />
              ) : isItemInWatchlist ? (
                <BookmarkCheck className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
              ) : (
                <Bookmark className="h-2.5 w-2.5 shrink-0" />
              )}
              {isItemInWatchlist ? 'Saved' : 'Save'}
            </button>

            {trailerId && (
              <YouTubeComments
                videoId={trailerId}
                likeCount={likeCount}
                inline
                variant="panel"
                className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/[0.10] bg-white/[0.04] text-[10px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.07] whitespace-nowrap [&_svg]:!h-2.5 [&_svg]:!w-2.5"
                showLikes={false}
              />
            )}
          </div>
        ) : (
          /* Grid for desktop right panel */
          <div className="grid grid-cols-3 items-stretch gap-1">
            {is4KAvailable && !is4KSelected && onToggle4K && (
              <button type="button" onClick={onToggle4K} className={panelActionTile}>
                <Sparkles className={`${panelIconClass} text-blue-400`} />
                <span className={panelLabelClass}>4K</span>
              </button>
            )}

            <DownloadButton
              mediaType={mediaType}
              mediaId={mediaId}
              showLabel
              className={`${panelActionTile} [&_svg]:!h-3 [&_svg]:!w-3`}
            />

            <button type="button" onClick={onShare} className={panelActionTile}>
              <Share2 className={`${panelIconClass} text-zinc-300`} />
              <span className={panelLabelClass}>Share</span>
            </button>

            <button
              type="button"
              onClick={onWatchlistToggle}
              disabled={isProcessingWatchlist || isWatchlistLoading}
              className={panelActionTile}
              style={
                isItemInWatchlist
                  ? {
                      backgroundColor: navThemes.library.bgActive,
                      borderColor: `${navThemes.library.icon}44`,
                    }
                  : undefined
              }
            >
              {isProcessingWatchlist || isWatchlistLoading ? (
                <div className={`${panelIconClass} animate-spin rounded-full border border-white/30 border-t-white`} />
              ) : isItemInWatchlist ? (
                <BookmarkCheck className={`${panelIconClass} text-emerald-400`} />
              ) : (
                <Bookmark className={`${panelIconClass} text-zinc-300`} />
              )}
              <span className={panelLabelClass}>{isItemInWatchlist ? 'Saved' : 'Save'}</span>
            </button>

            {trailerId && (
              <YouTubeComments
                videoId={trailerId}
                likeCount={likeCount}
                inline
                variant="panel"
                className={panelActionTile}
                showLikes={false}
              />
            )}
          </div>
        )}
      </section>
    </motion.div>
  );
}
