'use client';

/**
 * FourKPlayer - Multi-Format Video Player
 * 
 * This player supports multiple video formats with adaptive streaming capabilities.
 * 🎬 PRIMARY: HLS (.m3u8) - Adaptive bitrate streaming (Cloudflare Stream)
 * ✅ SUPPORTED: Direct video files (.mp4, .webm, .mov, .avi, .mkv, .ogg)
 * 🎯 FALLBACK: Progressive download for non-HLS content
 * 
 * Supported Formats:
 * - HLS (.m3u8): Adaptive bitrate streaming with multiple quality levels
 * - MP4 (.mp4): Most compatible format, works across all browsers
 * - WebM (.webm): Modern, efficient format (Chrome, Firefox, Opera)
 * - MOV (.mov): Apple QuickTime format (best support in Safari)
 * - AVI (.avi): Legacy format with broad compatibility
 * - MKV (.mkv): Matroska container with high-quality video
 * - OGG (.ogg/.ogv): Open source Theora/VP8 video
 * 
 * Features:
 * - Auto-detection of video format (HLS vs direct video)
 * - 4K/1080p/720p adaptive streaming for HLS
 * - Progressive download for direct video files
 * - Picture-in-picture and Chromecast support
 * - Progressive loading with detailed analytics
 * - Watchlist integration and progress tracking
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Wifi, PictureInPicture, Cast, SkipBack, SkipForward } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { MediaItem } from '@/types';
import WatchPartyButton from '@/components/watchParty/WatchPartyButton';
import YouTubeComments from '@/components/movie/YouTubeComments';
import DownloadButton from './DownloadButton';

interface FourKPlayerProps {
  streamUrl: string; // HLS (.m3u8) or direct video URL (.mp4, .webm, etc.)
  title: string;
  poster?: string;
  qualities?: string[];
  mediaId: string | number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  trailerId?: string; // YouTube trailer ID for comments
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onSwitchToRegular?: () => void; // Callback to switch back to regular sources
}

// Utility function to detect video format and validate URLs
const detectVideoFormat = (url: string): { 
  format: 'hls' | 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'ogg' | 'other'; 
  isValid: boolean; 
  message?: string;
  mimeType: string;
} => {
  if (!url) {
    return { format: 'other', isValid: false, message: 'No stream URL provided', mimeType: '' };
  }
  
  // Convert URL to lowercase for case-insensitive detection
  const urlLower = url.toLowerCase();
  
  // HLS Detection (highest priority for streaming)
  if (urlLower.includes('.m3u8') || urlLower.includes('hls') || urlLower.includes('stream/')) {
    return { 
      format: 'hls', 
      isValid: true, 
      message: 'HLS adaptive streaming detected',
      mimeType: 'application/x-mpegURL'
    };
  }
  
  // MP4 Detection (most compatible)
  if (urlLower.includes('.mp4') || urlLower.includes('mp4')) {
    return { 
      format: 'mp4', 
      isValid: true, 
      message: 'MP4 video file detected',
      mimeType: 'video/mp4'
    };
  }
  
  // WebM Detection (modern, efficient)
  if (urlLower.includes('.webm')) {
    return { 
      format: 'webm', 
      isValid: true, 
      message: 'WebM video file detected',
      mimeType: 'video/webm'
    };
  }
  
  // MOV Detection (Apple QuickTime)
  if (urlLower.includes('.mov') || urlLower.includes('.qt')) {
    return { 
      format: 'mov', 
      isValid: true, 
      message: 'MOV/QuickTime video file detected',
      mimeType: 'video/quicktime'
    };
  }
  
  // AVI Detection (legacy but still common)
  if (urlLower.includes('.avi')) {
    return { 
      format: 'avi', 
      isValid: true, 
      message: 'AVI video file detected',
      mimeType: 'video/x-msvideo'
    };
  }
  
  // MKV Detection (Matroska container)
  if (urlLower.includes('.mkv') || urlLower.includes('.webm')) {
    return { 
      format: 'mkv', 
      isValid: true, 
      message: 'MKV/Matroska video file detected',
      mimeType: 'video/x-matroska'
    };
  }
  
  // OGG/Theora Detection (open source)
  if (urlLower.includes('.ogg') || urlLower.includes('.ogv')) {
    return { 
      format: 'ogg', 
      isValid: true, 
      message: 'OGG/Theora video file detected',
      mimeType: 'video/ogg'
    };
  }
  
  // Unknown format - assume direct video with MP4 fallback
  return { 
    format: 'other', 
    isValid: true, 
    message: 'Unknown format, attempting direct video playback',
    mimeType: 'video/mp4' // Default fallback
  };
};

// Utility function to validate HLS URLs (legacy function for backward compatibility)
const validateHlsUrl = (url: string): { isValid: boolean; message?: string } => {
  const detection = detectVideoFormat(url);
  return { isValid: detection.isValid, message: detection.message };
};

// Utility function to check codec support for multiple formats
const checkCodecSupport = (codec: string): { supported: boolean; message?: string } => {
  // For HLS streaming, codec support is handled by the browser's HLS implementation
  // For direct video files, we check native browser support
  
  // Check for H.265/HEVC (common in 4K content)
  if (codec.includes('hvc1') || codec.includes('hev1')) {
    const hevcSupported = 'MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="hvc1.1.6.L93.B0"');
    return {
      supported: hevcSupported,
      message: hevcSupported ? undefined : 'H.265/HEVC codec not supported. Try Safari on Mac/iOS or use H.264 alternative.'
    };
  }
  
  // Check for AV1 (modern codec for efficient streaming)
  if (codec.includes('av01')) {
    const av1Supported = 'MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="av01.0.05M.08"');
    return {
      supported: av1Supported,
      message: av1Supported ? undefined : 'AV1 codec not supported. Try Chrome, Firefox, or Edge (latest versions).'
    };
  }
  
  // Check for H.264 (most compatible codec)
  if (codec.includes('avc1')) {
    const h264Supported = 'MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="avc1.640028"');
    return {
      supported: h264Supported,
      message: h264Supported ? undefined : 'H.264 codec not supported in this browser.'
    };
  }
  
  // Unknown codec
  return {
    supported: false,
    message: `Unknown or unsupported codec: ${codec}. Player will attempt adaptive fallback.`
  };
};

const FourKPlayer: React.FC<FourKPlayerProps> = ({
  streamUrl,
  title,
  poster,
  qualities = ['Auto', '4K', '1080p', '720p'],
  mediaId,
  mediaType,
  seasonNumber,
  episodeNumber,
  trailerId,
  onError,
  onLoadStart,
  onLoadComplete,
  onSwitchToRegular
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const initializingRef = useRef(false); // Prevent multiple initializations
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isHlsSupported, setIsHlsSupported] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showVolumeDisplay, setShowVolumeDisplay] = useState(false);

  // Auto-play state
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
  const [autoPlayFailed, setAutoPlayFailed] = useState(false);

  // Video format detection state
  const [videoFormat, setVideoFormat] = useState<'hls' | 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'ogg' | 'other'>('hls');
  const [isDirectVideo, setIsDirectVideo] = useState(false);

  // Enhanced loading states
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  const [connectionSpeed, setConnectionSpeed] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [bufferHealth, setBufferHealth] = useState(0);
  const [bytesLoaded, setBytesLoaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // Watchlist functionality
  const { 
    addToWatchlist, 
    removeFromWatchlist, 
    isInWatchlist, 
    loading: isWatchlistLoading 
  } = useUserData();
  
  const [isItemInWatchlist, setIsItemInWatchlist] = useState(false);
  const [isProcessingWatchlist, setIsProcessingWatchlist] = useState(false);

  // Picture-in-Picture and Casting state
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isCastSupported, setIsCastSupported] = useState(false);
  const [isCastActive, setIsCastActive] = useState(false);

  // Video progress tracking
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [progressLoaded, setProgressLoaded] = useState<boolean>(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);

  // Debug: Track savedProgress changes (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 SAVED PROGRESS STATE CHANGED:', savedProgress);
    }
  }, [savedProgress]);

  // Check if item is in watchlist on mount
  useEffect(() => {
    setIsItemInWatchlist(isInWatchlist(typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId, mediaType));
  }, [mediaId, mediaType, isInWatchlist]);

  // Sync volume with video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Load saved volume from localStorage
  useEffect(() => {
    try {
      const savedVolume = localStorage.getItem('video-volume');
      const savedMuted = localStorage.getItem('video-muted');
      
      if (savedVolume) {
        const vol = parseFloat(savedVolume);
        if (!isNaN(vol) && vol >= 0 && vol <= 1) {
          setVolume(vol);
        }
      }
      
      if (savedMuted) {
        setIsMuted(savedMuted === 'true');
      }
    } catch (error) {
      console.error('Error loading volume settings:', error);
    }
  }, []);

  // Save volume settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('video-volume', volume.toString());
      localStorage.setItem('video-muted', isMuted.toString());
    } catch (error) {
      console.error('Error saving volume settings:', error);
    }
  }, [volume, isMuted]);

  // Video progress utility functions
  const getProgressKey = () => {
    if (mediaType === 'movie') {
      return `video-progress-movie-${mediaId}`;
    } else {
      return `video-progress-tv-${mediaId}-s${seasonNumber || 1}-e${episodeNumber || 1}`;
    }
  };

  const saveProgress = (time: number, duration: number) => {
    if (!duration || time < 30) return; // Don't save if less than 30 seconds
    
    const progressKey = getProgressKey();
    const progressData = {
      time,
      duration,
      percentage: (time / duration) * 100,
      timestamp: Date.now(),
      title,
      mediaType,
      mediaId,
      seasonNumber,
      episodeNumber
    };
    
    try {
      localStorage.setItem(progressKey, JSON.stringify(progressData));
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Progress saved:', {
          time: formatTime(time),
          percentage: Math.round(progressData.percentage),
          key: progressKey
        });
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const loadProgress = () => {
    const progressKey = getProgressKey();
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('🔍 loadProgress() called with key:', progressKey);
    }
    try {
      const saved = localStorage.getItem(progressKey);
      if (isDev) {
        console.log('🔍 Raw localStorage value:', saved);
      }
      if (saved) {
        const progressData = JSON.parse(saved);
        if (isDev) {
          console.log('🔍 Parsed progress data:', progressData);
        }
        // Only show resume if progress is more than 30 seconds and less than 90% complete
        if (progressData.time > 30 && progressData.percentage < 90) {
          if (isDev) {
            console.log('🔍 Progress qualifies for resume (>30s and <90%)');
          }
          setSavedProgress(progressData.time);
          // Don't immediately show prompt, let the useEffect handle the timing
          return progressData;
        } else {
          if (isDev) {
            console.log('🔍 Progress does NOT qualify for resume (<=30s or >=90%)');
          }
        }
      } else {
        if (isDev) {
          console.log('🔍 No saved progress in localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return null;
  };

  const clearProgress = () => {
    const progressKey = getProgressKey();
    try {
      localStorage.removeItem(progressKey);
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Progress cleared for:', progressKey);
      }
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  };

  const resumeFromSaved = async () => {
    if (videoRef.current && savedProgress > 0 && !hasResumed) {
      videoRef.current.currentTime = savedProgress;
      setCurrentTime(savedProgress);
      setShowResumePrompt(false);
      setHasResumed(true);
      
      // Clear auto-play failure state when resuming
      setAutoPlayFailed(false);
      setAutoPlayAttempted(true);
      
      // Start playing the video automatically when resuming
      try {
        await videoRef.current.play();
        if (process.env.NODE_ENV === 'development') {
          console.log('▶️ Resumed from:', formatTime(savedProgress), '- Auto-playing after resume');
        }
      } catch (error) {
        console.warn('Auto-play failed after resume:', error);
        setAutoPlayFailed(true);
        // If auto-play fails, the user can still click play manually
      }
    }
  };

  // Centralized auto-play decision function
  const handleAutoPlayDecision = useCallback(async (video: HTMLVideoElement, reason: string) => {
    // Wait for progress loading to complete
    if (!progressLoaded) {
      console.log(`⏳ Auto-play delayed (${reason}): Waiting for progress to load`);
      return;
    }
    
    // Only auto-play once and only if no saved progress
    if (autoPlayAttempted || savedProgress > 0) {
      if (savedProgress > 0) {
        console.log(`⏸️ Auto-play skipped (${reason}): Saved progress detected - user must choose`);
      } else {
        console.log(`⏸️ Auto-play skipped (${reason}): Already attempted`);
      }
      return;
    }

    setAutoPlayAttempted(true);
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`🎬 AUTO-PLAY TRIGGERED (${reason}):`, {
        savedProgress: savedProgress,
        showResumePrompt: showResumePrompt,
        progressLoaded: progressLoaded
      });
    }

    if (video && video.paused) {
      try {
        if (isDev) {
          console.log(`▶️ Auto-playing video (${reason}) - no saved progress`);
        }
        await video.play();
        if (isDev) {
          console.log('✅ Auto-play successful');
        }
        setAutoPlayFailed(false);
      } catch (playError) {
        console.warn('⚠️ Auto-play failed (browser policy):', playError);
        setAutoPlayFailed(true);
      }
    }
  }, [progressLoaded, savedProgress, autoPlayAttempted, showResumePrompt, hasResumed]);

  // Load saved progress on mount
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('🔍 LOADING PROGRESS DEBUG: useEffect triggered');
    }
    const savedData = loadProgress();
    if (savedData) {
      if (isDev) {
        console.log('💾 Found saved progress:', {
          time: formatTime(savedData.time),
          percentage: Math.round(savedData.percentage),
          date: new Date(savedData.timestamp).toLocaleString()
        });
        console.log('🔍 SETTING savedProgress to:', savedData.time);
      }
      setSavedProgress(savedData.time);
      
      // Immediately set resume prompt to prevent auto-play race conditions
      if (isDev) {
        console.log('🎬 Setting resume prompt immediately to prevent auto-play');
      }
      setShowResumePrompt(true);
    } else {
      if (isDev) {
        console.log('🔍 NO saved progress found - savedProgress will remain 0');
      }
      setSavedProgress(0);
    }
    
    // Mark progress loading as complete
    setProgressLoaded(true);
    if (isDev) {
      console.log('✅ Progress loading complete');
    }
  }, [mediaId, mediaType, seasonNumber, episodeNumber]);

  // Trigger auto-play when progress loading is complete
  useEffect(() => {
    if (progressLoaded && videoRef.current && !autoPlayAttempted) {
      const video = videoRef.current;
      if (video.paused && video.readyState >= 3) { // HAVE_FUTURE_DATA
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          console.log('🔄 Progress loaded, checking for delayed auto-play');
        }
        if (savedProgress === 0) {
          if (isDev) {
            console.log('🎬 Triggering delayed auto-play (no saved progress)');
          }
          // Directly call auto-play decision instead of triggering canplay event
          handleAutoPlayDecision(video, 'delayed after progress loaded').catch(console.error);
        } else {
          if (isDev) {
            console.log('⏸️ No delayed auto-play: Saved progress detected');
          }
        }
      }
    }
  }, [progressLoaded, savedProgress, autoPlayAttempted]);

  // Show resume prompt when video is ready and not loading
  useEffect(() => {
    if (savedProgress > 0 && !isLoading && !hasResumed && !showResumePrompt) {
      // Show resume prompt immediately when saved progress is detected
      // This prevents auto-play from triggering before user can choose
      setShowResumePrompt(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🎬 Resume prompt triggered immediately due to saved progress:', formatTime(savedProgress));
      }
    }
  }, [savedProgress, isLoading, hasResumed, showResumePrompt]);

  // Save progress periodically during playback
  useEffect(() => {
    if (!isPlaying || !duration || currentTime < 30) return;
    
    const saveInterval = setInterval(() => {
      saveProgress(currentTime, duration);
    }, 15000); // Save every 15 seconds
    
    return () => clearInterval(saveInterval);
  }, [isPlaying, currentTime, duration, mediaId, mediaType, seasonNumber, episodeNumber, title]);

  // Save progress when video ends (mark as completed)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎬 Video ended, clearing progress');
      }
      clearProgress(); // Clear progress when video is completed
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, []);

  // Save progress when component unmounts (user leaves page)
  useEffect(() => {
    return () => {
      if (currentTime > 30 && duration > 0) {
        saveProgress(currentTime, duration);
      }
    };
  }, [currentTime, duration]);

  // Note: Removed auto-resume functionality to prevent conflicts with resume dialogue

  const calculateConnectionSpeed = (bytesLoaded: number, timeElapsed: number) => {
    if (timeElapsed <= 0) return '';
    
    const speedBytesPerSecond = bytesLoaded / timeElapsed;
    const speedMbps = (speedBytesPerSecond * 8) / (1024 * 1024); // Convert to Mbps
    
    if (speedMbps >= 100) return 'Excellent (100+ Mbps)';
    if (speedMbps >= 50) return `Fast (${Math.round(speedMbps)} Mbps)`;
    if (speedMbps >= 25) return `Good (${Math.round(speedMbps)} Mbps)`;
    if (speedMbps >= 10) return `Fair (${Math.round(speedMbps)} Mbps)`;
    return `Slow (${Math.round(speedMbps)} Mbps)`;
  };

  const estimateTimeRemaining = (bytesLoaded: number, totalBytes: number, speedBytesPerSecond: number) => {
    if (!totalBytes || !speedBytesPerSecond || bytesLoaded >= totalBytes) return '';
    
    const remainingBytes = totalBytes - bytesLoaded;
    const remainingSeconds = remainingBytes / speedBytesPerSecond;
    
    if (remainingSeconds < 60) return `${Math.round(remainingSeconds)}s remaining`;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.round(remainingSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  };

  // Watch for watchlist changes and update local state
  useEffect(() => {
    const checkWatchlistStatus = () => {
      const isInList = isInWatchlist(typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId, mediaType);
      setIsItemInWatchlist(isInList);
    };
    
    // Check every 100ms for watchlist changes (this will catch updates from the hook)
    const interval = setInterval(checkWatchlistStatus, 100);
    
    return () => clearInterval(interval);
  }, [mediaId, mediaType, isInWatchlist]);

  // Check for PiP and Cast capabilities
  useEffect(() => {
    // Check Picture-in-Picture support
    setIsPiPSupported(document.pictureInPictureEnabled || false);
    
    // Check Cast support
    const checkCastSupport = () => {
      // Check for Google Cast (Chromecast)
      if ('chrome' in window && 'cast' in (window as any).chrome) {
        const cast = (window as any).chrome.cast;
        setIsCastSupported(cast.isAvailable || false);
      }
      // Check for Web Cast API (Presentation API)
      else if ('presentation' in navigator && 'PresentationRequest' in window) {
        setIsCastSupported(true);
      }
      else {
        setIsCastSupported(false);
      }
    };

    checkCastSupport();

    // Listen for PiP changes
    const video = videoRef.current;
    if (video) {
      const handlePiPEnter = () => setIsPiPActive(true);
      const handlePiPLeave = () => setIsPiPActive(false);
      
      video.addEventListener('enterpictureinpicture', handlePiPEnter);
      video.addEventListener('leavepictureinpicture', handlePiPLeave);
      
      return () => {
        video.removeEventListener('enterpictureinpicture', handlePiPEnter);
        video.removeEventListener('leavepictureinpicture', handlePiPLeave);
      };
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for our handled keys
      const handledKeys = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F', 'm', 'M', 'k', 'K', 'j', 'J', 'l', 'L', 'q', 'Q', 'e', 'E', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case ' ': // Spacebar - Play/Pause
        case 'k':
        case 'K':
          togglePlay();
          break;
          
        case 'ArrowLeft': // Left Arrow - Seek backward 5s
        case 'j':
        case 'J':
          if (video.currentTime > 5) {
            video.currentTime -= 5;
          } else {
            video.currentTime = 0;
          }
          break;
          
        case 'ArrowRight': // Right Arrow - Seek forward 5s  
        case 'l':
        case 'L':
          if (video.currentTime < video.duration - 5) {
            video.currentTime += 5;
          } else {
            video.currentTime = video.duration;
          }
          break;

        case 'q': // Q - Seek backward 10s
        case 'Q':
          if (video.currentTime > 10) {
            video.currentTime -= 10;
          } else {
            video.currentTime = 0;
          }
          break;
          
        case 'e': // E - Seek forward 10s  
        case 'E':
          if (video.currentTime < video.duration - 10) {
            video.currentTime += 10;
          } else {
            video.currentTime = video.duration;
          }
          break;
          
        case 'ArrowUp': // Up Arrow - Volume up
          if (volume < 1) {
            const newVolume = Math.min(1, volume + 0.1);
            setVolume(newVolume);
            video.volume = newVolume;
            if (isMuted) {
              setIsMuted(false);
              video.muted = false;
            }
            showVolumeDisplayTemporarily();
          }
          break;
          
        case 'ArrowDown': // Down Arrow - Volume down
          if (volume > 0) {
            const newVolume = Math.max(0, volume - 0.1);
            setVolume(newVolume);
            video.volume = newVolume;
            showVolumeDisplayTemporarily();
          }
          break;
          
        case 'm': // M - Toggle mute
        case 'M':
          toggleMute();
          showVolumeDisplayTemporarily();
          break;
          
        case 'f': // F - Toggle fullscreen
        case 'F':
          toggleFullscreen();
          break;
          
        case 'p': // P - Picture in Picture
        case 'P':
          togglePictureInPicture();
          break;
          
        case ',': // < - Decrease playback speed
          if (playbackRate > 0.25) {
            const newRate = Math.max(0.25, playbackRate - 0.25);
            setPlaybackRate(newRate);
            video.playbackRate = newRate;
          }
          break;
          
        case '.': // > - Increase playback speed
          if (playbackRate < 2) {
            const newRate = Math.min(2, playbackRate + 0.25);
            setPlaybackRate(newRate);
            video.playbackRate = newRate;
          }
          break;

        case 'Home': // Home - Jump to beginning
          video.currentTime = 0;
          break;
          
        case 'End': // End - Jump to end
          video.currentTime = video.duration;
          break;
          
        case '?': // ? - Show keyboard shortcuts
          setShowShortcuts(!showShortcuts);
          break;
          
        // Number keys 0-9 - Jump to 0%-90% of video
        case '0': video.currentTime = 0; break;
        case '1': video.currentTime = video.duration * 0.1; break;
        case '2': video.currentTime = video.duration * 0.2; break;
        case '3': video.currentTime = video.duration * 0.3; break;
        case '4': video.currentTime = video.duration * 0.4; break;
        case '5': video.currentTime = video.duration * 0.5; break;
        case '6': video.currentTime = video.duration * 0.6; break;
        case '7': video.currentTime = video.duration * 0.7; break;
        case '8': video.currentTime = video.duration * 0.8; break;
        case '9': video.currentTime = video.duration * 0.9; break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, playbackRate, isMuted, showShortcuts]);

  // Picture in Picture support
  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  };

  // Cast support (Web Cast API or Google Cast)
  const toggleCast = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // Check for Google Cast (Chromecast)
      if ('chrome' in window && 'cast' in (window as any).chrome) {
        const cast = (window as any).chrome.cast;
        if (cast.isAvailable) {
          if (isCastActive) {
            // Stop casting
            const session = cast.framework.CastContext.getInstance().getCurrentSession();
            if (session) {
              await session.endSession(true);
              setIsCastActive(false);
            }
          } else {
            // Start casting with dynamic MIME type based on detected format
            const castContext = cast.framework.CastContext.getInstance();
            const formatDetection = detectVideoFormat(streamUrl);
            const mediaInfo = new cast.framework.messages.MediaInfo(streamUrl, formatDetection.mimeType);
            mediaInfo.metadata = new cast.framework.messages.GenericMediaMetadata();
            mediaInfo.metadata.title = title;
            if (poster) mediaInfo.metadata.images = [new cast.framework.messages.Image(poster)];
            
            const request = new cast.framework.messages.LoadRequest(mediaInfo);
            const session = castContext.getCurrentSession();
            if (session) {
              await session.loadMedia(request);
              setIsCastActive(true);
            } else {
              await castContext.requestSession();
            }
          }
        }
      }
      // Check for Web Cast API (if available)
      else if ('presentation' in navigator && 'PresentationRequest' in window) {
        const presentationRequest = new (window as any).PresentationRequest([streamUrl]);
        if (isCastActive) {
          // Stop presentation
          if ((presentationRequest as any).connection) {
            await (presentationRequest as any).connection.terminate();
            setIsCastActive(false);
          }
        } else {
          // Start presentation
          const connection = await presentationRequest.start();
          setIsCastActive(true);
          
          connection.addEventListener('terminate', () => {
            setIsCastActive(false);
          });
        }
      }
    } catch (error) {
      console.error('Cast error:', error);
    }
  };

  // Initialize Video Player (HLS or Direct Video)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true; // Track component mount state

    const initializePlayer = async () => {
      // Prevent multiple simultaneous initializations
      if (initializingRef.current) {
        return;
      }
      initializingRef.current = true;

      // Detect video format first
      const formatDetection = detectVideoFormat(streamUrl);
      setVideoFormat(formatDetection.format);
      setIsDirectVideo(formatDetection.format !== 'hls');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎬 Video format detected:', formatDetection);
      }

      if (!formatDetection.isValid) {
        console.error('❌ Invalid video URL:', formatDetection.message);
        if (isMounted) {
          onError?.(`Invalid stream URL: ${formatDetection.message}`);
        }
        initializingRef.current = false;
        return;
      }

      // Clean up any existing HLS instance first
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying previous HLS instance:', e);
        }
        hlsRef.current = null;
      }

      // Clear video src to prevent MediaSource conflicts
      if (video.src && video.src.startsWith('blob:')) {
        video.removeAttribute('src');
        video.load();
      }

      if (!isMounted) {
        initializingRef.current = false;
        return;
      }
      
      // Reset loading states
      setLoadingProgress(0);
      setLoadingStage('Testing connection...');
      setConnectionSpeed('');
      setEstimatedTime('');
      
      // Test URL accessibility first
      const startTime = Date.now();
      try {
        console.log('🔗 Testing video URL accessibility:', streamUrl);
        setLoadingStage('Checking stream availability...');
        setLoadingProgress(10);
        
        const testResponse = await fetch(streamUrl, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        setLoadingProgress(25);
        setLoadingStage('Connection established');
        
        console.log('✅ URL test result:', {
          status: testResponse.status,
          headers: Object.fromEntries(testResponse.headers.entries()),
          responseTime: `${Math.round(elapsedTime * 1000)}ms`
        });
      } catch (testError) {
        console.error('❌ URL accessibility test failed:', testError);
        const errorMessage = testError instanceof Error ? testError.message : 'Unknown network error';
        if (isMounted) {
          onError?.(`Cannot access stream URL: ${errorMessage}`);
        }
        initializingRef.current = false;
        return;
      }
      
      if (!isMounted) {
        initializingRef.current = false;
        return;
      }

      // Handle HLS streams
      if (formatDetection.format === 'hls') {
        await initializeHlsPlayer(video, isMounted);
      } 
      // Handle direct video files
      else {
        await initializeDirectVideo(video, formatDetection, isMounted);
      }
    };

    // HLS Player Initialization
    const initializeHlsPlayer = async (video: HTMLVideoElement, isMounted: boolean) => {
      setIsHlsSupported(Hls.isSupported());
      
      if (Hls.isSupported()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎬 Initializing HLS.js for adaptive streaming...');
        }
        
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          debug: false, // Disable debug to reduce console noise
        });

        if (!isMounted) {
          hls.destroy();
          initializingRef.current = false;
          return;
        }

        hlsRef.current = hls;

        // Wait a frame to ensure video element is ready
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        if (!isMounted || !hlsRef.current) {
          if (hlsRef.current) hlsRef.current.destroy();
          initializingRef.current = false;
          return;
        }
        
        try {
          hls.attachMedia(video);
        } catch (attachError) {
          console.error('Error attaching media:', attachError);
          if (isMounted) {
            onError?.('Failed to initialize video player');
          }
          if (hlsRef.current) hlsRef.current.destroy();
          hlsRef.current = null;
          initializingRef.current = false;
          return;
        }

        // HLS Events with enhanced loading tracking
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('📺 HLS media attached');
          setIsLoading(true);
          setLoadingProgress(40);
          setLoadingStage('Initializing media source...');
          onLoadStart?.();
          hls.loadSource(streamUrl);
        });

        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          setLoadingProgress(50);
          setLoadingStage('Downloading manifest...');
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎬 4K Stream Ready:', {
              duration: data.levels[0]?.details?.totalduration ? `${Math.round(data.levels[0].details.totalduration)}s` : 'Unknown',
              qualityLevels: data.levels.length,
              codec: data.levels[0]?.videoCodec || 'Unknown'
            });
          }
          
          setLoadingProgress(75);
          setLoadingStage('Processing video tracks...');
          
          // Check codecs early
          if (data.levels && data.levels.length > 0) {
            const firstLevel = data.levels[0];
            if (firstLevel.videoCodec) {
              console.log('🎥 Video codec detected:', firstLevel.videoCodec);
              
              const codecCheck = checkCodecSupport(firstLevel.videoCodec);
              if (!codecCheck.supported && codecCheck.message) {
                console.warn('⚠️ Codec compatibility issue:', codecCheck.message);
                onError?.(`❌ ${codecCheck.message}

💡 Alternatively, you can use the standard player below as fallback.

📋 Detected codec: ${firstLevel.videoCodec}`);
                return;
              }
            }
          }
          
          // Extract available quality levels
          const levels = data.levels.map((level, index) => {
            const height = level.height;
            if (height >= 2160) return '4K';
            if (height >= 1080) return '1080p';
            if (height >= 720) return '720p';
            if (height >= 480) return '480p';
            return `${height}p`;
          });
          
          setAvailableQualities(['Auto', ...levels]);
          setLoadingProgress(90);
          setLoadingStage('Preparing playback...');
        });

        

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          // Update bytes loaded
          if (data.frag && data.frag.byteLength) {
            setBytesLoaded(prev => prev + (data.frag.byteLength || 0));
          }
          
          setLoadingProgress(95);
          setLoadingStage('Stream ready!');
              // Complete loading after a short delay
        setTimeout(() => {
          setIsLoading(false);
          setLoadingProgress(100);
          onLoadComplete?.();
          
          // Note: Auto-play will be handled by handleCanPlay event to avoid race conditions
          if (process.env.NODE_ENV === 'development') {
            console.log('🎬 HLS stream ready - auto-play will be handled by canplay event');
          }
        }, 500);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Quality level switched to:', data.level);
          }
          setCurrentLevel(data.level);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          // Filter out common non-fatal buffering warnings
          const ignorableErrors = [
            'bufferStalledError',
            'bufferNudgeOnStall',
            'bufferSeekOverHole'
          ];
          
          // Only log significant errors
          if (data.details && data.type && !ignorableErrors.includes(data.details)) {
            if (data.fatal) {
              console.error('❌ Fatal HLS Error:', {
                type: data.type,
                details: data.details,
                url: data.url
              });
            } else if (data.type === 'networkError' || data.type === 'mediaError') {
              console.warn('⚠️ HLS Warning:', {
                type: data.type,
                details: data.details
              });
            }
          }
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network Error Details:', data);
                onError?.(`Network error: ${data.details} - URL: ${data.url || streamUrl}`);
                // Try to start load again
                setTimeout(() => {
                  if (hlsRef.current) {
                    hlsRef.current.startLoad();
                  }
                }, 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media Error Details:', data);
                
                // Check for codec-related errors
                if (data.details === 'bufferAddCodecError' || 
                    (data.error && data.error.message && data.error.message.includes('codecs'))) {
                  const errorMsg = data.error?.message || '';
                  console.error('Codec Error Message:', errorMsg);
                  
                  // Extract codec info from error
                  const codecMatch = errorMsg.match(/codecs=([^)]+)/);
                  const codec = codecMatch ? codecMatch[1] : 'unknown';
                  
                  if (codec.includes('hvc1') || codec.includes('hev1') || 
                      errorMsg.includes('hvc1') || errorMsg.includes('hevc') || errorMsg.includes('h265')) {
                    onError?.(`❌ Unsupported Video Codec (H.265/HEVC)

🔧 This 4K stream uses H.265/HEVC codec which is not supported by most browsers.

💡 Solutions:
• Try Safari on Mac/iOS (has better H.265 support)
• Request an H.264 version of this content
• Use the standard player below as fallback

📋 Technical Details: ${data.details}
🔍 Codec: ${codec}`);
                  } else if (codec.includes('av01') || codec.includes('av1') || errorMsg.includes('av01')) {
                    onError?.(`❌ Unsupported Video Codec (AV1)

🔧 This stream uses AV1 codec which has limited browser support.

💡 Solutions:
• Try Chrome, Firefox, or Edge (latest versions)
• Request an H.264 version of this content
• Use the standard player below as fallback

📋 Technical Details: ${data.details}
🔍 Codec: ${codec}`);
                  } else {
                    onError?.(`❌ Unsupported Media Codec

🔧 The video codec in this stream is not supported by your browser.

💡 Solutions:
• Try a different browser (Chrome, Firefox, Safari, Edge)
• Use the standard player below as fallback

📋 Technical Details: ${data.details}
🔍 Codec: ${codec}
🔍 Error: ${errorMsg}`);
                  }
                } else {
                  onError?.(`Media error: ${data.details}`);
                  // Try to recover for other media errors
                  try {
                    hls.recoverMediaError();
                  } catch (recoverError) {
                    console.error('Failed to recover from media error:', recoverError);
                  }
                }
                break;
              default:
                console.error('Other HLS Error:', data);
                onError?.(`Streaming error: ${data.details || data.type || 'Unknown error'}`);
                break;
            }
          } else {
            // Filter non-fatal buffering warnings that are normal during playback
            const commonBufferingIssues = [
              'bufferStalledError',
              'bufferNudgeOnStall', 
              'bufferSeekOverHole',
              'bufferFullError'
            ];
            
            if (!commonBufferingIssues.includes(data.details)) {
              console.warn('⚠️ Non-fatal HLS warning:', {
                type: data.type,
                details: data.details
              });
            }
          }
        });

        hls.on(Hls.Events.BUFFER_APPENDING, () => {
          setIsBuffering(true);
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          setIsBuffering(false);
        });

        hls.on(Hls.Events.BUFFER_EOS, () => {
          setIsBuffering(false);
        });

        initializingRef.current = false;

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        console.log('🍎 Using native HLS support');
        video.src = streamUrl;
        setIsHlsSupported(true);
        onLoadComplete?.();
        
        initializingRef.current = false;
      } else {
        console.error('❌ HLS not supported');
        if (isMounted) {
          onError?.('Your browser does not support HLS streaming');
        }
        initializingRef.current = false;
      }
    };

    // Direct Video Player Initialization
    const initializeDirectVideo = async (video: HTMLVideoElement, formatDetection: any, isMounted: boolean) => {
      console.log(`🎬 Initializing direct video player for ${formatDetection.format.toUpperCase()} format...`);
      
      try {
        setLoadingProgress(50);
        setLoadingStage(`Loading ${formatDetection.format.toUpperCase()} video...`);
        
        // Set up video source with proper MIME type
        video.src = streamUrl;
        
        // For better compatibility, also set the type attribute
        if (formatDetection.mimeType) {
          // Remove any existing source elements first
          const existingSources = video.querySelectorAll('source');
          existingSources.forEach(source => source.remove());
          
          // Create a new source element with the correct MIME type
          const sourceElement = document.createElement('source');
          sourceElement.src = streamUrl;
          sourceElement.type = formatDetection.mimeType;
          video.appendChild(sourceElement);
        }
        
        // Set loading progress
        setLoadingProgress(60);
        setLoadingStage('Preparing video for playback...');
        
        // Wait for metadata to load
        const metadataPromise = new Promise((resolve, reject) => {
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve(true);
          };
          
          const handleError = (e: any) => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(e);
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(new Error('Metadata loading timeout'));
          }, 30000);
        });
        
        // Load the video
        video.load();
        
        // Wait for metadata
        await metadataPromise;
        
        if (!isMounted) {
          initializingRef.current = false;
          return;
        }
        
        console.log(`✅ ${formatDetection.format.toUpperCase()} video ready:`, {
          duration: video.duration ? `${Math.round(video.duration)}s` : 'Unknown',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          format: formatDetection.format,
          url: streamUrl
        });
        
        setLoadingProgress(90);
        setLoadingStage('Video ready!');
        
        // For direct videos, we don't have multiple quality levels like HLS
        // Set basic quality options based on video resolution
        if (video.videoHeight >= 2160) {
          setAvailableQualities(['4K']);
          setSelectedQuality('4K');
        } else if (video.videoHeight >= 1080) {
          setAvailableQualities(['1080p']);
          setSelectedQuality('1080p');
        } else if (video.videoHeight >= 720) {
          setAvailableQualities(['720p']);
          setSelectedQuality('720p');
        } else {
          setAvailableQualities(['SD']);
          setSelectedQuality('SD');
        }
        
        // Complete loading
        setTimeout(async () => {
          setIsLoading(false);
          setLoadingProgress(100);
          onLoadComplete?.();
          
          // Note: Auto-play will be handled by handleCanPlay event to avoid race conditions
          console.log('🎬 Direct video ready - auto-play will be handled by canplay event');
        }, 500);
        
        console.log(`✅ ${formatDetection.format.toUpperCase()} player initialization complete`);
        initializingRef.current = false;
        
      } catch (error) {
        console.error(`❌ Failed to initialize ${formatDetection.format.toUpperCase()} video:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Provide specific error messages for different video formats
        if (formatDetection.format === 'webm' && errorMessage.includes('not supported')) {
          onError?.(`❌ WebM Video Not Supported

🔧 Your browser doesn't support WebM video format.

💡 Solutions:
• Try Chrome, Firefox, or Opera (better WebM support)
• Request an MP4 version of this content
• Use the standard player below as fallback

📋 Error: ${errorMessage}`);
        } else if (formatDetection.format === 'mov' && errorMessage.includes('not supported')) {
          onError?.(`❌ MOV Video Not Supported

🔧 Your browser doesn't support MOV/QuickTime video format.

💡 Solutions:
• Try Safari (best MOV support)
• Request an MP4 version of this content
• Use the standard player below as fallback

📋 Error: ${errorMessage}`);
        } else if (formatDetection.format === 'avi' && errorMessage.includes('not supported')) {
          onError?.(`❌ AVI Video Not Supported

🔧 Your browser doesn't support AVI video format.

💡 Solutions:
• Convert to MP4 format for better compatibility
• Try a different browser
• Use the standard player below as fallback

📋 Error: ${errorMessage}`);
        } else if (formatDetection.format === 'mkv' && errorMessage.includes('not supported')) {
          onError?.(`❌ MKV Video Not Supported

🔧 Your browser doesn't support MKV/Matroska video format.

💡 Solutions:
• Convert to MP4 or WebM format
• Try Chrome or Firefox (limited MKV support)
• Use the standard player below as fallback

📋 Error: ${errorMessage}`);
        } else if (formatDetection.format === 'ogg' && errorMessage.includes('not supported')) {
          onError?.(`❌ OGG Video Not Supported

🔧 Your browser doesn't support OGG/Theora video format.

💡 Solutions:
• Try Firefox (better OGG support)
• Convert to MP4 or WebM format
• Use the standard player below as fallback

📋 Error: ${errorMessage}`);
        } else {
          onError?.(`❌ Video Loading Failed

🔧 Failed to load ${formatDetection.format.toUpperCase()} video.

💡 Solutions:
• Check your internet connection
• Try refreshing the page
• Use the standard player below as fallback

📋 Error: ${errorMessage}
🔍 Format: ${formatDetection.format}
🔗 URL: ${streamUrl}`);
        }
        
        initializingRef.current = false;
      }
    };

    // Initialize the appropriate player
    initializePlayer();

    return () => {
      isMounted = false; // Mark component as unmounted
      
      // Clean up HLS instance
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying HLS instance:', error);
        }
        hlsRef.current = null;
      }
      
      // Reset initialization flag
      initializingRef.current = false;
      
      // Reset video source to prevent memory leaks
      const video = videoRef.current;
      if (video && video.src && video.src.startsWith('blob:')) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [streamUrl, onError, onLoadStart, onLoadComplete]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    
    // Enhanced canplay handler with auto-play after buffering
    const handleCanPlay = async () => {
      setIsBuffering(false);
      
      // Handle auto-play decision centrally
      if (video.paused && currentTime > 0) {
        // Auto-play after buffering
        await handleAutoPlayDecision(video, 'after buffering');
      } else if (video.paused && currentTime === 0) {
        // Initial playback auto-play
        await handleAutoPlayDecision(video, 'initial canplay');
      }
    };

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      // Force controls to show when entering fullscreen
      if (document.fullscreenElement) {
        setShowControls(true);
        // Auto-hide controls after 3 seconds in fullscreen
        setTimeout(() => {
          if (document.fullscreenElement && isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      } else {
        setShowControls(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isPlaying, handleAutoPlayDecision]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // Clear auto-play failed state when user manually plays
      if (autoPlayFailed) {
        setAutoPlayFailed(false);
        if (process.env.NODE_ENV === 'development') {
          console.log('🎬 User manually started playback after auto-play failure');
        }
      }
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    
    // Automatically unmute if volume is increased from 0
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
    
    // Automatically mute if volume is set to 0
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
      videoRef.current.muted = true;
    }
  };

  const showVolumeDisplayTemporarily = () => {
    setShowVolumeDisplay(true);
    setTimeout(() => setShowVolumeDisplay(false), 2000);
  };

  const toggleFullscreen = () => {
    const playerContainer = videoRef.current?.parentElement; // Get the player container
    if (!playerContainer) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Make the entire player container fullscreen, not just the video
      playerContainer.requestFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    // Hide resume prompt if user manually seeks
    if (showResumePrompt) {
      setShowResumePrompt(false);
      setHasResumed(true);
    }
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    
    if (hlsRef.current) {
      if (quality === 'Auto') {
        hlsRef.current.currentLevel = -1; // Auto quality
        console.log('🔄 Switched to automatic quality selection');
      } else {
        // Find the level index for the selected quality
        const levels = hlsRef.current.levels;
        const levelIndex = levels.findIndex(level => {
          const height = level.height;
          if (quality === '4K' && height >= 2160) return true;
          if (quality === '1080p' && height >= 1080 && height < 2160) return true;
          if (quality === '720p' && height >= 720 && height < 1080) return true;
          if (quality === '480p' && height >= 480 && height < 720) return true;
          return false;
        });
        
        if (levelIndex !== -1) {
          hlsRef.current.currentLevel = levelIndex;
          console.log(`🔄 Manually switched to ${quality} (level ${levelIndex})`);
        }
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 10-second seek functions
  const seekBackward10 = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.currentTime > 10) {
      video.currentTime -= 10;
    } else {
      video.currentTime = 0;
    }
    console.log(`⏪ Seeked backward 10s to ${formatTime(video.currentTime)}`);
  };

  const seekForward10 = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.currentTime < video.duration - 10) {
      video.currentTime += 10;
    } else {
      video.currentTime = video.duration;
    }
    console.log(`⏩ Seeked forward 10s to ${formatTime(video.currentTime)}`);
  };

  const getCurrentQualityLabel = () => {
    if (!hlsRef.current || currentLevel === -1) return 'Auto';
    
    const level = hlsRef.current.levels[currentLevel];
    if (level) {
      const height = level.height;
      if (height >= 2160) return '4K';
      if (height >= 1080) return '1080p';
      if (height >= 720) return '720p';
      return `${height}p`;
    }
    return selectedQuality;
  };

  // Share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${title} in 4K Ultra HD!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // Could add a toast notification here
        console.log('URL copied to clipboard');
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  return (
    <>
      {/* Volume Slider Styles */}
      <style jsx>{`
        .volume-slider {
          background: linear-gradient(to right, #ffffff ${Math.round(volume * 100)}%, rgba(255,255,255,0.3) ${Math.round(volume * 100)}%);
        }
        
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        
        .volume-slider::-webkit-slider-track {
          background: transparent;
          border: none;
        }
        
        .volume-slider::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>

      {/* Video Player Container */}
      <div 
        className="relative w-full bg-black rounded-lg overflow-hidden aspect-video"
        style={{ minHeight: '400px', maxHeight: '80vh' }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          // Don't auto-hide controls in fullscreen unless playing
          if (!document.fullscreenElement || !isPlaying) {
            setShowControls(false);
          }
        }}
        onMouseMove={() => {
          // Show controls on mouse movement, especially important in fullscreen
          if (document.fullscreenElement) {
            setShowControls(true);
            // Auto-hide after 3 seconds if playing in fullscreen
            setTimeout(() => {
              if (document.fullscreenElement && isPlaying) {
                setShowControls(false);
              }
            }, 3000);
          }
        }}
      >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-cover"
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
      />

      {/* Volume Display Overlay */}
      {showVolumeDisplay && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-xl px-6 py-4 text-white pointer-events-none z-50 transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-8 h-8 text-red-400" />
            ) : (
              <Volume2 className="w-8 h-8 text-white" />
            )}
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl font-bold">
                  {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
              {/* Volume Bar */}
              <div className="w-20 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Loading/Buffering Overlay */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="text-white text-center max-w-md mx-auto p-6">
            {/* Spinner */}
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400/30 border-t-yellow-400 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-yellow-400 font-bold text-sm">{loadingProgress}%</span>
              </div>
            </div>

            {isLoading ? (
              <>
                {/* Main Loading Text */}
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Loading 4K Ultra HD
                </h3>
                
                {/* Loading Stage */}
                <p className="text-base font-medium mb-4 text-gray-200">
                  {loadingStage}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>

                {/* Connection Info */}
                {connectionSpeed && (
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionSpeed.includes('Excellent') ? 'bg-green-500' :
                      connectionSpeed.includes('Fast') ? 'bg-blue-500' :
                      connectionSpeed.includes('Good') ? 'bg-yellow-500' :
                      connectionSpeed.includes('Fair') ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-300">{connectionSpeed}</span>
                  </div>
                )}

                {/* Estimated Time */}
                {estimatedTime && (
                  <p className="text-sm text-gray-400">{estimatedTime}</p>
                )}

                {/* Data Usage */}
                {bytesLoaded > 0 && totalBytes > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {(bytesLoaded / (1024 * 1024)).toFixed(1)} MB / {(totalBytes / (1024 * 1024)).toFixed(1)} MB
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Buffering State */}
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  Buffering...
                </h3>
                
                <p className="text-base font-medium mb-4 text-gray-200">
                  Preparing smooth playback
                </p>
                
                {/* Buffer Health */}
                {bufferHealth > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${bufferHealth}%` }}
                    ></div>
                  </div>
                )}
                
                <p className="text-xs text-gray-400">
                  Buffer: {bufferHealth.toFixed(1)}% • Quality: {getCurrentQualityLabel()}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Elegant Resume Progress Overlay */}
      {showResumePrompt && savedProgress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-yellow-400/30 rounded-2xl p-8 max-w-lg mx-4 text-center shadow-2xl">
            {/* Golden accent line */}
            <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mx-auto mb-6"></div>
            
            <div className="mb-6">
              {/* Golden play icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full flex items-center justify-center border border-yellow-400/30 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10 text-yellow-400 ml-1">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Continue Watching
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Pick up where you left off at <span className="font-semibold text-yellow-400">{formatTime(savedProgress)}</span>
                <br />
                <span className="text-sm text-gray-400">
                  {Math.round((savedProgress / duration) * 100)}% completed
                </span>
              </p>
              
              {/* Elegant progress visualization */}
              <div className="w-full bg-gray-800/60 rounded-full h-3 mb-6 overflow-hidden border border-gray-700/50">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${duration ? (savedProgress / duration) * 100 : 0}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resumeFromSaved}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Resume
              </button>
              
              <button
                onClick={async () => {
                  setShowResumePrompt(false);
                  setHasResumed(true);
                  
                  // Clear auto-play states and attempt to auto-play from beginning
                  setAutoPlayFailed(false);
                  setAutoPlayAttempted(true);
                  
                  // Reset video to beginning
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                    
                    // Auto-play from beginning
                    try {
                      await videoRef.current.play();
                      if (process.env.NODE_ENV === 'development') {
                        console.log('▶️ Starting from beginning - Auto-playing');
                      }
                    } catch (error) {
                      console.warn('Auto-play failed when starting over:', error);
                      setAutoPlayFailed(true);
                      // If auto-play fails, the user can still click play manually
                    }
                  }
                }}
                className="px-6 py-3 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-xl transition-all duration-300 font-medium border border-gray-600/50 hover:border-gray-500/50"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HLS Status Badge */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          🎬 4K ULTRA HD
        </div>
        {isHlsSupported && (
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
            <Wifi className="w-3 h-3" />
            
          </div>
        )}
      </div>

      {/* Quality Indicator */}
      <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
        {getCurrentQualityLabel()}
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={togglePlay}
              className={`bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all duration-200 ${
                autoPlayFailed ? 'ring-4 ring-red-500/50 animate-pulse' : ''
              }`}
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white" />
              ) : (
                <Play className="w-12 h-12 text-white" />
              )}
            </button>
            
            {/* Auto-play failed message */}
            {autoPlayFailed && !isPlaying && !showResumePrompt && (
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm text-center max-w-xs">
                <div className="font-medium">Auto-play blocked</div>
                <div className="text-white/80 text-xs mt-1">
                  Click play button to start
                </div>
              </div>
            )}
            
            {/* Resume prompt takes priority over auto-play messages */}
            {showResumePrompt && !isPlaying && (
              <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm text-center max-w-xs">
                <div className="font-medium">Continue watching?</div>
                <div className="text-white/80 text-xs mt-1">
                  Choose to resume or start over
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Enhanced Progress Bar with Watched/Unwatched Colors */}
          <div className="mb-4 relative progress-bar-container group">
            <div className="relative w-full h-2 bg-white/20 rounded-lg overflow-hidden progress-track transition-all duration-200">
              {/* Buffer/Loaded portion (slightly lighter) */}
              <div 
                className="absolute top-0 left-0 h-full bg-white/15 transition-all duration-300"
                style={{ width: `${bufferHealth}%` }}
              />
              
              {/* Watched portion (golden gradient) */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-200 ease-out"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Saved progress indicator (if different from current) */}
              {savedProgress > 0 && duration > 0 && Math.abs(currentTime - savedProgress) > 10 && (
                <div 
                  className="absolute top-0 h-full w-0.5 bg-yellow-400 opacity-60 transition-all duration-300"
                  style={{ left: `${(savedProgress / duration) * 100}%` }}
                  title={`Previously watched up to ${formatTime(savedProgress)}`}
                />
              )}
            </div>
            
            {/* Invisible range input for interaction */}
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-2 appearance-none cursor-pointer bg-transparent"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: 'transparent',
                outline: 'none',
                zIndex: 10
              }}
            />
            
            {/* Custom thumb/handle */}
            <div 
              className="progress-thumb absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-yellow-400 shadow-lg transition-all duration-200 pointer-events-none"
              style={{ 
                left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)`,
                opacity: showControls ? 0.8 : 0
              }}
            />
            
            {/* Time tooltip - shows current time */}
            <div 
              className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ 
                left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 20px)`,
                transform: 'translateX(-50%)'
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* 10-second skip buttons */}
              <button
                onClick={seekBackward10}
                className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded"
                title="Skip backward 10 seconds (Q)"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={seekForward10}
                className="text-white hover:text-gray-300 transition-colors p-1 hover:bg-white/10 rounded"
                title="Skip forward 10 seconds (E)"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div 
                className="flex items-center space-x-2 relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>

                {/* Volume Slider */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    showVolumeSlider ? 'w-28 opacity-100' : 'w-0 opacity-0'
                  } overflow-hidden flex items-center space-x-3 bg-black/50 rounded-lg px-2 py-1`}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : Math.round(volume * 100)}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider volume-slider"
                  />
                  <span className="text-white text-xs w-10 text-center whitespace-nowrap font-medium">
                    {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              {/* Resume button (when there's saved progress) */}
              {savedProgress > 0 && duration > 0 && Math.abs(currentTime - savedProgress) > 10 && !showResumePrompt && (
                <button
                  onClick={resumeFromSaved}
                  className="text-yellow-400 hover:text-yellow-300 transition-colors text-xs bg-yellow-400/20 px-2 py-1 rounded"
                  title={`Resume from ${formatTime(savedProgress)}`}
                >
                  Resume
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Picture-in-Picture Button */}
              {isPiPSupported && (
                <button
                  onClick={togglePictureInPicture}
                  className={`text-white hover:text-gray-300 transition-colors ${
                    isPiPActive ? 'text-blue-400' : ''
                  }`}
                  title={isPiPActive ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
                >
                  <PictureInPicture className="w-5 h-5" />
                </button>
              )}

              {/* Cast Button */}
              {isCastSupported && (
                <button
                  onClick={toggleCast}
                  className={`text-white hover:text-gray-300 transition-colors ${
                    isCastActive ? 'text-blue-400' : ''
                  }`}
                  title={isCastActive ? 'Stop Casting' : 'Cast to Device'}
                >
                  <Cast className="w-5 h-5" />
                </button>
              )}

              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">{getCurrentQualityLabel()}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px]">
                    {availableQualities.map((quality) => (
                      <button
                        key={quality}
                        onClick={() => handleQualityChange(quality)}
                        className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          getCurrentQualityLabel() === quality
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {quality}
                        {quality === 'Auto' && (
                          <span className="text-xs opacity-70 block">Adaptive</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Slider */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
          }
          
          .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: none;
          }
        `
      }} />
    </div>
    
    {/* Action Buttons Row - Below the video player, same as regular player */}
    <div className="flex justify-center gap-1.5 sm:gap-3 md:gap-4 lg:gap-5 mt-4 mb-4 md:mb-6 px-2 md:px-2" style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* 4K Ultra Button - Currently Selected/Active */}
      <div className="flex-shrink-0">
        <button
          onClick={() => {
            // Switch back to regular sources
            onSwitchToRegular?.();
          }}
          className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 backdrop-blur-md border border-blue-400 text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-300 ease-out group ring-2 ring-blue-400/50"
          title="🎬 Currently watching in 4K Ultra HD - Click to switch to regular sources"
        >
          {/* Active indicator glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg animate-pulse"></div>
          
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 relative z-10">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
          </svg>
          <span className="text-xs sm:text-sm font-bold relative z-10">
            <span className="sm:hidden">4K</span>
            <span className="hidden sm:inline">✨ 4K Ultra</span>
          </span>
          
          {/* Selected indicator badge */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </button>
      </div>

      {/* Download Button */}
      <div className="flex-shrink-0">
        <DownloadButton mediaType={mediaType} mediaId={mediaId} seasonNumber={seasonNumber} episodeNumber={episodeNumber} />
      </div>

      {/* Share Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleShare}
          className="relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group"
          title="Share this content"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
            <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline text-xs sm:text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Save to Watchlist Button */}
      <div className="flex-shrink-0">
        <button
          onClick={async () => {
            if (isProcessingWatchlist || isWatchlistLoading) return;
            
            setIsProcessingWatchlist(true);
            const numericMediaId = typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId;
            
            try {
              if (isItemInWatchlist) {
                const result = await removeFromWatchlist(numericMediaId, mediaType);
                setIsItemInWatchlist(false);
              } else {
                const mediaItem = {
                  media_id: numericMediaId,
                  media_type: mediaType,
                  title: title,
                  poster_path: null,
                  overview: '',
                  release_date: ''
                };
                const result = await addToWatchlist(mediaItem);
                if (!result?.error) {
                  setIsItemInWatchlist(true);
                }
              }
            } catch (error) {
              console.error('❌ 4K Player - Watchlist operation failed:', error);
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
          )}
          <span className="hidden sm:inline text-xs sm:text-sm font-medium">
            {isProcessingWatchlist ? 'Processing...' : isWatchlistLoading ? 'Loading...' : isItemInWatchlist ? 'Saved' : 'Save'}
          </span>
        </button>
      </div>

      {/* Watch Party Button */}
      <WatchPartyButton
        mediaId={mediaId}
        mediaType={mediaType}
        title={title}
        posterPath={null}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        currentVideoUrl={streamUrl}
        selectedSourceIndex={0} // 4K is essentially index 0 for party purposes
      />

      {/* Comments Button */}
      {trailerId && (
        <YouTubeComments
          videoId={trailerId}
          inline={true}
          showLikes={false}
        />
      )}
    </div>
    </>
  );
};

export default FourKPlayer;
