'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import MoviePlayer from '@/components/player/MoviePlayer';
import LemurVodPlayer from '@/components/player/LemurVodPlayer';
import dynamic from 'next/dynamic';
const FourKPlayer = dynamic(() => import('@/components/player/FourKPlayer'), { ssr: false });
import { StreamSource } from '@/types';
import { getMovieSourceIndex, getTvSourceIndex } from '@/utils/sourceOverride';
import useRemoteSourceOverrides from '@/hooks/useRemoteSourceOverrides';
import { StreamingSourcesLoading, MoviePlayerLoading } from '@/components/common/StreamingLoading';
import { writeContinueWatching } from '@/utils/libraryStorage';

interface MoviePlayerWrapperProps {
  sources: StreamSource[];
  mediaType: 'movie' | 'tv';
  mediaId: string | number;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;  // Add backdrop for hero-style poster
  trailerId?: string;          // Optional YouTube trailer ID for comments
  imdbId?: string;            // IMDB ID for subtitle search
  year?: number;              // Release year for subtitle search
  initialSourceIndex?: number; // Optional initial source index (e.g., from URL parameter)
  embedded?: boolean;
  disableAutoScroll?: boolean;
  controlsInPanel?: boolean;
}

const MoviePlayerWrapper: React.FC<MoviePlayerWrapperProps> = (props) => {
  const { sources = [], embedded = false, disableAutoScroll = false, controlsInPanel = false } = props;
  const playerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);
  
  // Firebase Remote Config integration
  const { 
    config: remoteConfig, 
    loading: configLoading,
    isMovieAvailableIn4K,
    isTvShowAvailableIn4K,
    get4KMovieUrl,
    get4KTvEpisodeUrl
  } = useRemoteSourceOverrides();

  // Check if 4K content is available
  const is4KAvailable = props.mediaType === 'movie' 
    ? isMovieAvailableIn4K(props.mediaId)
    : isTvShowAvailableIn4K(props.mediaId);

  const fourKUrl = props.mediaType === 'movie' 
    ? get4KMovieUrl(props.mediaId)
    : null; // For TV shows, we'll need episode-specific logic later

  // State to track if user has selected 4K mode
  const [is4KSelected, setIs4KSelected] = useState(false);

  // Function to get the override index for this media using Remote Config
  const getOverrideIndex = () => {
    const mediaId = String(props.mediaId);
    console.log(`🎯 getOverrideIndex called for ${props.mediaType} ${mediaId}:`);
    console.log(`   → Config loading:`, configLoading);
    console.log(`   → Remote config:`, remoteConfig);
    
    if (props.mediaType === 'movie') {
      return getMovieSourceIndex(mediaId, remoteConfig);
    } else if (props.mediaType === 'tv') {
      return getTvSourceIndex(mediaId, remoteConfig);
    }
    return 0; // Default fallback
  };
  useEffect(() => {
    setIsMounted(true);

    if (disableAutoScroll) return;

    // Enhanced auto-scroll to player with better timing and focus
    const scrollToPlayer = () => {
      if (!playerRef.current) return;
      
      console.log('🎯 Auto-scrolling to player...');
      
      // First, ensure the player is in view
      playerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Center the player in viewport
        inline: 'nearest',
      });
      
      // Add focus to the player container for better accessibility
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.focus({ preventScroll: true });
          console.log('✅ Player focused');
        }
      }, 500); // Wait for scroll to complete
    };

    // Wait for page load and content to be ready
    const initializePlayerFocus = () => {
      if (document.readyState === 'complete') {
        // Page already loaded
        setTimeout(scrollToPlayer, 500);
      } else {
        // Wait for page load
        const handleLoad = () => {
          setTimeout(scrollToPlayer, 500);
          window.removeEventListener('load', handleLoad);
        };
        window.addEventListener('load', handleLoad);
        
        // Fallback after 3 seconds
        const fallbackTimeout = setTimeout(() => {
          window.removeEventListener('load', handleLoad);
          scrollToPlayer();
        }, 3000);
        
        return () => {
          window.removeEventListener('load', handleLoad);
          clearTimeout(fallbackTimeout);
        };
      }
    };

    const cleanup = initializePlayerFocus();
    
    return () => {
      cleanup?.();
    };
  }, [disableAutoScroll]);
  
  // Set initial source with priority:
  // 1. URL parameter (initialSourceIndex prop)
  // 2. User's previously selected source (localStorage)
  // 3. Source from overrides
  // 4. Default (0)
  useEffect(() => {
    if (!isMounted || sources.length === 0 || configLoading) {
      console.log('⏳ Waiting for setup:', { isMounted, sourcesCount: sources.length, configLoading });
      return;
    }
    
    console.log('🎬 Starting source selection process...');
    
    // First check for URL parameter (watch party video source continuity)
    if (typeof props.initialSourceIndex === 'number' && 
        props.initialSourceIndex >= 0 && 
        props.initialSourceIndex < sources.length) {
      console.log('Using initial source index from URL parameter:', props.initialSourceIndex);
      setSelectedSourceIndex(props.initialSourceIndex);
      setInitialSetupComplete(true);
      return;
    }
      
    // Then check localStorage for user preference
    const data = JSON.parse(localStorage.getItem('continueWatching') || '[]');
    const entry = data.find((i: any) => i.id === props.mediaId && i.media_type === props.mediaType);
    let userSelectedIndex = -1;
      
    if (entry && typeof entry.source_index === 'number' && entry.source_index >= 0 && entry.source_index < sources.length) {
      console.log('Found user source preference in localStorage at index:', entry.source_index);
      console.log(`Setting user preferred source at index ${entry.source_index}:`, sources[entry.source_index]);
      setSelectedSourceIndex(entry.source_index);
      userSelectedIndex = entry.source_index;
    } else if (entry && entry.selectedSourceName) {
      // Backwards compatibility for old format - convert name to index
      console.log('Found legacy source preference in localStorage:', entry.selectedSourceName);
      userSelectedIndex = sources.findIndex((source) => source.name === entry.selectedSourceName);
      if (userSelectedIndex !== -1) {
        console.log(`Setting legacy preferred source at index ${userSelectedIndex}:`, sources[userSelectedIndex]);
        setSelectedSourceIndex(userSelectedIndex);
      }
    }
    
    // Check for source override if no user preference
    if (userSelectedIndex === -1) {
      const overrideIndex = getOverrideIndex();
      if (overrideIndex !== undefined && overrideIndex >= 0 && overrideIndex < sources.length) {
        console.log(`🔧 Firebase Remote Config Debug for ${props.mediaType} ID ${props.mediaId}:`);
        console.log(`   → Override index from Firebase: ${overrideIndex}`);
        console.log(`   → Source name: ${sources[overrideIndex]?.name}`);
        setSelectedSourceIndex(overrideIndex);
      }
    }
    
    setInitialSetupComplete(true);
  }, [isMounted, props.mediaId, props.mediaType, props.initialSourceIndex, sources, remoteConfig, configLoading]);
  // Save to localStorage when source changes (but only after initial setup)
  useEffect(() => {
    if (!isMounted || !initialSetupComplete || !sources[selectedSourceIndex]) return;
    
    console.log('Saving source to localStorage at index:', selectedSourceIndex, 'source name:', sources[selectedSourceIndex].name);
    
    const item = {
      id: Number(props.mediaId),
      media_type: props.mediaType,
      title: props.title,
      poster_path: props.poster_path || '',
      source_index: selectedSourceIndex,
      last_watched: new Date().toISOString(),
    };
    const data = JSON.parse(localStorage.getItem('continueWatching') || '[]');
    const filtered = data.filter((i: any) => !(Number(i.id) === item.id && i.media_type === item.media_type));
    const updated = [item, ...filtered];
    writeContinueWatching(updated);
  }, [isMounted, initialSetupComplete, props.mediaId, props.mediaType, props.title, props.poster_path, selectedSourceIndex, sources]);

  if (!isMounted) {
    return <MoviePlayerLoading />;
  }

  if (hasError) {
    return (
      <div className="text-center text-red-500 my-8">
        <p>There was an error loading the player. Please try again later.</p>
      </div>
    );
  }
  // Movies don't use the external `sources` array (they play via the VOD backend below), so an
  // empty sources list must NOT block them with the legacy "loading sources" spinner.
  if (props.mediaType !== 'movie' && (!sources || sources.length === 0)) {
    return (
      <div className="my-8">
        <StreamingSourcesLoading />
      </div>
    );
  }

  // LemurPlay VOD: movies play OUR stream (panel → HLS → R2) via the backend, not an external embed.
  // TV still uses the legacy path until series playback is wired end-to-end.
  if (props.mediaType === 'movie') {
    return (
      <div id="movie-player-section" className="relative w-full max-w-full mx-0 px-0" ref={playerRef}>
        <div className={disableAutoScroll ? '' : 'scroll-mt-16'}>
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
            <LemurVodPlayer
              tmdbId={props.mediaId}
              poster={props.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${props.backdrop_path}` : undefined}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="movie-player-section" className="relative w-full max-w-full mx-0 px-0" ref={playerRef}>
      <div className={disableAutoScroll ? '' : 'scroll-mt-16'}>
        {/* Show 4K Player only when 4K source is selected */}
        {is4KSelected && fourKUrl ? (
          <div className="space-y-4">
            {/* 4K Player */}
            <div className="mb-4">
              <FourKPlayer 
                  streamUrl={fourKUrl}
                  title={props.title}
                  poster={props.backdrop_path ? `https://image.tmdb.org/t/p/w1280${props.backdrop_path}` : undefined}
                  mediaId={props.mediaId}
                  mediaType={props.mediaType}
                  seasonNumber={undefined} // TODO: Add season/episode support for TV shows
                  episodeNumber={undefined}
                  trailerId={props.trailerId}
                  onError={(error) => {
                    console.error('4K Player Error:', error);
                    setHasError(true);
                  }}
                  onLoadStart={() => console.log('4K content loading started')}
                  onLoadComplete={() => console.log('4K content loaded successfully')}
                  onSwitchToRegular={() => setIs4KSelected(false)}
                />
            </div>
            
            {/* Source selection and other controls (without iframe player) */}
            <MoviePlayer 
              {...props} 
              sources={sources}
              mediaType={props.mediaType}
              mediaId={props.mediaId}
              title={props.title}
              selectedSourceIndex={selectedSourceIndex}
              setSelectedSourceIndex={setSelectedSourceIndex}
              trailerId={props.trailerId}
              hideVideoPlayer={true}
              is4KAvailable={is4KAvailable}
              is4KSelected={is4KSelected}
              onToggle4K={() => setIs4KSelected(!is4KSelected)}
              embedded={embedded}
              controlsInPanel={controlsInPanel}
            />
          </div>
        ) : (
          /* Regular player for non-4K sources */
          <MoviePlayer 
            {...props} 
            sources={sources}
            mediaType={props.mediaType}
            mediaId={props.mediaId}
            title={props.title}
            selectedSourceIndex={selectedSourceIndex}
            setSelectedSourceIndex={setSelectedSourceIndex}
            trailerId={props.trailerId}
            is4KAvailable={is4KAvailable}
            is4KSelected={is4KSelected}
            onToggle4K={() => setIs4KSelected(!is4KSelected)}
            embedded={embedded}
            controlsInPanel={controlsInPanel}
          />
        )}
        
        {/* Show availability notice only when 4K is available but not selected */}
        {is4KAvailable && !is4KSelected && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>4K Ultra HD available!</strong> Use the "4K Ultra HD" button above to watch in premium quality with adaptive streaming.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviePlayerWrapper;