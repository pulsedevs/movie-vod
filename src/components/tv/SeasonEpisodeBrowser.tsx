'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Season, TvSeasonDetailsResponse, StreamSource } from '@/types';
import {
  ChevronDown,
  Play,
  Grid,
  ListIcon,
  Clock,
  Star,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Share2,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import YouTubeComments from '@/components/movie/YouTubeComments';
import { useHybridData } from '@/hooks/useHybridData';
import { navThemes } from '@/components/home/v2/navThemes';
import DownloadButton from '@/components/player/DownloadButton';
import WatchPartyButton from '@/components/watchParty/WatchPartyButton';
import Image from 'next/image';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import MoviePlayer from '@/components/player/MoviePlayer';
import { getTvSourceIndex } from '@/utils/sourceOverride';
import useRemoteSourceOverrides from '@/hooks/useRemoteSourceOverrides';
import { writeContinueWatching } from '@/utils/libraryStorage';
import {
  PLAYER_ASPECT_SHELL_CLASS,
  useMobilePlayerOptimization,
} from '@/hooks/useMobilePlayerOptimization';
import DetailPanelSeasonEpisodes from '@/components/detail/v2/DetailPanelSeasonEpisodes';
import { DETAIL_TV_SEASONS_PORTAL_ID } from '@/utils/detailPanel';

// Helper function to fetch season data using server-side API
async function getSeasonData(tvId: string | number, seasonNumber: number): Promise<TvSeasonDetailsResponse | null> {
  const url = `/api/tv/season?tvId=${tvId}&seasonNumber=${seasonNumber}`;
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetching season details from: ${url}`);
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`API Error fetching season ${seasonNumber}: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Fetch Error for season ${seasonNumber}:`, error);
    return null;
  }
}

interface SeasonEpisodeBrowserProps {
  tvId: string | number;
  showTitle: string;
  initialSeasons: Season[];
  sources: StreamSource[];
  trailerId?: string;
  voteCount?: number;
  initialSourceIndex?: number;
  posterPath?: string | null;
  /** v2 shell: player in center, servers + seasons in right panel */
  inShell?: boolean;
  /** Deep-linked episode (/tv/{id}/{slug}/season/{s}/episode/{e}) — starts the player there. */
  initialSeasonNumber?: number;
  initialEpisodeNumber?: number;
}

const SeasonEpisodeBrowser: React.FC<SeasonEpisodeBrowserProps> = ({
  tvId,
  showTitle,
  trailerId,
  voteCount,
  initialSeasons = [],
  sources = [],
  initialSourceIndex,
  posterPath,
  inShell = false,
  initialSeasonNumber,
  initialEpisodeNumber,
}) => {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(
    initialSeasonNumber ?? null
  );
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number | null>(
    initialEpisodeNumber ?? null
  );
  /** Shell player keeps last episode mounted while a new season's episodes load */
  const [playerSeason, setPlayerSeason] = useState<number | null>(initialSeasonNumber ?? null);
  const [playerEpisode, setPlayerEpisode] = useState<number | null>(initialEpisodeNumber ?? null);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [seasonData, setSeasonData] = useState<TvSeasonDetailsResponse | null>(null);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number>(0);
  const [displayAsNumbers, setDisplayAsNumbers] = useState(false);
  const [infoEpisode, setInfoEpisode] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [sourceOverrideApplied, setSourceOverrideApplied] = useState(false);
  const [isMd, setIsMd] = useState(false);
  const [serversOpen, setServersOpen] = useState(false);
  const [seasonsOpen, setSeasonsOpen] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem('episodeViewMode') as 'grid' | 'list') ?? 'grid';
  });
  const theme = navThemes.tv;

  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useHybridData();
  const isInWatchlistNow = isInWatchlist(tvId, 'tv');

  const handleWatchlistToggle = () => {
    if (isInWatchlistNow) {
      removeFromWatchlist(tvId, 'tv');
    } else {
      addToWatchlist({
        id: typeof tvId === 'string' ? parseInt(tvId, 10) : tvId,
        media_type: 'tv',
        name: showTitle,
        poster_path: posterPath ?? null,
        overview: '',
        vote_average: 0,
        first_air_date: '',
      });
    }
  };

  const seasonDropdownRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const seasonScrollRef = useRef<HTMLDivElement>(null);
  const [seasonsPortalTarget, setSeasonsPortalTarget] = useState<HTMLElement | null>(null);
  useMobilePlayerOptimization();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsMd(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Firebase Remote Config integration
  const { config: remoteConfig } = useRemoteSourceOverrides();

  useEffect(() => {
    if (!inShell) {
      setSeasonsPortalTarget(null);
      return;
    }
    const mount = () => {
      setSeasonsPortalTarget(document.getElementById(DETAIL_TV_SEASONS_PORTAL_ID));
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [inShell]);

  // Function to check for source override (uses Firebase Remote Config)
  const getSourceOverride = () => {
    const mediaIdStr = String(tvId);
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`🔧 getSourceOverride called for TV ${mediaIdStr}:`);
      console.log(`   → Remote config:`, remoteConfig);
      console.log(`   → TV overrides:`, remoteConfig?.tvOverrides);
      console.log(`   → Override for ${mediaIdStr}:`, remoteConfig?.tvOverrides?.[mediaIdStr]);
    }
    // Use getTvSourceIndex which checks Firebase Remote Config first, then hard-coded fallbacks
    const overrideIndex = getTvSourceIndex(mediaIdStr, remoteConfig);
    if (isDev) {
      console.log(`   → Final override index:`, overrideIndex);
    }
    return overrideIndex;
  };

  // Function to save watch progress to localStorage
  const saveWatchProgress = (overrideSourceIndex?: number) => {
    if (selectedSeasonNumber === null || selectedEpisodeNumber === null) return;

    let poster_path = '';
    if (initialSeasons && initialSeasons.length > 0) {
      const seasonWithPoster = initialSeasons.find(s => s.poster_path);
      if (seasonWithPoster) poster_path = seasonWithPoster.poster_path || '';
    }
    if (!poster_path && seasonData && seasonData.poster_path) {
      poster_path = seasonData.poster_path;
    }

    const item = {
      id: Number(tvId),
      media_type: 'tv',
      title: showTitle,
      poster_path: poster_path || '',
      season_number: selectedSeasonNumber,
      episode_number: selectedEpisodeNumber,
      source_index: overrideSourceIndex !== undefined ? overrideSourceIndex : selectedSourceIndex,
      display_as_numbers: displayAsNumbers, // Save display mode
      last_watched: new Date().toISOString(),
    };

    const data = JSON.parse(localStorage.getItem('continueWatching') || '[]');
    // Remove existing entry for this media
    const filtered = data.filter((i: any) => !(Number(i.id) === item.id && i.media_type === item.media_type));
    // Prepend the new item
    const updated = [item, ...filtered];
    writeContinueWatching(updated);
  };

  // Initialize with first valid season
  useEffect(() => {
    const firstValidSeason = initialSeasons.find(s => s.season_number > 0 && s.episode_count > 0) || initialSeasons[0];
    if (firstValidSeason) {
      setSelectedSeasonNumber(firstValidSeason.season_number);
    }
  }, [initialSeasons]);

  // Fetch season data when season changes
  useEffect(() => {
    if (selectedSeasonNumber === null) return;

    const fetchSeasonData = async () => {
      setIsLoadingEpisodes(true);
      try {
        const data = await getSeasonData(tvId, selectedSeasonNumber);
        setSeasonData(data);

        if (data && data.episodes && data.episodes.length > 0) {
          const matchingEpisode =
            selectedEpisodeNumber != null
              ? data.episodes.find((ep) => ep.episode_number === selectedEpisodeNumber)
              : undefined;
          const episodeToPlay = matchingEpisode?.episode_number ?? data.episodes[0].episode_number;

          setSelectedEpisodeNumber(episodeToPlay);
          setIsPlaying(true);

          if (inShell) {
            setPlayerSeason(selectedSeasonNumber);
            setPlayerEpisode(episodeToPlay);
          }

          // Keep the user's current server selection — do not override on season change
          saveWatchProgress();
        } else {
          setSelectedEpisodeNumber(null);
          setIsPlaying(false);
          if (inShell) {
            setPlayerSeason(null);
            setPlayerEpisode(null);
          }
        }
      } catch (error) {
        console.error("Error fetching season data:", error);
      } finally {
        setIsLoadingEpisodes(false);
      }
    };

    fetchSeasonData();
  }, [tvId, selectedSeasonNumber]);

  // Scroll selected season into view when changed and check scroll buttons visibility
  useEffect(() => {
    if (selectedSeasonNumber !== null && seasonScrollRef.current) {
      const selectedSeasonElement = seasonScrollRef.current.querySelector(`[data-season="${selectedSeasonNumber}"]`);
      if (selectedSeasonElement) {
        selectedSeasonElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
      
      // Check scroll position
      checkScrollPosition();
    }
  }, [selectedSeasonNumber]);

  // Check if we can scroll left or right
  const checkScrollPosition = () => {
    if (!seasonScrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = seasonScrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  // Attach scroll event listener to update arrow visibility
  useEffect(() => {
    if (inShell) return;

    const scrollContainer = seasonScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    checkScrollPosition();

    const ro = new ResizeObserver(checkScrollPosition);
    ro.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, [inShell, initialSeasons.length]);

  // Functions to scroll the seasons left and right
  const scrollSeasonsLeft = () => {
    if (!seasonScrollRef.current) return;
    seasonScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };
  
  const scrollSeasonsRight = () => {
    if (!seasonScrollRef.current) return;
    seasonScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Close season dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setIsSeasonDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [seasonDropdownRef]);
  // Enhanced auto-scroll to player with page load detection (classic layout only)
  useEffect(() => {
    if (inShell) return;

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('TV Player: Setting up auto-scroll with page load detection');
    }
    
    let scrollTimer: NodeJS.Timeout;
    let fallbackTimer: NodeJS.Timeout;
    
    const performScroll = () => {
      if (playerRef.current) {
        if (isDev) {
          console.log('TV Player: Performing scroll to player');
        }
        
        // Scroll the player into view with center positioning for better UX
        playerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        
        // Set focus for accessibility after scroll completes
        setTimeout(() => {
          if (playerRef.current) {
            const focusableElement = playerRef.current.querySelector('button, [tabindex="0"], iframe, video') as HTMLElement;
            if (focusableElement) {
              focusableElement.focus({ preventScroll: true });
              if (isDev) {
                console.log('TV Player: Focus set on player element');
              }
            }
          }
        }, 500);
      }
    };

    const setupScrollAfterPageLoad = () => {
      if (document.readyState === 'complete') {
        if (isDev) {
          console.log('TV Player: Page already loaded, setting up scroll with delay');
        }
        scrollTimer = setTimeout(performScroll, 3000);
      } else {
        if (isDev) {
          console.log('TV Player: Waiting for page load completion');
        }
        const onLoad = () => {
          if (isDev) {
            console.log('TV Player: Page load completed, setting up scroll with delay');
          }
          scrollTimer = setTimeout(performScroll, 3000);
        };
        
        window.addEventListener('load', onLoad, { once: true });
        
        // Cleanup function will remove this listener if component unmounts
        return () => window.removeEventListener('load', onLoad);
      }
    };

    const cleanupPageLoadListener = setupScrollAfterPageLoad();
    
    // Fallback scroll in case page load detection fails
    fallbackTimer = setTimeout(() => {
      if (isDev) {
        console.log('TV Player: Fallback scroll triggered');
      }
      performScroll();
    }, 8000);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (cleanupPageLoadListener) cleanupPageLoadListener();
      if (isDev) {
        console.log('TV Player: Auto-scroll cleanup completed');
      }
    };
  }, [inShell]);
  // Restore last watched season, episode, source index, and display mode from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const data = JSON.parse(localStorage.getItem('continueWatching') || '[]');
    const entry = data.find((i: any) => i.id === tvId && i.media_type === 'tv');
    if (entry) {
      if (typeof entry.season_number === 'number') setSelectedSeasonNumber(entry.season_number);
      if (typeof entry.episode_number === 'number') setSelectedEpisodeNumber(entry.episode_number);
      
      // Source selection priority: URL parameter > localStorage > overrides > default
      const isDev = process.env.NODE_ENV === 'development';
      if (initialSourceIndex !== undefined && initialSourceIndex >= 0 && initialSourceIndex < sources.length) {
        if (isDev) {
          console.log(`Using initial source index from URL for TV ID ${tvId}:`, initialSourceIndex);
        }
        setSelectedSourceIndex(initialSourceIndex);
        setSourceOverrideApplied(false);
      } else if (typeof entry.source_index === 'number' && entry.source_index >= 0 && entry.source_index < sources.length) {
        if (isDev) {
          console.log(`Using saved source index for TV ID ${tvId}:`, entry.source_index);
        }
        setSelectedSourceIndex(entry.source_index);
        setSourceOverrideApplied(false);
      } else {
        // Check for source override as fallback
        const overrideIndex = getSourceOverride();
        if (overrideIndex !== undefined && overrideIndex >= 0 && overrideIndex < sources.length) {
          if (isDev) {
            console.log(`Using source override for TV ID ${tvId}:`, overrideIndex);
          }
          setSelectedSourceIndex(overrideIndex);
          setSourceOverrideApplied(true);
        } else {
          if (isDev) {
            console.log(`Using default source index (0) for TV ID ${tvId}`);
          }
          setSelectedSourceIndex(0);
          setSourceOverrideApplied(false);
        }
      }
      
      if (typeof entry.display_as_numbers === 'boolean') setDisplayAsNumbers(entry.display_as_numbers); // Restore display mode
      setIsPlaying(true);
    } else {
      // No localStorage entry - apply URL parameter or override logic
      const isDev = process.env.NODE_ENV === 'development';
      if (initialSourceIndex !== undefined && initialSourceIndex >= 0 && initialSourceIndex < sources.length) {
        if (isDev) {
          console.log(`Using initial source index from URL for new TV session ${tvId}:`, initialSourceIndex);
        }
        setSelectedSourceIndex(initialSourceIndex);
        setSourceOverrideApplied(false);
      } else {
        const overrideIndex = getSourceOverride();
        if (overrideIndex !== undefined && overrideIndex >= 0 && overrideIndex < sources.length) {
          if (isDev) {
            console.log(`Using source override for new TV session ${tvId}:`, overrideIndex);
          }
          setSelectedSourceIndex(overrideIndex);
          setSourceOverrideApplied(true);
        }
      }
    }
  }, [tvId, sources.length, initialSourceIndex]);

  // Save to localStorage when critical values change
  useEffect(() => {
    if (isPlaying && selectedSeasonNumber !== null && selectedEpisodeNumber !== null) {
      saveWatchProgress();
    }
  }, [isPlaying, selectedSeasonNumber, selectedEpisodeNumber, selectedSourceIndex, displayAsNumbers]); // Add displayAsNumbers

  // Save progress when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedSeasonNumber !== null && selectedEpisodeNumber !== null) {
        saveWatchProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (selectedSeasonNumber !== null && selectedEpisodeNumber !== null) {
        saveWatchProgress();
      }
    };
  }, [selectedSeasonNumber, selectedEpisodeNumber, selectedSourceIndex, displayAsNumbers, tvId, showTitle]); // Add displayAsNumbers

  // Set up interval to periodically save watching progress while playing
  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      if (selectedSeasonNumber !== null && selectedEpisodeNumber !== null) {
        saveWatchProgress();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isPlaying, selectedSeasonNumber, selectedEpisodeNumber, selectedSourceIndex, displayAsNumbers]); // Add displayAsNumbers

  const handlePlayEpisode = (seasonNum: number, episodeNum: number) => {
    setSelectedSeasonNumber(seasonNum);
    setSelectedEpisodeNumber(episodeNum);
    setIsPlaying(true);

    if (inShell) {
      setPlayerSeason(seasonNum);
      setPlayerEpisode(episodeNum);
    }
    
    // Keep the user's current server selection — do not override on episode change
    saveWatchProgress();
    // Scroll to player when episode changes (classic layout only)
    if (!inShell) {
      setTimeout(() => {
        if (playerRef.current) {
          if (process.env.NODE_ENV === 'development') {
            console.log('TV Player: Scrolling to player after episode change');
          }
          playerRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          setTimeout(() => {
            if (playerRef.current) {
              const focusableElement = playerRef.current.querySelector(
                'button, [tabindex="0"], iframe, video'
              ) as HTMLElement;
              if (focusableElement) {
                focusableElement.focus({ preventScroll: true });
              }
            }
          }, 500);
        }
      }, 300);
    }
  };

  const handleSeasonSelect = (seasonNum: number) => {
    if (seasonNum !== selectedSeasonNumber) {
      setSelectedSeasonNumber(seasonNum);
      setSeasonData(null);
      setIsLoadingEpisodes(true);
      setIsSeasonDropdownOpen(false);
      setSelectedEpisodeNumber(null); // always reset to ep 1 when changing seasons
      if (!inShell) {
        setIsPlaying(false);
      }
    }
  };

  const handleSourceChange = (index: number) => {
    setSelectedSourceIndex(index);
    setSourceOverrideApplied(false); // User manually changed the source
    if (isPlaying && selectedSeasonNumber !== null && selectedEpisodeNumber !== null) {
      saveWatchProgress();
    }
  };

  const toggleEpisodeInfo = (episodeNum: number) => {
    setInfoEpisode(infoEpisode === episodeNum ? null : episodeNum);
  };

  const currentEpisode = seasonData?.episodes?.find(ep => ep.episode_number === selectedEpisodeNumber);
  const currentSeason = initialSeasons.find(s => s.season_number === selectedSeasonNumber);

  // Format air date to be more readable
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Filter out valid seasons for display
  const validSeasons = initialSeasons.filter(season => season.season_number >= 0);

  const showPlayerLoader = !inShell && isLoadingEpisodes;

  const canRenderPlayer = inShell
    ? playerSeason !== null && playerEpisode !== null
    : Boolean(selectedSeasonNumber && selectedEpisodeNumber);

  const activePlayerSeason = inShell ? playerSeason : selectedSeasonNumber;
  const activePlayerEpisode = inShell ? playerEpisode : selectedEpisodeNumber;

  const panelSeasonEpisodes = (
    <DetailPanelSeasonEpisodes
      validSeasons={validSeasons}
      selectedSeasonNumber={selectedSeasonNumber}
      selectedEpisodeNumber={selectedEpisodeNumber}
      seasonData={seasonData}
      isLoadingEpisodes={isLoadingEpisodes}
      onSeasonSelect={handleSeasonSelect}
      onPlayEpisode={handlePlayEpisode}
    />
  );

  return (
  <div className={inShell ? 'relative w-full' : 'mt-4 relative max-w-7xl mx-auto'}>
    {/* Player Section with glass morphism card */}
    <div id="tv-player-section" className="relative !mb-0" ref={playerRef}>
      <div className="rounded-xl -mb-2 sm:mb-0 overflow-hidden">
        {inShell ? (
          /* Shell: shimmer always holds the space; player layers on top when ready */
          <div className={`relative bg-[#0a0a0a] ${PLAYER_ASPECT_SHELL_CLASS} overflow-hidden`}>
            {/* Shimmer — always mounted so the container never collapses */}
            {!canRenderPlayer && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite]" />
              </div>
            )}
            {canRenderPlayer && (
              <div className="absolute inset-0">
                <MoviePlayer
                  sources={sources}
                  mediaType="tv"
                  mediaId={tvId}
                  title={showTitle}
                  seasonNumber={activePlayerSeason ?? undefined}
                  episodeNumber={activePlayerEpisode ?? undefined}
                  selectedSourceIndex={selectedSourceIndex}
                  setSelectedSourceIndex={handleSourceChange}
                  trailerId={trailerId}
                  likeCount={voteCount}
                  embedded
                  controlsInPanel={isMd}
                  suppressLegacySourceSelector
                />
              </div>
            )}
          </div>
        ) : showPlayerLoader ? (
          <div
            className={`relative bg-gradient-to-r from-gray-900 to-black ${PLAYER_ASPECT_SHELL_CLASS}`}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-transparent border-t-red-500 border-r-red-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-1 w-10 h-10 border-4 border-transparent border-b-purple-500 border-l-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
                </div>
                <div className="text-center">
                  <p className="text-white text-lg font-medium">Loading Episodes...</p>
                  <p className="text-gray-400 text-sm">Preparing your streaming experience</p>
                </div>
              </div>
            </div>
          </div>
        ) : canRenderPlayer ? (
          <MoviePlayer
            sources={sources}
            mediaType="tv"
            mediaId={tvId}
            title={showTitle}
            seasonNumber={activePlayerSeason ?? undefined}
            episodeNumber={activePlayerEpisode ?? undefined}
            selectedSourceIndex={selectedSourceIndex}
            setSelectedSourceIndex={handleSourceChange}
            trailerId={trailerId}
            likeCount={voteCount}
            embedded
          />
        ) : (
          <div
            className={`relative bg-gradient-to-r from-gray-900 to-black ${PLAYER_ASPECT_SHELL_CLASS}`}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <div>
                <Play size={36} className="text-gray-400 mx-auto mb-2 opacity-40" />
                <p className="text-gray-300 text-base font-medium">Select an episode to start watching</p>
                <p className="text-gray-500 text-xs mt-1">Your progress will be saved automatically</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {inShell && seasonsPortalTarget && isMd && createPortal(panelSeasonEpisodes, seasonsPortalTarget)}

    {/* Mobile layout: [Servers dropdown | Seasons] / [Episodes] / [Actions] */}
    {inShell && !isMd && (
      <div className="w-full min-w-0 px-3 pt-2.5 pb-3 flex flex-col gap-2">
        {/* Row: two dropdown buttons side by side */}
        {(() => {
          const activeSeason = validSeasons.find(s => s.season_number === selectedSeasonNumber);
          const btnBase = 'flex items-center justify-center gap-2 h-8 px-4 rounded-full border text-xs font-semibold transition-all duration-200 whitespace-nowrap w-full';
          const btnIdle = { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' };
          const btnActive = { backgroundColor: theme.bgActive, borderColor: `${theme.icon}55`, color: theme.label };
          // Both buttons always glow with theme color
          const glowBtnStyle = (isOpen: boolean) => isOpen
            ? { background: `linear-gradient(135deg, ${theme.bgActive}, rgba(88,28,235,0.25))`, borderColor: `${theme.icon}80`, color: theme.label, boxShadow: `0 0 14px ${theme.icon}50, inset 0 1px 0 rgba(255,255,255,0.1)` }
            : { background: `linear-gradient(135deg, rgba(139,92,246,0.18), rgba(88,28,235,0.10))`, borderColor: `${theme.icon}50`, color: theme.label, boxShadow: `0 0 8px ${theme.icon}30` };
          const serversBtnStyle = glowBtnStyle(serversOpen);
          const seasonsBtnStyle = glowBtnStyle(seasonsOpen);
          const dropPanel = 'absolute top-full left-0 z-30 mt-1.5 min-w-[110px] rounded-xl border border-white/[0.12] bg-[#111111]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl';
          const dropLabel = 'mb-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 block';
          const optionBtn = 'flex items-center gap-1.5 h-7 w-full px-3 rounded-full border text-[10px] font-semibold transition-colors disabled:cursor-default';
          const optIdle = { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)' };
          const optActive = { backgroundColor: theme.bgActive, borderColor: `${theme.icon}55`, color: theme.label };

          return (
            <div className="flex items-center gap-3 w-[80%] mx-auto">
              {/* Servers dropdown */}
              {sources.length > 0 && (
                <div className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => { setServersOpen(v => !v); setSeasonsOpen(false); }}
                    className={`${btnBase} relative overflow-hidden`}
                    style={serversBtnStyle}
                  >
                    {/* Shimmer sweep */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                    <Sparkles className="h-2.5 w-2.5 shrink-0 relative z-10" style={{ color: theme.iconActive }} />
                    <span className="relative z-10">Servers</span>
                    <span className="relative z-10 rounded-full px-1.5 py-0.5 text-[8px] font-bold leading-none" style={{ backgroundColor: `${theme.icon}30`, color: theme.iconActive }}>
                      P{selectedSourceIndex + 1}
                    </span>
                    <ChevronDown className={`h-2.5 w-2.5 shrink-0 relative z-10 transition-transform duration-200 ${serversOpen ? 'rotate-180' : ''}`} style={{ color: theme.iconActive }} />
                  </button>
                  {serversOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setServersOpen(false)} />
                      <div className={dropPanel}>
                        <span className={dropLabel}>Servers</span>
                        <div className="flex flex-col gap-1">
                          {sources.map((_, index) => {
                            const isSel = selectedSourceIndex === index;
                            return (
                              <button key={`dd-src-${index}`} type="button" onClick={() => { if (!isSel) { handleSourceChange(index); setServersOpen(false); } }} className={optionBtn} style={isSel ? optActive : optIdle}>
                                {isSel ? (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: theme.iconActive }} />
                                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: theme.iconActive }} />
                                  </span>
                                ) : (
                                  <Sparkles className="h-2.5 w-2.5 shrink-0" style={{ color: theme.icon }} />
                                )}
                                <span className="flex-1">P{index + 1}</span>
                                {sources[index]?.hasAds && <span className="text-[8px] font-bold uppercase text-amber-400/80">ADS</span>}
                                {isSel && <span className="text-[8px] font-bold uppercase tracking-wide opacity-70">ON</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Seasons dropdown */}
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => { setSeasonsOpen(v => !v); setServersOpen(false); }}
                  className={`${btnBase} relative overflow-hidden`}
                  style={seasonsBtnStyle}
                >
                  {/* Shimmer sweep */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.8s_ease-in-out_0.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                  <Sparkles className="h-2.5 w-2.5 shrink-0 relative z-10" style={{ color: theme.iconActive }} />
                  <span className="relative z-10">Seasons</span>
                  {activeSeason && (
                    <span className="relative z-10 rounded-full px-1.5 py-0.5 text-[8px] font-bold leading-none" style={{ backgroundColor: `${theme.icon}30`, color: theme.iconActive }}>
                      {activeSeason.season_number === 0 ? 'SP' : `S${activeSeason.season_number}`}
                    </span>
                  )}
                  <ChevronDown className={`h-2.5 w-2.5 shrink-0 relative z-10 transition-transform duration-200 ${seasonsOpen ? 'rotate-180' : ''}`} style={{ color: theme.iconActive }} />
                </button>
                {seasonsOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setSeasonsOpen(false)} />
                    <div className={`${dropPanel} max-h-52 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
                      <span className={dropLabel}>Seasons</span>
                      <div className="flex flex-col gap-1">
                        {validSeasons.map((season) => {
                          const isSel = selectedSeasonNumber === season.season_number;
                          const label = season.season_number === 0 ? 'Specials' : `Season ${season.season_number}`;
                          return (
                            <button key={season.season_number} type="button" onClick={() => { handleSeasonSelect(season.season_number); setSeasonsOpen(false); }} disabled={isSel} className={optionBtn} style={isSel ? optActive : optIdle}>
                              {label}
                              {season.episode_count > 0 && <span className="ml-auto text-[9px] opacity-50">{season.episode_count}ep</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Episodes — capped height, scrolls within the box */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Episodes</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => { setMobileViewMode('grid'); localStorage.setItem('episodeViewMode', 'grid'); }}
              title="Grid view"
              className="flex h-5 w-5 items-center justify-center rounded transition-colors"
              style={mobileViewMode === 'grid' ? { color: theme.iconActive } : { color: '#52525b' }}
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
              onClick={() => { setMobileViewMode('list'); localStorage.setItem('episodeViewMode', 'list'); }}
              title="Poster view"
              className="flex h-5 w-5 items-center justify-center rounded transition-colors"
              style={mobileViewMode === 'list' ? { color: theme.iconActive } : { color: '#52525b' }}
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
          <div className="grid grid-cols-5 gap-1 max-h-[112px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.06]" />
            ))}
          </div>
        ) : seasonData?.episodes?.length ? (
          mobileViewMode === 'grid' ? (
            <div className="grid grid-cols-5 gap-1 max-h-[112px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {seasonData.episodes.map((episode) => {
                const isSel = selectedEpisodeNumber === episode.episode_number;
                return (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => handlePlayEpisode(selectedSeasonNumber!, episode.episode_number)}
                    title={episode.name || `Episode ${episode.episode_number}`}
                    className="h-8 flex items-center justify-center rounded-lg border text-[10px] font-bold transition-colors"
                    style={
                      isSel
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
            <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {seasonData.episodes.map((episode) => {
                const isSel = selectedEpisodeNumber === episode.episode_number;
                const stillUrl = episode.still_path ? `${TMDB_IMAGE_BASE_URL}w300${episode.still_path}` : null;
                const airDate = episode.air_date
                  ? new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : null;
                return (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => handlePlayEpisode(selectedSeasonNumber!, episode.episode_number)}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-2 py-1 text-left transition-colors"
                    style={
                      isSel
                        ? { backgroundColor: theme.bgActive, borderColor: `${theme.icon}55` }
                        : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }
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
                      <p className="truncate text-[10px] font-semibold leading-tight" style={{ color: isSel ? theme.iconActive : '#e4e4e7' }}>
                        {episode.name || `Episode ${episode.episode_number}`}
                      </p>
                      {airDate && <p className="mt-0.5 text-[9px] text-zinc-500">{airDate}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <p className="text-[10px] text-zinc-500">No episodes for this season</p>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-1.5 sm:gap-3 pt-2 border-t border-white/[0.06]">
          <DownloadButton
            mediaType="tv"
            mediaId={tvId}
            seasonNumber={selectedSeasonNumber ?? undefined}
            episodeNumber={selectedEpisodeNumber ?? undefined}
            showLabel
            className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out [&_svg]:!h-4 [&_svg]:!w-4 [&_svg]:shrink-0 [&_span]:text-xs [&_span]:sm:text-sm [&_span]:font-medium"
          />
          <button
            type="button"
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) navigator.share({ title: showTitle, url });
              else navigator.clipboard?.writeText(url);
            }}
            className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">Share</span>
          </button>
          <button
            type="button"
            onClick={handleWatchlistToggle}
            className={`relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl backdrop-blur-md border font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out ${isInWatchlistNow ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30' : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'}`}
          >
            {isInWatchlistNow ? <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> : <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
            <span className="text-xs sm:text-sm font-medium">{isInWatchlistNow ? 'Saved' : 'Save'}</span>
          </button>
          {trailerId && (
            <YouTubeComments
              videoId={trailerId}
              likeCount={voteCount}
              inline
            />
          )}
        </div>
      </div>
    )}

    {/* Season & Episode Selection — classic main column only */}
    {!inShell && (
    <div className="mb-4 sm:mb-12">
      {/* Modern Horizontal Season Selector with Navigation Arrows */}
      <div className="mb-4 sm:mb-8">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white">Seasons</h3>
          
          {/* Toggle Button with modern styling */}
          <button
            onClick={() => setDisplayAsNumbers(!displayAsNumbers)}
            className="p-2 rounded-full bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-white hover:bg-blue-600/40 transition-all"
            aria-label={displayAsNumbers ? 'Show episode posters' : 'Show episode numbers'}
          >
            {displayAsNumbers ? (
              <Grid size={18} />
            ) : (
              <ListIcon size={18} />
            )}
          </button>
        </div>
        
        {/* Scrollable Season Bar with Navigation Arrows */}
        <div className="relative">
          {/* Left Arrow Button */}
          <button 
            onClick={scrollSeasonsLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-blue-600/40 transition-all ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-label="Scroll seasons left"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          {/* Scrollable Season Container */}
          <div 
            className="min-w-0 max-w-full overflow-x-auto px-10 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" 
            ref={seasonScrollRef}
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex space-x-3 py-2">
              {validSeasons.map(season => (
                <button
                  key={season.season_number}
                  data-season={season.season_number}
                  onClick={() => handleSeasonSelect(season.season_number)}
                  className={`
                    flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300
                    ${selectedSeasonNumber === season.season_number 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                      : 'bg-gray-800/50 backdrop-blur-sm border border-white/10 hover:border-blue-400/30 text-gray-300 hover:text-white'}
                  `}
                >
                  <div className="flex flex-col items-center whitespace-nowrap">
                    <span className="font-medium text-sm sm:text-base">
                      {season.name || `Season ${season.season_number}`}
                    </span>
                    <span className="text-[10px] sm:text-xs mt-1 opacity-80">
                      {season.episode_count} episodes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Arrow Button */}
          <button 
            onClick={scrollSeasonsRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-blue-600/40 transition-all ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-label="Scroll seasons right"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Episode Display */}
      {isLoadingEpisodes ? (
        <div className="py-12 sm:py-16 flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-400/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : seasonData?.episodes?.length ? (
        displayAsNumbers ? (
          // Numbered Buttons View - Improved for Mobile
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-4 max-h-[320px] overflow-y-auto overscroll-contain">
            {seasonData.episodes.map(episode => (
              <button
                key={episode.id}
                onClick={() => handlePlayEpisode(selectedSeasonNumber!, episode.episode_number)}
                className={`
                  relative w-full aspect-square rounded-xl flex items-center justify-center
                  ${selectedEpisodeNumber === episode.episode_number 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/50 scale-105' 
                    : 'bg-black/40 backdrop-blur-sm border border-white/10 hover:border-blue-400/30 hover:scale-105'}
                  transition-all duration-300 focus:outline-none group
                `}
              >
                <span className="font-bold text-lg sm:text-xl z-10 group-hover:text-blue-200">
                  {episode.episode_number}
                </span>
                {selectedEpisodeNumber === episode.episode_number && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full">
                    <Play size={10} className="fill-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          // Poster View - Improved for Mobile (2 per row)
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 max-h-[560px] overflow-y-auto overscroll-contain">
            {seasonData.episodes.map(episode => (
              <div 
                key={episode.id}
                className={`
                  relative overflow-hidden group transition-all duration-500 ease-out
                  ${selectedEpisodeNumber === episode.episode_number 
                    ? 'ring-2 ring-blue-500 shadow-xl scale-[1.01]' 
                    : 'hover:shadow-xl hover:scale-[1.02]'}
                `}
              >
                <div 
                  className="relative h-32 sm:h-48 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => handlePlayEpisode(selectedSeasonNumber!, episode.episode_number)}
                >
                  {/* Episode Thumbnail */}
                  {episode.still_path ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE_URL}w500${episode.still_path}`}
                      alt={`Episode ${episode.episode_number}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="text-gray-500 text-xs sm:text-sm">No Preview</span>
                    </div>
                  )}
                  
                  {/* Dark overlay and gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80"></div>
                  
                  {/* Episode Indicator */}
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex items-center">
                    <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-white/10">
                      Ep {episode.episode_number}
                    </div>
                  </div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-blue-500/90 rounded-full p-2 sm:p-3 transform transition-transform duration-500 scale-0 group-hover:scale-100 shadow-lg">
                      <Play size={16} className="fill-white text-white" />
                    </div>
                  </div>
                  
                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-3">
                    <h4 className="font-medium text-white text-xs sm:text-base line-clamp-1">
                      {episode.name || `Episode ${episode.episode_number}`}
                    </h4>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                      {episode.runtime && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-300">
                          <Clock size={8} className="text-blue-400" />
                          <span>{episode.runtime}m</span>
                        </div>
                      )}
                      {episode.air_date && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-300 hidden sm:flex">
                          <Calendar size={8} className="text-blue-400" />
                          <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Episode Info Toggle and Panel */}
                <div className="mt-1 sm:mt-2 flex justify-between items-center">
                  <button 
                    onClick={() => toggleEpisodeInfo(episode.episode_number)}
                    className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Info size={10} className="sm:w-12" />
                    <span>Details</span>
                  </button>
                  
                  {episode.vote_average > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs bg-black/30 rounded-full px-1.5 sm:px-2 py-0.5">
                      <Star size={10} className="text-yellow-400" />
                      <span className="text-gray-200">{episode.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                {/* Expandable Episode Description */}
                {infoEpisode === episode.episode_number && episode.overview && (
                  <div className="mt-1 sm:mt-2 p-1 sm:p-3 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
                    <p className="text-[10px] sm:text-sm text-gray-300">{episode.overview}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="py-8 sm:py-16 text-center">
          <p className="text-gray-400 text-base sm:text-lg">No episodes available for this season.</p>
        </div>
      )}
    </div>
    )}
  </div>
);
};

export default SeasonEpisodeBrowser;