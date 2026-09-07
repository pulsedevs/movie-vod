"use client";

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

// Dynamically import Plyr only when needed to reduce bundle size
const loadPlyr = async () => {
  const { default: Plyr } = await import('plyr');
  return Plyr;
};

// Declare YouTube types for TypeScript
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

const PlyrTrailer: React.FC<PlyrTrailerProps> = ({ trailerKey, trailerName }) => {
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const plyrInstanceRef = useRef<Plyr | null>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!trailerKey) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/youtube?action=videoInfo&videoId=${trailerKey}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch video details: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setVideoTitle(data.items[0].snippet.title);
        } else {
          setVideoTitle(trailerName || 'Trailer');
        }
      } catch (err: any) {
        console.error('Error fetching YouTube video details:', err);
        setError(err.message || 'Could not load video details.');
        setVideoTitle(trailerName || 'Trailer');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoDetails();
  }, [trailerKey, trailerName]);

  const getYoutubeId = (key: string) => {
    if (key.includes('youtube.com') || key.includes('youtu.be')) {
      const matches = key.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return matches ? matches[1] : key;
    }
    return key;
  };
  
  const videoId = getYoutubeId(trailerKey);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isYouTubeApiLoaded, setIsYouTubeApiLoaded] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(true);

  function formatTime(time: number) {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

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

  useEffect(() => {
    if (!isYouTubeApiLoaded || !window.YT || typeof window === 'undefined') return;
    
    let progressInterval: NodeJS.Timeout | null = null;

    try {      const ytPlayer = new window.YT.Player(`youtube-player-${videoId}`, {        videoId: videoId,        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,           // Prevent related videos
          showinfo: 0,       // Hide video info
          modestbranding: 1, // Minimize YouTube branding
          iv_load_policy: 3, // Hide annotations
          fs: 0,             // Disable fullscreen button
          playsinline: 1,    // Play inline on mobile
          disablekb: 1,      // Disable keyboard controls
          origin: window.location.origin,
          cc_load_policy: 0, // Hide captions by default
          color: 'white',
          hl: 'en',          // Interface language
          widget_referrer: 'BoredFlix',
          enablejsapi: 1,    // Enable JavaScript API
          autohide: 1,       // Hide controls when playing
          endscreen: 0,      // Attempt to hide end screen
          annotation: 0      // Hide annotations
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration());
            setApiLoading(false);
            
            try {
              const iframe = document.getElementById(`youtube-player-${videoId}`);
              if (iframe && iframe.tagName === 'IFRAME') {
                const iframeDoc = (iframe as HTMLIFrameElement).contentWindow?.document;
                if (iframeDoc) {                  
                  const style = iframeDoc.createElement('style');
                  style.textContent = `
                    .ytp-chrome-top, .ytp-chrome-bottom, .ytp-watermark, .ytp-youtube-button,
                    .ytp-title-text, .ytp-title, .ytp-title-link, .ytp-title-channel,
                    .ytp-ce-element, .ytp-ce-covering-overlay, .ytp-ce-element-shadow,
                    .ytp-ce-covering-image, .ytp-ce-expanding-image, .ytp-ce-element.ytp-ce-channel,
                    .ytp-ce-element.ytp-ce-video, .ytp-ce-element.ytp-ce-playlist,
                    .ytp-pause-overlay, .ytp-related-on-pause-overlay { 
                      display: none !important; 
                    }
                    .html5-endscreen {
                      display: none !important;
                    }
                  `;
                  iframeDoc.head.appendChild(style);
                }
              }
            } catch (styleError) {
              console.log("Could not apply custom styles to iframe");
            }
            
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
      className="relative w-full h-96 md:h-[65vh] rounded-lg overflow-hidden bg-black shadow-2xl"
    >
      {apiLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-t-red-600 border-r-transparent border-b-red-600 border-l-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4 font-medium">Loading trailer...</p>
          </div>
        </div>
      )}      
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200%] opacity-30">
            <div className="grid grid-cols-12 gap-1 transform rotate-12">
              {Array.from({ length: 100 }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 ${
                    Math.random() > 0.5 ? 'bg-red-600/20' : 'bg-blue-600/20'
                  }`}
                  style={{ width: `${Math.random() * 100}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>        
      <div className="w-full h-full relative z-5 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div id={`youtube-player-${videoId}`} className="w-full h-full scale-140" style={{ transform: 'scale(1.4)' }}></div>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">        
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-auto">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-red-600 font-bold text-lg mr-2">BOREDFLIX</span>
              <span className="text-gray-300 text-xs">TRAILER</span>
            </div>
            <h3 className="text-white font-medium truncate pr-8 ml-2 text-sm md:text-base">{trailerName}</h3>
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
        
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-16 pb-4 px-4 pointer-events-auto">
          <div 
            ref={progressRef}
            className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer group relative"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full relative" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute h-4 w-4 bg-white rounded-full -right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="p-2 text-white/90 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button 
                onClick={toggleMute}
                className="p-2 text-white/90 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <span className="text-xs text-white/90">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 mr-2 hidden md:block">Powered by BoredFlix</span>
              <button 
                onClick={toggleFullscreen}
                className="p-2 text-white/90 hover:text-white transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlyrTrailer;
