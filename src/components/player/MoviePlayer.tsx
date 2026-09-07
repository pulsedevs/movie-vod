'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StreamSource, MediaItem } from '@/types';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import YouTubeComments from '@/components/movie/YouTubeComments';
import { useHybridData } from '@/hooks/useHybridData';
import { useMobilePlayerOptimization } from '@/hooks/useMobilePlayerOptimization';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { normalizeId } from '@/lib/utils';
import dynamic from 'next/dynamic';
const WatchPartyButton = dynamic(() => import('@/components/watchParty/WatchPartyButton'), { ssr: false });
const AdToIframePlayer = dynamic(() => import('./AdToIframePlayer'), { ssr: false });
import { StreamIframe, TransitionStreamIframe } from './StreamIframe';
import { buildStreamEmbedUrlForPlayer } from '@/utils/streamEmbedUrl';
import DownloadButton from './DownloadButton';
import DesktopDiscordButton from '@/components/home/v2/DesktopDiscordButton';
import HeaderAdToggle from '@/components/ads/HeaderAdToggle';
import DetailPlayerPanelControls from '@/components/detail/v2/DetailPlayerPanelControls';
import { DETAIL_PLAYER_PANEL_PORTAL_ID } from '@/utils/detailPanel';



interface MoviePlayerProps {
  sources: StreamSource[];
  mediaType: 'movie' | 'tv';
  mediaId: string | number;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  selectedSourceIndex: number;
  setSelectedSourceIndex: (index: number) => void;
  trailerId?: string;           // Optional YouTube trailer ID for comments
  likeCount?: number;           // Optional like count for YouTube comments
  hideVideoPlayer?: boolean;    // Hide the iframe player (for when 4K player is shown instead)
  is4KAvailable?: boolean;      // Whether 4K is available for this content
  is4KSelected?: boolean;       // Whether 4K mode is currently selected
  onToggle4K?: () => void;      // Callback to toggle 4K mode
  /** Omit outer page margins when nested (e.g. TV season browser) to avoid CLS from double spacing */
  embedded?: boolean;
  /** Move server grid + action buttons into the v2 right panel via portal */
  controlsInPanel?: boolean;
  /** Suppress the legacy golden source selector — used when the parent manages its own server UI */
  suppressLegacySourceSelector?: boolean;
}

const MoviePlayer: React.FC<MoviePlayerProps> = ({
  sources = [],
  mediaType,
  mediaId,
  title,
  poster_path,
  backdrop_path,
  seasonNumber,
  episodeNumber,
  selectedSourceIndex,
  setSelectedSourceIndex,
  trailerId,
  likeCount,
  hideVideoPlayer = false,
  is4KAvailable = false,
  is4KSelected = false,
  onToggle4K,
  embedded = false,
  controlsInPanel = false,
  suppressLegacySourceSelector = false,
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering MoviePlayer with props:', { sources, mediaType, mediaId, title, seasonNumber, episodeNumber });
  }
  
  // Mobile player optimization hook
  const { dimensions, isMobile, orientation } = useMobilePlayerOptimization();
  
  const [error, setError] = useState<string | null>(null);
  const [panelPortalTarget, setPanelPortalTarget] = useState<HTMLElement | null>(null);
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsMd(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const sourceScrollRef = useRef<HTMLDivElement>(null);  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);
  // const [showDonateModal, setShowDonateModal] = useState(false); // Commented out - may need in future
  const { addToWatchlist, isInWatchlist, removeFromWatchlist, isLoading: isWatchlistLoading } = useHybridData();
  
  // Local state for immediate UI feedback
  const [isProcessingWatchlist, setIsProcessingWatchlist] = useState(false);
  
  // Store the watchlist state in a local component state to prevent it from changing during renders
  const [isItemInWatchlist, setIsItemInWatchlist] = useState(false);
  
  // When watchlist is loaded, check and store the item's watchlist status
  useEffect(() => {
    if (!isWatchlistLoading) {
      const inWatchlist = isInWatchlist(mediaId, mediaType);
      if (process.env.NODE_ENV === 'development') {
        console.log('🎬 Setting cached watchlist state:', { 
          mediaId, 
          mediaIdNormalized: normalizeId(mediaId),
          mediaType, 
          inWatchlist,
          currentState: isItemInWatchlist
        });
      }
      
      // Only update if different to avoid unnecessary re-renders
      if (inWatchlist !== isItemInWatchlist) {
        setIsItemInWatchlist(inWatchlist);
      }
    }
  }, [isWatchlistLoading, mediaId, mediaType, isInWatchlist, isItemInWatchlist]);
  
  // Update local state whenever the watchlist action completes
  useEffect(() => {
    if (!isProcessingWatchlist && !isWatchlistLoading) {
      const currentStatus = isInWatchlist(mediaId, mediaType);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Updating cached state after action:', { 
          mediaId, 
          mediaIdNormalized: normalizeId(mediaId),
          mediaType, 
          currentStatus,
          previousState: isItemInWatchlist
        });
      }
      
      // Only update if different to avoid unnecessary re-renders
      if (currentStatus !== isItemInWatchlist) {
        setIsItemInWatchlist(currentStatus);
      }
    }
  }, [isProcessingWatchlist, isWatchlistLoading, mediaId, mediaType, isInWatchlist, isItemInWatchlist]);
  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🎬 MoviePlayer watchlist state:', {
      mediaId,
      mediaType,
      isWatchlistLoading,
      isItemInWatchlist,
      fromHook: !isWatchlistLoading && isInWatchlist(mediaId, mediaType),
      isProcessingWatchlist
    });
  }

  // Add share functionality
  const handleShare = async () => {
    try {
      const shareData = {
        title: title ? `Watch ${title}` : 'Watch now',
        text: mediaType === 'movie' 
          ? `Check out this movie: ${title}` 
          : `Check out this TV show: ${title}${seasonNumber ? ` S${seasonNumber}` : ''}${episodeNumber ? ` E${episodeNumber}` : ''}`,
        url: window.location.href,
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
        if (process.env.NODE_ENV === 'development') {
          console.log('Content shared successfully');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Web Share API not supported');
        }
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} - ${window.location.href}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing content:', err);
    }
  };

  const handleWatchlistToggle = async () => {
    if (isProcessingWatchlist || isWatchlistLoading) return;

    setIsProcessingWatchlist(true);
    try {
      if (isItemInWatchlist) {
        removeFromWatchlist(mediaId, mediaType);
        setIsItemInWatchlist(false);
      } else {
        const mediaItem: MediaItem = {
          id: typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId,
          media_type: mediaType,
          title: mediaType === 'movie' ? title : '',
          name: mediaType === 'tv' ? title : '',
          poster_path: poster_path || null,
          backdrop_path: backdrop_path || null,
          vote_average: 0,
          release_date: '',
          first_air_date: '',
          overview: '',
        };
        await addToWatchlist(mediaItem);
        setIsItemInWatchlist(true);
      }
    } finally {
      setIsProcessingWatchlist(false);
    }
  };

  useEffect(() => {
    if (!controlsInPanel || !isMd) {
      setPanelPortalTarget(null);
      return;
    }
    const mount = () => {
      setPanelPortalTarget(document.getElementById(DETAIL_PLAYER_PANEL_PORTAL_ID));
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [controlsInPanel, isMd]);

  const availableSources = useMemo(() => {
    if (!sources || sources.length === 0) {
      return [];
    }    const buildUrl = (source: StreamSource): string => {
      if (!mediaId) return '';
      const url = buildStreamEmbedUrlForPlayer(source, mediaType, mediaId, seasonNumber, episodeNumber);
      if (!url) {
        console.warn(`Could not build URL for source: ${source.name}, mediaType: ${mediaType}`);
      }
      return url;
    };

    return sources
      .map((source) => ({
        name: source.name,
        url: buildUrl(source),
        hasAds: source.hasAds ?? false,
      }))
      .filter((source) => source.url);
  }, [sources, mediaId, mediaType, seasonNumber, episodeNumber]);

  const [currentSrc, setCurrentSrc] = useState<string>('');
  // pageLoaded defers the iframe mount until after window.load so the embed's
  // heavy 3rd-party JS doesn't compete with LCP/FCP for bandwidth.
  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    if (document.readyState === 'complete') {
      setPageLoaded(true);
    } else {
      const onLoad = () => setPageLoaded(true);
      window.addEventListener('load', onLoad, { once: true });
      // Hard fallback: never wait longer than 3 s
      const t = setTimeout(() => setPageLoaded(true), 3000);
      return () => { window.removeEventListener('load', onLoad); clearTimeout(t); };
    }
  }, []);

  useEffect(() => {
    if (availableSources.length > 0) {
      const validIndex = selectedSourceIndex < availableSources.length ? selectedSourceIndex : 0;
      const sourceUrl = availableSources[validIndex]?.url || '';

      if (sourceUrl) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Setting source at index ${validIndex}:`, sourceUrl);
        }
        setCurrentSrc(sourceUrl);

        setError(null);
      } else {
        console.error('Invalid source URL');
        setError('Invalid source URL');
        setCurrentSrc('');
      }
    } else {
      console.log('No available sources to set URL.');
      setCurrentSrc('');
      if (sources.length > 0) {
        setError('Could not generate valid URLs from the available sources');
      }
    }
  }, [availableSources, selectedSourceIndex, sources, mediaId, mediaType, title]);

  // Handle scrolling indicators
  useEffect(() => {
    const handleScroll = () => {
      if (sourceScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sourceScrollRef.current;
        setShowLeftShadow(scrollLeft > 0);
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
      }
    };

    const scrollContainer = sourceScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [availableSources]);

  // Scroll selected source into view when changed
  useEffect(() => {
    if (sourceScrollRef.current) {
      const selectedSourceElement = sourceScrollRef.current.querySelector(`[data-source-index="${selectedSourceIndex}"]`);
      if (selectedSourceElement) {
        selectedSourceElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedSourceIndex]);  const handleSourceChange = (url: string, index: number) => {
    if (!url) {
      console.error('Attempted to change to an empty source URL');
      return;
    }
    console.log(`Changing source to index ${index}:`, url);
    setSelectedSourceIndex(index);
    
    // Turn off 4K mode when switching to a premium source
    if (is4KSelected && onToggle4K) {
      onToggle4K();
    }
    
    // Use direct URLs for all trusted domains
    setCurrentSrc(url);
  };

  // Scroll buttons functionality
  const scrollLeft = () => {
    if (sourceScrollRef.current) {
      sourceScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sourceScrollRef.current) {
      sourceScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  if (error) {
    return (
      <div className="text-center text-red-500 my-2 md:my-4 p-2 md:p-4 -mx-4 md:mx-0">
        <p>Error: {error}</p>
        <p>Please try again later or choose a different source.</p>
      </div>
    );
  }

  if (!availableSources || availableSources.length === 0) {
    return (
      <div className="text-center text-gray-500 my-2 md:my-4 p-2 md:p-4 -mx-4 md:mx-0">
        <p>No streaming sources available.</p>
      </div>
    );
  }
  const rootShellClass = embedded
    ? 'm-0 p-0 w-full max-w-full'
    : 'my-4 md:my-8 p-0 md:p-4 -mx-4 md:mx-0';

  const playerShellClass = `${dimensions.className}${
    embedded ? ' overflow-hidden bg-[#0a0a0a]' : ''
  }${controlsInPanel ? ' mb-0' : ' mb-2 md:mb-4'}`;

  const StreamPlayer = embedded || controlsInPanel ? TransitionStreamIframe : StreamIframe;

  return (
    <ErrorBoundary fallback={<div className="text-center text-red-500">Failed to load the player. Please try again later.</div>}>      <div className={rootShellClass}>        {/* Show video player only when hideVideoPlayer is false */}
        {currentSrc && !hideVideoPlayer && (
          <>
            <div className={`relative ${playerShellClass}`}>
              {/* Join Discord + Disable ads — top-right inside the player (desktop) */}
              <div className="hidden md:flex absolute top-2 right-2 z-20 items-center gap-2">
                <DesktopDiscordButton />
                <HeaderAdToggle />
              </div>
              {!pageLoaded ? (
                /* Skeleton shown while deferring iframe to let LCP complete */
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] md:rounded-lg">
                  <div className="w-9 h-9 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
                </div>
              ) : (() => {
                try {
                  // Check if VAST ads are enabled via environment variable
                  const vastAdsEnabled = process.env.NEXT_PUBLIC_VAST_ADS_ENABLED === 'true';
                  const vastUrl = process.env.NEXT_PUBLIC_EXOCLICK_VAST_TAG;

                  if (vastAdsEnabled && vastUrl && !controlsInPanel) {
                    // Use ad-to-iframe player for pre-roll ads
                    return (
                      <AdToIframePlayer
                        vastUrl={vastUrl}
                        iframeUrl={currentSrc}
                        title={title ? `${title} Player (${mediaType})` : 'Stream Player'}
                      />
                    );
                  }

                  // Crossfade embed when switching episodes in the v2 shell
                  return (
                    <StreamPlayer
                      src={currentSrc}
                      title={title ? `${title} Player (${mediaType})` : 'Stream Player'}
                      className="absolute top-0 left-0 w-full h-full md:rounded-lg shadow-xl"
                    />
                  );
                } catch (error) {
                  console.error('Failed to create player:', error);
                  return (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
                      <div className="text-center text-white p-4">
                        <p className="text-red-400 mb-2">Failed to load player</p>
                        <p className="text-sm text-gray-300">
                          {error instanceof Error ? error.message : 'Unknown error occurred'}
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {!controlsInPanel && !suppressLegacySourceSelector && (
            <div className="flex justify-center gap-1.5 sm:gap-3 md:gap-4 lg:gap-5 mb-4 md:mb-6 px-2 md:px-2" style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* 4K Ultra Button - Show when 4K is available but not selected */}
              {is4KAvailable && !is4KSelected && (
                <div className="flex-shrink-0">
                  <button
                    onClick={onToggle4K}
                    className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 text-blue-300 font-semibold shadow-lg hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group"
                    title="Switch to 4K Ultra HD streaming"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                    </svg>
                    <span className="hidden sm:inline text-xs sm:text-sm font-medium">4K Ultra</span>
                  </button>
                </div>
              )}

              {/* Download Button */}
              <div className="flex-shrink-0">
                <DownloadButton mediaType={mediaType} mediaId={mediaId} seasonNumber={seasonNumber} episodeNumber={episodeNumber} />
              </div>

              {/* Share Button */}
              <div className="flex-shrink-0">                <button
                  onClick={handleShare}                  
                  className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group"
                  title="Share this content"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline text-xs sm:text-sm font-medium">Share</span>
                </button>
              </div>              {/* Save to Watchlist Button */}
              <div className="flex-shrink-0">                
                <button                  onClick={async () => {
                    if (isProcessingWatchlist || isWatchlistLoading) return; // Prevent double clicks and wait for loading
                    
                    setIsProcessingWatchlist(true);
                    if (process.env.NODE_ENV === 'development') {
                      console.log('🔘 Button clicked:', { 
                        mediaId, 
                        mediaType, 
                        currentStatus: isItemInWatchlist,
                        hookStatus: isInWatchlist(mediaId, mediaType)
                      });
                    }
                    
                    try {
                      if (isItemInWatchlist) {
                        if (process.env.NODE_ENV === 'development') {
                          console.log('🗑️ Removing item from watchlist:', { mediaId, mediaType });
                        }
                        removeFromWatchlist(mediaId, mediaType);
                        // Force immediate UI update
                        setIsItemInWatchlist(false);
                      } else {
                        const mediaItem: MediaItem = {
                          id: typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId,
                          media_type: mediaType,
                          title: mediaType === 'movie' ? title : '', // Empty string for TV shows
                          name: mediaType === 'tv' ? title : '', // Empty string for movies
                          poster_path: poster_path || null,
                          backdrop_path: backdrop_path || null,
                          vote_average: 0,
                          release_date: '',
                          first_air_date: '',
                          overview: ''
                        };
                        await addToWatchlist(mediaItem);
                        setIsItemInWatchlist(true);
                      }
                    } finally {
                      setIsProcessingWatchlist(false);
                    }
                  }}
                  disabled={isProcessingWatchlist || isWatchlistLoading}
                  className={`relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl backdrop-blur-md border font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group disabled:opacity-50
                  ${isItemInWatchlist 
                    ? 'bg-green-500/20 border-green-400/30 text-green-300 hover:bg-green-500/30 hover:border-green-400/50' 
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'}`}
                  title={isWatchlistLoading ? 'Loading...' : isItemInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {isProcessingWatchlist || isWatchlistLoading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isItemInWatchlist ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  )}                  <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                    {isProcessingWatchlist ? 'Processing...' : isWatchlistLoading ? 'Loading...' : isItemInWatchlist ? 'Saved' : 'Save'}
                  </span>                </button>
              </div>              {/* Watch Party Button */}
              <WatchPartyButton
                mediaId={mediaId}
                mediaType={mediaType}
                title={title}
                posterPath={null}
                seasonNumber={seasonNumber}
                episodeNumber={episodeNumber}
                currentVideoUrl={currentSrc}
                selectedSourceIndex={selectedSourceIndex}
              />              {/* Comments Button (LAST) */}
              {trailerId && (
                <div className="flex-shrink-0">
                  <YouTubeComments
                    videoId={trailerId}
                    likeCount={likeCount}
                    inline={true}
                    showLikes={false}
                  />
                </div>
              )}

              {/* Support Our Project Button - Enhanced with visual effects (COMMENTED OUT - MAY NEED IN FUTURE) */}
              {/* 
              <div className="flex-shrink-0 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-lg sm:rounded-xl blur opacity-60 group-hover:opacity-80 transition duration-1000 animate-pulse"></div>
                
                <button
                  onClick={() => setShowDonateModal(true)}
                  className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-md border border-pink-400/30 text-pink-300 font-semibold shadow-lg hover:from-pink-500/30 hover:via-purple-500/30 hover:to-blue-500/30 hover:border-pink-400/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out"
                  title="Support our project with a donation"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 animate-pulse group-hover:scale-110 transition-transform duration-300"
                    >
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '500ms' }}></div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent group-hover:from-pink-300 group-hover:via-purple-300 group-hover:to-blue-300 transition-all duration-300">Support</span>
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-spin group-hover:animate-pulse transition-all duration-300"
                      style={{ animationDuration: '3s' }}
                    >
                      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544L10.5 8.5l3.456.779a.75.75 0 010 1.442L10.5 11.5l-.779 3.456a.75.75 0 01-1.442 0L7.5 11.5l-3.456-.779a.75.75 0 010-1.442L7.5 8.5l.779-3.456A.75.75 0 019 4.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>              </div>
              */}
            </div>
            )}
          </>
        )}
        
        {/* Show fallback message only when no sources available and video player is not hidden */}
        {!currentSrc && !hideVideoPlayer && (
          <div className="border border-dashed border-gray-600 p-4 md:p-8 rounded-none md:rounded bg-gray-900 mb-2 md:mb-4">
            <p className="text-center text-gray-500">No streaming sources available or configured correctly.</p>
          </div>
        )}

        {/* Enhanced Source Selector with Navigation Controls — non-shell only */}
        {!controlsInPanel && !suppressLegacySourceSelector && (availableSources.length > 0 || is4KAvailable) && (
          <div className="mb-2 md:mb-4 mx-1 md:mx-0">
            
            <div className="relative">
              {/* Left Scroll Button - only shown when needed */}
              {showLeftShadow && (                <button 
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/3 -translate-y-1/2 z-10 pr-4 sm:pr-6 pl-0 sm:pl-1 py-6 sm:py-8 flex items-center justify-center group"
                  aria-label="Scroll left"
                >
                  <div className="bg-gray-800/90 hover:bg-blue-600/90 rounded-full p-1 sm:p-1.5 transition-colors duration-200 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </div>
                </button>
              )}
              
              {/* Right Scroll Button - only shown when needed */}
              {showRightShadow && (                <button 
                  onClick={scrollRight}
                  className="absolute right-0 top-1/3 -translate-y-1/2 z-10 pl-4 sm:pl-6 pr-0 sm:pr-1 py-6 sm:py-8 flex items-center justify-center group"
                  aria-label="Scroll right"
                >
                  <div className="bg-gray-800/90 hover:bg-blue-600/90 rounded-full p-1 sm:p-1.5 transition-colors duration-200 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              )}
              
              {/* Shadow overlay indicators */}
              {showLeftShadow && (
                <div className="absolute left-0 top-0 bottom-0 w-16  z-0 pointer-events-none"></div>
              )}
              {showRightShadow && (
                <div className="absolute right-0 top-0 bottom-0 w-16 z-0 pointer-events-none"></div>
              )}
                {/* Scrollable container */}              <div 
                ref={sourceScrollRef}
                className="overflow-x-auto pb-2 md:pb-4 scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',  /* Firefox */
                  msOverflowStyle: 'none',  /* IE and Edge */
                  scrollBehavior: 'smooth'
                }}
              >                <div className="flex justify-center space-x-2 sm:space-x-3 px-1 py-2 sm:py-3 min-w-min">
                  {availableSources.map((source, index) => {
                    const isPremium = true; // Set ALL sources as premium
                    const displayName = `Premium ${index + 1}`; // Always show "Premium" naming
                    
                    return (<button
                        key={`source-${index}`}
                        data-source-index={index}
                        onClick={() => handleSourceChange(source.url, index)}
                        disabled={(selectedSourceIndex === index && !is4KSelected) || !source.url}
                        className={`
                          flex-shrink-0 px-1 py-1 sm:px-1.5 sm:py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2.5 rounded sm:rounded-md transition-all duration-300 relative overflow-hidden
                          ${(selectedSourceIndex === index && !is4KSelected)
                            ? isPremium
                              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/50 ring-2 ring-yellow-300/50 scale-105 relative z-10' 
                              : 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 relative z-10'
                            : isPremium
                              ? 'bg-gradient-to-r from-amber-600/70 via-orange-600/70 to-yellow-600/70 backdrop-blur-sm border border-amber-400/40 hover:border-orange-400/60 text-amber-100 hover:text-white hover:from-amber-500/80 hover:via-orange-500/80 hover:to-yellow-500/80'
                              : 'bg-gray-800/70 backdrop-blur-sm border border-white/10 hover:border-blue-400/30 text-gray-300 hover:text-white hover:bg-gray-700/80'}
                          ${process.env.NODE_ENV === 'development' && process.env[`NEXT_PUBLIC_STREAM_SOURCE_OVERRIDE_${mediaType.toUpperCase()}_${mediaId}`] === index.toString() 
                            ? 'ring-2 ring-yellow-500' : ''}
                        `}
                      >
                        {/* Premium sparkle effect */}
                        {isPremium && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
                        )}                        <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 lg:gap-1.5 whitespace-nowrap relative z-10">                          {(selectedSourceIndex === index && !is4KSelected) ? (
                            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-60" />
                              <span className="relative inline-flex rounded-full h-full w-full bg-black opacity-80" />
                            </span>
                          ) : isPremium ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 flex-shrink-0 text-yellow-300">
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 flex-shrink-0">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                          )}
                          
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium hidden sm:inline">
                            {displayName}
                            {isPremium && <span className="ml-0.5 text-[5px] sm:text-[6px] md:text-[7px] lg:text-[8px] font-bold px-0.5 py-0.5 bg-green-500 text-white rounded-full animate-pulse">⚡</span>}
                            {process.env.NODE_ENV === 'development' && 
                             process.env[`NEXT_PUBLIC_STREAM_SOURCE_OVERRIDE_${mediaType.toUpperCase()}_${mediaId}`] === index.toString() && 
                             <span className="ml-0.5 text-[6px] sm:text-[7px] font-bold px-0.5 py-0.5 bg-yellow-500 text-black rounded-full">ENV</span>}
                          </span>                          <span className="text-[8px] sm:text-[9px] font-medium sm:hidden">
                            Premium {index + 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>          </div>
        )}

        {/* PayPal Donation Modal - Mobile-friendly version (COMMENTED OUT - MAY NEED IN FUTURE) */}
        {/*
        {showDonateModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 transition-all duration-300">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDonateModal(false)}
            />
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[92%] sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-100">
              <button
                onClick={() => setShowDonateModal(false)}
                className="absolute top-3 right-3 p-2.5 hover:bg-gray-800/80 active:bg-gray-700 rounded-full transition-colors z-10 touch-manipulation"
                aria-label="Close donation modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hover:text-white">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div className="p-5 sm:p-6 pb-3 sm:pb-4 text-center">
                <div className="mb-3 sm:mb-4">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                    >
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Support Our Project</h2>
                  <p className="text-gray-300 text-sm px-2 sm:px-0">
                    Help us keep this service free and running! Your donation helps cover server costs and development.
                  </p>
                </div>
              </div>
              <div className="px-4 sm:px-6 pb-5 sm:pb-6">
                <div className="bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="text-center">
                    <a
                      href="https://www.paypal.com/ncp/payment/ZLJH6CUF3MWGY"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-flex items-center justify-center w-full py-2.5 sm:py-4 px-3 sm:px-8 bg-gradient-to-r from-blue-600 via-[#0070ba] to-blue-700 hover:from-blue-500 hover:via-[#005ea6] hover:to-blue-600 active:from-blue-700 active:via-[#00457a] active:to-blue-800 text-white font-bold text-sm sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg touch-manipulation"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-[#0070ba]/20 to-blue-400/20 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-8 sm:h-8 mr-1.5 sm:mr-3 fill-current relative z-10">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.818.934 1.175 2.063 1.074 3.507z"/>
                      </svg>
                      <span className="relative z-10 group-hover:scale-105 transition-transform duration-200">
                        <span className="sm:hidden">Donate</span>
                        <span className="hidden sm:inline">Donate via PayPal</span>
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-6 sm:h-6 ml-1.5 sm:ml-3 relative z-10 group-hover:translate-x-1 transition-transform duration-200">
                        <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06L19.19 12l-2.47-2.47a.75.75 0 010-1.06zM1.25 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H2a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1 h-1 sm:w-2 sm:h-2 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-0.5 h-0.5 sm:w-1.5 sm:h-1.5 bg-blue-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '700ms' }}></div>
                    </a>
                  </div>
                </div>
                <div className="text-center text-xs sm:text-sm text-gray-400 space-y-1.5 px-1">
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <p>Secure payment via PayPal</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    <p>Every contribution helps us improve</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    <p>Thank you for your support!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>        )}
        */}
        {/* Mobile shell: render panel-style controls inline below player */}
        {controlsInPanel && !isMd && (availableSources.length > 0 || is4KAvailable) && (
          <div className="px-3 pt-3 pb-1">
            <DetailPlayerPanelControls
              inline
              availableSources={availableSources}
              selectedSourceIndex={selectedSourceIndex}
              is4KSelected={is4KSelected}
              onSourceChange={handleSourceChange}
              is4KAvailable={is4KAvailable}
              onToggle4K={onToggle4K}
              mediaType={mediaType}
              mediaId={mediaId}
              title={title}
              trailerId={trailerId}
              likeCount={likeCount}
              onShare={handleShare}
              isItemInWatchlist={isItemInWatchlist}
              isProcessingWatchlist={isProcessingWatchlist}
              isWatchlistLoading={isWatchlistLoading}
              onWatchlistToggle={handleWatchlistToggle}
            />
          </div>
        )}

        {controlsInPanel &&
          isMd &&
          panelPortalTarget &&
          createPortal(
            <DetailPlayerPanelControls
              availableSources={availableSources}
              selectedSourceIndex={selectedSourceIndex}
              is4KSelected={is4KSelected}
              onSourceChange={handleSourceChange}
              is4KAvailable={is4KAvailable}
              onToggle4K={onToggle4K}
              mediaType={mediaType}
              mediaId={mediaId}
              title={title}
              trailerId={trailerId}
              likeCount={likeCount}
              onShare={handleShare}
              isItemInWatchlist={isItemInWatchlist}
              isProcessingWatchlist={isProcessingWatchlist}
              isWatchlistLoading={isWatchlistLoading}
              onWatchlistToggle={handleWatchlistToggle}
            />,
            panelPortalTarget
          )}
      </div>
    </ErrorBoundary>
  );
};

// Add this to your global CSS or component-level styles
// .scrollbar-hide::-webkit-scrollbar {
//   display: none;
// }

export default MoviePlayer;