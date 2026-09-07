'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMobilePlayerOptimization } from '@/hooks/useMobilePlayerOptimization';
import './videojs.css';

interface PrerollAdPlayerProps {
  vastUrl: string;
  onAdComplete: () => void;
  onAdSkipped: () => void;
}

const PrerollAdPlayer: React.FC<PrerollAdPlayerProps> = ({
  vastUrl,
  onAdComplete,
  onAdSkipped
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const skipTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mobile optimization hook
  const { getVideoJSConfig, isMobile } = useMobilePlayerOptimization();  const [isLoaded, setIsLoaded] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Load VideoJS scripts
  useEffect(() => {
    const loadScripts = async () => {
      try {
        addLog('Loading VideoJS scripts...');        // Load VideoJS CSS
        if (!document.querySelector('link[href*="video-js.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://vjs.zencdn.net/8.6.1/video-js.css';
          document.head.appendChild(link);
        }        // Add custom CSS for cleaner ad player
        if (!document.querySelector('#custom-ad-player-styles')) {
          const style = document.createElement('style');
          style.id = 'custom-ad-player-styles';
          style.textContent = `
            .ad-player .vjs-big-play-button{display:none!important}
            .ad-player .vjs-control-bar{display:none!important}
            .ad-player .vjs-loading-spinner{display:none!important}
            .ad-player .vjs-poster{display:none!important}
            .ad-player .vjs-tech{object-fit:cover}
            .ad-player:hover .vjs-control-bar{display:none!important}
            .ad-player .vjs-error-display{display:none!important}
            .ad-player{width:100%!important;height:100%!important;position:absolute!important;top:0!important;left:0!important}
            .ad-player.vjs-fluid{padding-top:0!important}
          `;
          document.head.appendChild(style);
        }

        // Load VideoJS
        if (!window.videojs) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://vjs.zencdn.net/8.6.1/video.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load VideoJS'));
            document.head.appendChild(script);
          });
        }

        addLog('VideoJS loaded successfully!');
        setIsLoaded(true);

      } catch (error) {
        addLog(`Error loading scripts: ${error}`);
        // If loading fails, skip to main content
        setTimeout(onAdSkipped, 1000);
      }
    };

    loadScripts();
  }, [onAdSkipped]);

  // Initialize player and load ad
  useEffect(() => {
    if (!isLoaded || !videoRef.current || playerRef.current) return;    const initializePlayer = async () => {
      try {
        addLog('Initializing player...');
        
        // Ensure videoRef.current exists before initializing
        if (!videoRef.current) {
          addLog('ERROR: Video element not found');
          onAdSkipped();
          return;
        }
        
        const playerConfig = getVideoJSConfig();
        const player = window.videojs(videoRef.current, {
          ...playerConfig,
          controls: false, // Override to remove all controls
          muted: false, // Start unmuted for ads with sound
        });

        player.ready(async () => {
          addLog('Player ready - loading ad...');
          playerRef.current = player;
          await loadVastAd();
        });

      } catch (error) {
        addLog(`Error initializing player: ${error}`);
        onAdSkipped();
      }
    };

    initializePlayer();

    return () => {
      if (skipTimerRef.current) {
        clearInterval(skipTimerRef.current);
      }
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [isLoaded]);
  const loadVastAd = async () => {
    try {
      addLog('Fetching VAST ad...');
      addLog(`VAST URL: ${vastUrl}`);

      const response = await fetch(vastUrl);
      const vastXml = await response.text();
      
      addLog(`VAST Response: ${vastXml.length} chars`);
      
      if (!vastXml.includes('<Ad')) {
        addLog('No ads available - skipping to content');
        onAdSkipped();
        return;
      }      // Parse VAST XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(vastXml, 'text/xml');
        // Check for skip offset in VAST
      const linear = xmlDoc.querySelector('Linear');
      const skipOffset = linear?.getAttribute('skipoffset');
      let skipAfterSeconds = 5; // Default fallback if VAST doesn't specify
      
      if (skipOffset) {
        // Parse skipoffset (format: "00:00:05", "5", or percentage like "25%")
        if (skipOffset.includes('%')) {
          // Handle percentage-based skip (e.g., "25%" means skip after 25% of ad duration)
          addLog(`VAST percentage skip offset: ${skipOffset} - will calculate after duration is known`);
          skipAfterSeconds = 5; // Fallback for now, could be enhanced later
        } else if (skipOffset.includes(':')) {
          // Time format like "00:00:05"
          const parts = skipOffset.split(':');
          skipAfterSeconds = parseInt(parts[parts.length - 1]);
        } else {
          // Direct number format like "5"
          skipAfterSeconds = parseInt(skipOffset);
        }
        addLog(`VAST skip offset: ${skipOffset} → ${skipAfterSeconds}s`);
      } else {
        addLog(`No VAST skip offset found, using default: ${skipAfterSeconds}s`);
      }
      
      const mediaFiles = xmlDoc.querySelectorAll('MediaFile');
      
      let bestMediaFile: string | null = null;
      mediaFiles.forEach((mediaFile) => {
        const videoUrl = mediaFile.textContent?.trim();
        const type = mediaFile.getAttribute('type');
        
        if (type === 'video/mp4' && !bestMediaFile && videoUrl) {
          bestMediaFile = videoUrl;
        }
      });

      if (bestMediaFile) {
        addLog('Playing ad...');
        
        // Set video source
        playerRef.current.src({
          src: bestMediaFile,
          type: 'video/mp4'
        });        // Set up event listeners
        playerRef.current.on('play', () => {
          setIsPlaying(true);
          setIsMuted(playerRef.current.muted());
          startSkipCountdown(skipAfterSeconds);
        });

        playerRef.current.on('loadedmetadata', () => {
          const duration = playerRef.current.duration();
          setAdDuration(duration);
        });

        playerRef.current.on('timeupdate', () => {
          const currentTime = playerRef.current.currentTime();
          const duration = playerRef.current.duration();
          if (duration > 0) {
            setAdProgress((currentTime / duration) * 100);
          }
        });

        playerRef.current.on('ended', () => {
          addLog('Ad completed');
          onAdComplete();
        });

        playerRef.current.on('error', () => {
          addLog('Ad playback error - skipping');
          onAdSkipped();
        });        // Start ad playbook - simple like VastTestPlayer
        const playPromise = playerRef.current.play();
        if (playPromise) {
          playPromise.then(() => {
            addLog('Ad playback started successfully!');
            setIsMuted(playerRef.current.muted());
          }).catch((error: any) => {
            addLog(`Ad playback error: ${error.message}`);
            onAdSkipped();
          });
        }

      } else {
        addLog('No suitable video found - skipping');
        onAdSkipped();
      }

    } catch (error) {
      addLog(`Error loading ad: ${error}`);
      onAdSkipped();
    }
  };  const startSkipCountdown = (skipAfterSeconds = 5) => {
    let countdown = skipAfterSeconds;
    setSkipCountdown(countdown);
    addLog(`Starting skip countdown: ${skipAfterSeconds}s (from VAST)`);
    
    skipTimerRef.current = setInterval(() => {
      countdown--;
      setSkipCountdown(countdown);
      
      if (countdown <= 0) {
        setShowSkipButton(true);
        if (skipTimerRef.current) {
          clearInterval(skipTimerRef.current);
        }
      }
    }, 1000);
  };
  const handleSkip = () => {
    addLog('Ad skipped by user');
    onAdSkipped();
  };
  const handleUnmute = () => {
    if (playerRef.current) {
      playerRef.current.muted(false);
      playerRef.current.volume(1);
      setIsMuted(false);
      addLog('Ad unmuted by user');
    }
  };

  return (
    <div className="relative w-full h-full bg-black">      {/* Video Player */}      <video
        ref={videoRef}
        className="video-js vjs-default-skin ad-player w-full h-full"
        data-setup="{}"
        playsInline
        autoPlay
      >
        <p className="vjs-no-js">
          To view this video please enable JavaScript, and consider upgrading to a web browser that{' '}
          <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
            supports HTML5 video
          </a>.
        </p>
      </video>      {/* Skip Button - Bottom Right */}
      {isPlaying && (
        <div className="absolute bottom-4 right-4 z-20">
          {showSkipButton ? (
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-black bg-opacity-80 text-white font-bold rounded-lg hover:bg-opacity-100 transition-all duration-200 border border-white border-opacity-30 shadow-lg backdrop-blur-sm"
            >
              Skip Ad →
            </button>
          ) : (
            <div className="px-4 py-2 bg-black bg-opacity-70 text-white rounded-lg border border-white border-opacity-20 backdrop-blur-sm">
              Skip in {skipCountdown}s
            </div>
          )}
        </div>
      )}      {/* Ad Label */}
      {isPlaying && (
        <div className="absolute top-4 left-4 z-10">
          <div className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg shadow-lg">
            AD
          </div>
        </div>
      )}      {/* Progress Bar */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30 z-10">
          <div 
            className="h-full bg-yellow-400 transition-all duration-100"
            style={{ width: `${adProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default PrerollAdPlayer;
