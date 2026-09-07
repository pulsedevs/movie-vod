"use client";

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

// Lazy-loaded, optimized YouTube trailer player
// This replaces the heavy Plyr dependency with a lightweight custom player

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface PlyrTrailerProps {
  trailerKey: string;
  trailerName: string;
}

const PlyrTrailerLazy: React.FC<PlyrTrailerProps> = ({ trailerKey: videoId, trailerName }) => {
  const [player, setPlayer] = useState<any>(null);
  const [isYouTubeApiLoaded, setIsYouTubeApiLoaded] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  function formatTime(time: number) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Load YouTube API only when component mounts
  useEffect(() => {
    let isMounted = true;
    
    if (typeof window !== 'undefined') {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
          window.onYouTubeIframeAPIReady = () => {
            if (isMounted) {
              setIsYouTubeApiLoaded(true);
              setApiLoading(false);
            }
          };
        }
      } else {
        if (isMounted) {
          setIsYouTubeApiLoaded(true);
          setApiLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.onYouTubeIframeAPIReady = null;
      }
    };
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (!isYouTubeApiLoaded || !window.YT || typeof window === 'undefined') return;
    
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const ytPlayer = new window.YT.Player(`youtube-player-${videoId}`, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          playsinline: 1,
          disablekb: 1,
          origin: window.location.origin,
          cc_load_policy: 0,
          color: 'white',
          hl: 'en',
          widget_referrer: 'BoredFlix',
          enablejsapi: 1,
          autohide: 1,
          endscreen: 0,
          annotation: 0
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration());
            setApiLoading(false);
            
            event.target.playVideo();
            
            progressInterval = setInterval(() => {
              if (event.target && typeof event.target.getCurrentTime === 'function') {
                const currentTime = event.target.getCurrentTime();
                const duration = event.target.getDuration();
                
                if (!isNaN(currentTime) && !isNaN(duration) && duration > 0) {
                  setCurrentTime(currentTime);
                  setProgress((currentTime / duration) * 100);
                }
              }
            }, 1000);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setProgress(100);
              setCurrentTime(duration);
            }
          },
          onError: () => {
            setApiLoading(false);
          }
        }
      });

      return () => {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        try {
          if (ytPlayer && typeof ytPlayer.destroy === 'function') {
            ytPlayer.destroy();
          }
        } catch (error) {
          console.log("Could not properly destroy YouTube player", error);
        }
      };
    } catch (error) {
      console.error("Error initializing YouTube player:", error);
      setApiLoading(false);
      return () => {
        if (progressInterval) clearInterval(progressInterval);
      };
    }
  }, [videoId, isYouTubeApiLoaded, duration]);

  const togglePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
    } else {
      player.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !progressRef.current) return;
    
    const bounds = progressRef.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const width = bounds.width;
    const percentage = x / width;
    const seekTime = duration * percentage;
    
    player.seekTo(seekTime);
    setProgress(percentage * 100);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerContainerRef.current.requestFullscreen();
    }
  };
  return (
    <div 
      ref={playerContainerRef}
      className="relative w-full h-full rounded-lg overflow-hidden bg-black shadow-2xl"
    >
      {apiLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-t-red-600 border-r-transparent border-b-red-600 border-l-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-2 font-medium text-xs">Loading...</p>
          </div>
        </div>
      )}

      <div className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div id={`youtube-player-${videoId}`} className="w-full h-full scale-140" style={{ transform: 'scale(1.4)' }}></div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">        
        <div className="absolute top-0 left-0 w-full h-8 sm:h-12 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-auto">
          <div className="p-1 sm:p-2 flex justify-between items-center h-full">
            <div className="flex items-center">
              <span className="text-red-600 font-bold text-xs sm:text-sm mr-1">BOREDFLIX</span>
              <span className="text-gray-300 text-xs hidden sm:inline">TRAILER</span>
            </div>
            <h3 className="text-white font-medium truncate pr-2 ml-1 text-xs sm:text-sm">{trailerName}</h3>
          </div>
        </div>
        
        <div 
          className="absolute inset-0 pointer-events-auto"
          onClick={togglePlay}
        ></div>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{background: 'rgba(0,0,0,0.3)'}}>
            <div className="bg-black/50 p-6 rounded-full shadow-lg">
              <Play size={40} className="text-white" fill="white" />
            </div>
          </div>
        )}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-8 sm:pt-16 pb-2 sm:pb-4 px-2 sm:px-4 pointer-events-auto">
          <div 
            ref={progressRef}
            className="w-full h-1 sm:h-2 bg-white/20 rounded-full mb-2 sm:mb-4 cursor-pointer group relative"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full relative" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute h-2 w-2 sm:h-4 sm:w-4 bg-white rounded-full -right-1 sm:-right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-4">
              <button 
                onClick={togglePlay}
                className="p-1 sm:p-2 text-white/90 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              
              <button 
                onClick={toggleMute}
                className="p-1 sm:p-2 text-white/90 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              
              <span className="text-xs text-white/90 hidden sm:inline">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-gray-400 mr-1 sm:mr-2 hidden md:block">Powered by BoredFlix</span>
              <button 
                onClick={toggleFullscreen}
                className="p-1 sm:p-2 text-white/90 hover:text-white transition-colors"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlyrTrailerLazy;
