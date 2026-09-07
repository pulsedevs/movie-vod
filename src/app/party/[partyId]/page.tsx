'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchParty } from '@/hooks/useWatchParty';
import { WatchParty, PartyParticipant, PartyMessage } from '@/types/watchParty';
import { StreamSource } from '@/types';
import PartyChat from '@/components/watchParty/PartyChat';
import PartyParticipants from '@/components/watchParty/PartyParticipants';
import PartyControls from '@/components/watchParty/PartyControls';
import { getRedirectUrlFromVideoUrl } from '@/utils/videoUrlParser';
import { Users, MessageCircle, Settings, ExternalLink, Copy, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ArrowLeft, Maximize2, Minimize2, Share2, Check, MoreVertical, X } from 'lucide-react';
import { StreamIframe } from '@/components/player/StreamIframe';
import { getObfuscatedSources } from '@/utils/urlObfuscation';
import { buildStreamEmbedUrlForParty } from '@/utils/streamEmbedUrl';
import { useMemo } from 'react';

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const partyId = params.partyId as string;
    const {
    currentParty,
    participants,
    messages,
    joinParty,
    leaveParty,
    sendMessage,
    deleteParty,
    updatePartyStatus,
    loading,
    error
  } = useWatchParty(partyId);
  
  const [videoSource, setVideoSource] = useState<string>('');
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);  const [isRedirecting, setIsRedirecting] = useState(false);
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showControls, setShowControls] = useState(false);  const [sidebarVisible, setSidebarVisible] = useState(true);  // Add mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [showFloatingButtons, setShowFloatingButtons] = useState(true);
  const [mobileView, setMobileView] = useState<'video' | 'chat' | 'participants'>('video');
  const [showMobileChatDrawer, setShowMobileChatDrawer] = useState(false);
  const [chatDrawerHeight, setChatDrawerHeight] = useState(0);
  const [isPiPMode, setIsPiPMode] = useState(false);

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);    return () => window.removeEventListener('resize', checkMobile);  }, []);
  
  // Get sources - try obfuscated first (client-side), fallback to empty array
  const sources = useMemo(() => {
    try {
      // Try obfuscated sources first (these work client-side with NEXT_PUBLIC_ vars)
      const obfuscatedSources = getObfuscatedSources();
      if (obfuscatedSources && obfuscatedSources.length > 0) {
        console.log('Using obfuscated sources:', obfuscatedSources.length);
        // Convert obfuscated format to StreamSource format
        return obfuscatedSources.map(source => ({
          name: source.name,
          baseUrls: {
            movie: source.movieUrl,
            tv: source.tvUrl
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to get obfuscated sources:', error);
    }
    
    console.warn('No obfuscated sources available - using fallback hardcoded sources');
    // Fallback to basic hardcoded sources for watch parties
    return [
      {
        name: 'Source 1',
        baseUrls: {
          movie: 'https://player.videasy.net/movie/',
          tv: 'https://player.videasy.net/tv/'
        }
      },
      {
        name: 'Source 2',
        baseUrls: {
          movie: 'https://spencerdevs.xyz/movie/',
          tv: 'https://spencerdevs.xyz/tv/'
        }
      },
      {
        name: 'Source 3',
        baseUrls: {
          movie: 'https://vidora.su/movie/',
          tv: 'https://vidora.su/tv/'
        }
      },
      {
        name: 'Source 4',
        baseUrls: {
          movie: 'https://player.vidsrc.co/embed/movie/',
          tv: 'https://player.vidsrc.co/embed/tv/'
        }
      }
    ];
  }, []);
  
  // Callback functions
  const loadVideoSource = useCallback(async () => {
    if (!currentParty) return;
    
    setIsLoadingVideo(true);
    setVideoError(null);
    
    try {
      if (sources.length === 0) {
        setVideoError('No video sources available. Please check configuration.');
        return;
      }      // PRIORITY 1: Use the exact source from party data (what the host was watching)
      // This ensures all participants watch using the same source the host selected
      if (currentParty.video_url) {
        console.log('Using stored video URL from party:', currentParty.video_url);
        setVideoSource(currentParty.video_url);
        
        // Find the matching source name for display
        if (typeof currentParty.selected_source_index === 'number' && 
            currentParty.selected_source_index >= 0 && 
            currentParty.selected_source_index < sources.length) {
          setCurrentProvider(sources[currentParty.selected_source_index].name);
        } else {
          setCurrentProvider('Unknown Source');
        }
        setVideoError(null);
        return;
      }
      
      // FALLBACK: Generate video URL if not stored (backward compatibility)
      let sourceIndex = 0;
      if (typeof currentParty.selected_source_index === 'number' && 
          currentParty.selected_source_index >= 0 && 
          currentParty.selected_source_index < sources.length) {
        sourceIndex = currentParty.selected_source_index;
      }
        const selectedSource = sources[sourceIndex];
      let videoUrl = '';
      
      const season = 1;
      const episode = 1;
      videoUrl = buildStreamEmbedUrlForParty(
        selectedSource,
        currentParty.media_type,
        currentParty.media_id,
        season,
        episode
      );
      
      if (videoUrl) {
        setVideoSource(videoUrl);
        setCurrentProvider(selectedSource.name);
        setVideoError(null);
      } else {
        setVideoError('Could not generate video URL for this content.');
      }
    } catch (error) {
      console.error('Failed to load video source:', error);
      setVideoError('Failed to load video source. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }  }, [currentParty, sources]);

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage]);

  const copyInviteCode = useCallback(async () => {
    if (currentParty?.invite_code) {
      await navigator.clipboard.writeText(currentParty.invite_code);
      setInviteCodeCopied(true);
      setTimeout(() => setInviteCodeCopied(false), 2000);
    }
  }, [currentParty?.invite_code]);
  const retryVideoSource = useCallback(() => {
    loadVideoSource();
  }, [loadVideoSource]);
  const handleBackButton = useCallback(async () => {
    if (!user || !partyId) {
      router.push('/');
      return;
    }
    
    try {
      // Leaving the party when back button is pressed
      await leaveParty(partyId);
      // Navigate back to home after leaving
      router.push('/');
    } catch (error) {
      console.error('Failed to leave party:', error);
      // Still navigate back even if leaving fails
      router.push('/');
    }
  }, [user, partyId, leaveParty, router]);  const handleDeleteParty = useCallback(async () => {
    // This function is now handled from the parties page
    // Keeping it for potential future use but not exposing in UI
    if (!user || !partyId || !currentParty) return;
    
    // Check if user is host
    const isCurrentUserHost = user.id === currentParty.host_id;
    if (!isCurrentUserHost) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this watch party? This action cannot be undone and all participants will be removed.'
    );
    
    if (!confirmed) return;
    
    try {
      // First end the party to notify participants
      await updatePartyStatus(partyId, 'ended');
      // Then delete it
      await deleteParty(partyId);
      // Navigate back to home after deleting
      router.push('/');
    } catch (error) {
      console.error('Failed to delete party:', error);
      console.error('Delete party error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        partyId,
        userId: user?.id,
        rawError: error
      });
      setJoinError('Failed to delete party. Please try again.');
    }
  }, [user, partyId, currentParty, updatePartyStatus, deleteParty, router]);

  // Effects - must be in consistent order
  // Load video source when party data is available
  useEffect(() => {
    if (currentParty?.media_id && currentParty?.media_type) {
      loadVideoSource();
    }
  }, [currentParty?.media_id, currentParty?.media_type, loadVideoSource]);

  // Join party on load if user is authenticated (only once)
  useEffect(() => {
    if (user && partyId && !hasJoined) {
      setHasJoined(true);
      
      joinParty(partyId)
        .then((result) => {
          if (result && result.videoUrl) {
            const redirectUrl = getRedirectUrlFromVideoUrl(result.videoUrl, result.selectedSourceIndex);
            if (redirectUrl) {
              setIsRedirecting(true);
              router.push(redirectUrl);
              return;
            }
          }
        })
        .catch((err: any) => {
          console.error('Failed to join party:', err);
          setJoinError(err instanceof Error ? err.message : 'Failed to join party');
        });
    }  }, [user?.id, partyId, hasJoined, joinParty, router]);

  // Redirect to login if not authenticated (but wait for auth to load)
  useEffect(() => {
    // TEMPORARILY DISABLED
  }, [user, loading, router]);

  // Show loading if auth is still loading (CRITICAL: This prevents 404 on page reload)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <div>Authenticating...</div>
        </div>
      </div>
    );
  }

  // Show loading if party data is loading or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg text-center">
          {isRedirecting ? (
            <>
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <div>Redirecting to video...</div>
            </>
          ) : (
            <>
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <div>Loading party...</div>
            </>
          )}
        </div>
      </div>
    );
  }
  if (error || joinError || !currentParty) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <h1 className="text-2xl font-bold mb-4">Party Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || joinError || 'This party does not exist, has ended, or the invite link is invalid.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Movies & TV Shows
            </button>
            <p className="text-sm text-gray-500">
              Create a new watch party from any movie or TV show page
            </p>
          </div>
        </div>      </div>
    );
  }

  const isHost = user?.id === currentParty.host_id;
  const participantCount = participants.length;
    // Mobile-specific handlers
  const toggleMobileChatDrawer = () => {
    setShowMobileChatDrawer(!showMobileChatDrawer);
    setChatDrawerHeight(showMobileChatDrawer ? 0 : 70); // 70% of screen - expanded height with glassmorphism
  };

  const togglePiPMode = () => {
    setIsPiPMode(!isPiPMode);
  };

  // Mobile video player handlers
  const enterFullscreenVideo = () => {
    setMobileView('video');
    setShowMobileChatDrawer(false);
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-black overflow-hidden relative">
        {/* Mobile Full-Screen Video */}
        <div className={`absolute inset-0 transition-all duration-300 ${
          isPiPMode ? 'top-4 right-4 w-32 h-20 rounded-lg shadow-2xl z-50' : ''
        }`}>
          {isLoadingVideo ? (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-white text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          ) : videoError ? (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-white text-center px-4">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                <p className="text-sm mb-4">{videoError}</p>
                <button
                  onClick={retryVideoSource}
                  className="px-4 py-2 bg-blue-600 rounded-lg text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : videoSource ? (
            <>
              <StreamIframe
                src={videoSource}
                title={currentParty.title}
                className="w-full h-full"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-white text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No stream available</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Top Overlay - Minimalist */}        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">            <button
              onClick={handleBackButton}
              className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 mx-3 text-center">
              <h1 className="text-white font-semibold text-sm truncate">
                {currentParty.title}
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400 font-medium">LIVE</span>
                <span className="text-xs text-gray-300">• {participantCount}</span>
              </div>
            </div>

            {/* Empty space - no more three dots here */}
            <div className="w-10 h-10"></div>
          </div>
        </div>        {/* Mobile Floating Action Buttons */}
        <div className="absolute right-4 bottom-20 z-40 space-y-3">
          {/* Show floating buttons only when enabled */}
          {showFloatingButtons && (
            <>
              {/* Chat Button */}
              <button
                onClick={toggleMobileChatDrawer}
                className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-full shadow-lg border border-white/30 relative"
              >
                <MessageCircle className="w-6 h-6" />
                {messages.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{messages.length > 9 ? '9+' : messages.length}</span>
                  </div>
                )}
              </button>

              {/* Participants Button */}
              <button
                onClick={() => setMobileView(mobileView === 'participants' ? 'video' : 'participants')}
                className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-full shadow-lg border border-white/30 relative"
              >
                <Users className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{participantCount}</span>
                </div>
              </button>

              {/* Share Button */}
              <button
                onClick={copyInviteCode}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-full shadow-lg"
              >
                {inviteCodeCopied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
              </button>
            </>
          )}

          {/* Three Dots Toggle Button - Always visible */}
          <button
            onClick={() => setShowFloatingButtons(!showFloatingButtons)}
            className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-full shadow-lg border border-white/30"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>{/* Remove the Mobile Controls Menu - No longer needed */}        {/* Mobile Chat Drawer - Only show if floating buttons are enabled */}
        {showMobileChatDrawer && showFloatingButtons && (
          <div className="absolute bottom-0 z-50 bg-black/70 backdrop-blur-2xl rounded-t-xl border-t border-white/30 flex flex-col shadow-2xl shadow-black/50"
               style={{ 
                 height: '70vh',
                 width: '100%',
                 left: '0',
                 right: '0',
                 background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.7) 100%)',
                 backdropFilter: 'blur(20px) saturate(180%)',
                 WebkitBackdropFilter: 'blur(20px) saturate(180%)'
               }}>{/* Drawer Handle - Enhanced Glassmorphism */}
            <div className="flex justify-center p-3 border-b border-white/20 flex-shrink-0 bg-white/5 backdrop-blur-md">
              <div className="w-16 h-1.5 bg-gradient-to-r from-white/30 via-white/60 to-white/30 rounded-full shadow-lg"></div>
            </div>

            {/* Chat Header - Enhanced with Glassmorphism */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 flex-shrink-0 bg-white/5 backdrop-blur-sm">
              <h3 className="text-white font-semibold text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Chat</span>
              </h3>
              <button
                onClick={toggleMobileChatDrawer}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all duration-200 flex items-center justify-center border border-white/20 hover:border-white/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Content - Constrained height for proper scrolling */}
            <div className="flex-1 min-h-0">
              <PartyChat 
                messages={messages} 
                onSendMessage={handleSendMessage}
                currentUserId={user?.id || ''}
                isMobile={true}
              />
            </div>
          </div>
        )}        {/* Mobile Participants Overlay - Enhanced Glassmorphism */}
        {mobileView === 'participants' && (
          <div className="absolute bottom-0 z-50 bg-black/70 backdrop-blur-2xl rounded-t-xl border-t border-white/30 shadow-2xl shadow-black/50"
               style={{ 
                 height: '70vh',
                 width: '100%',
                 left: '0',
                 right: '0',
                 background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.7) 100%)',
                 backdropFilter: 'blur(20px) saturate(180%)',
                 WebkitBackdropFilter: 'blur(20px) saturate(180%)'
               }}>
            {/* Participants Header - Enhanced */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Participants ({participantCount})</span>
              </h3>
              <button
                onClick={() => setMobileView('video')}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all duration-200 flex items-center justify-center border border-white/20 hover:border-white/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Participants Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <PartyParticipants 
                participants={participants} 
                hostId={currentParty.host_id} 
                currentUserId={user?.id}
                isMobile={true}
              />
            </div>        </div>
        )}
      </div>
    );
  }  // Desktop Layout - Transform to Mobile-Style Full-Screen Experience
  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Full-Screen Video Player */}
      <div className="absolute inset-0">
        {isLoadingVideo ? (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-white text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          </div>
        ) : videoError ? (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-white text-center px-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm mb-4">{videoError}</p>
              <button
                onClick={retryVideoSource}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : videoSource ? (
          <>
            <StreamIframe
              src={videoSource}
              title={currentParty.title}
              className="w-full h-full"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-white text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No stream available</p>
            </div>
          </div>
        )}
      </div>

      {/* Glassmorphism Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40">        <div className="bg-black/40 backdrop-blur-lg border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackButton}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            
            <div className="flex-1 mx-4 min-w-0 text-center">
              <h1 className="text-lg font-bold truncate bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {currentParty.title}
              </h1>
              <div className="flex items-center justify-center space-x-3 mt-1">
                <div className="flex items-center space-x-1 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-red-500/30">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-red-400">LIVE</span>
                </div>
                <span className="text-sm text-gray-300">{participantCount} participants</span>
              </div>
            </div>            {/* Empty space for symmetry */}
            <div className="w-12"></div>
          </div>
        </div>        {/* Remove Enhanced Controls Menu - No longer needed */}
      </div>      {/* Floating Action Buttons - Right Side */}
      <div className="absolute right-4 bottom-20 z-40 space-y-3">
        {/* Show floating buttons only when enabled */}
        {showFloatingButtons && (
          <>
            {/* Chat Button */}
            <button
              onClick={() => setShowMobileChatDrawer(!showMobileChatDrawer)}
              className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-full shadow-lg border border-white/30 relative hover:bg-white/30 transition-all duration-200 hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{messages.length > 9 ? '9+' : messages.length}</span>
                </div>
              )}
            </button>

            {/* Participants Button */}
            <button
              onClick={() => setMobileView(mobileView === 'participants' ? 'video' : 'participants')}
              className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-full shadow-lg border border-white/30 relative hover:bg-white/30 transition-all duration-200 hover:scale-105"
            >
              <Users className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{participantCount}</span>
              </div>
            </button>            {/* Share Button */}
            <button
              onClick={copyInviteCode}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            >
              {inviteCodeCopied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
            </button>
          </>
        )}

        {/* Three Dots Toggle Button - Always visible */}
        <button
          onClick={() => setShowFloatingButtons(!showFloatingButtons)}
          className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-full shadow-lg border border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>      {/* Chat Drawer - Enhanced Glassmorphism for Desktop - Only show if floating buttons are enabled */}
      {showMobileChatDrawer && showFloatingButtons && (
        <div className="absolute bottom-0 z-50 bg-black/70 backdrop-blur-2xl rounded-t-xl border-t border-white/30 flex flex-col shadow-2xl shadow-black/50"
             style={{ 
               height: '70vh',
               width: isMobile ? '100%' : '480px',
               left: isMobile ? '0' : '50%',
               right: isMobile ? '0' : 'unset',
               transform: isMobile ? 'none' : 'translateX(-50%)',
               background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.7) 100%)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)'
             }}>
          {/* Drawer Handle - Enhanced Glassmorphism */}
          <div className="flex justify-center p-3 border-b border-white/20 flex-shrink-0 bg-white/5 backdrop-blur-md">
            <div className="w-16 h-1.5 bg-gradient-to-r from-white/30 via-white/60 to-white/30 rounded-full shadow-lg"></div>
          </div>

          {/* Chat Header - Enhanced with Glassmorphism */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 flex-shrink-0 bg-white/5 backdrop-blur-sm">
            <h3 className="text-white font-semibold text-base flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Chat</span>
            </h3>
            <button
              onClick={() => setShowMobileChatDrawer(false)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all duration-200 flex items-center justify-center border border-white/20 hover:border-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 min-h-0">
            <PartyChat 
              messages={messages} 
              onSendMessage={handleSendMessage}
              currentUserId={user?.id || ''}
              isMobile={false}
            />
          </div>
        </div>
      )}      {/* Participants Overlay - Enhanced Glassmorphism */}
      {mobileView === 'participants' && (
        <div className="absolute bottom-0 z-50 bg-black/70 backdrop-blur-2xl rounded-t-xl border-t border-white/30 shadow-2xl shadow-black/50"
             style={{ 
               height: '70vh',
               width: isMobile ? '100%' : '480px',
               left: isMobile ? '0' : '50%',
               right: isMobile ? '0' : 'unset',
               transform: isMobile ? 'none' : 'translateX(-50%)',
               background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.7) 100%)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)'
             }}>
          {/* Participants Header - Enhanced */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Participants ({participantCount})</span>
            </h3>
            <button
              onClick={() => setMobileView('video')}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all duration-200 flex items-center justify-center border border-white/20 hover:border-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Participants Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <PartyParticipants 
              participants={participants} 
              hostId={currentParty.host_id} 
              currentUserId={user?.id}
              isMobile={false}
            />
          </div>
        </div>
      )}      {/* Host Controls Overlay - Enhanced Glassmorphism */}
      {showControls && (
        <div className="absolute bottom-0 z-50 bg-black/70 backdrop-blur-2xl rounded-t-xl border-t border-white/30 shadow-2xl shadow-black/50"
             style={{ 
               height: '70vh',
               width: isMobile ? '100%' : '480px',
               left: isMobile ? '0' : '50%',
               right: isMobile ? '0' : 'unset',
               transform: isMobile ? 'none' : 'translateX(-50%)',
               background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.7) 100%)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)'
             }}>
          {/* Settings Header - Enhanced */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>Party Settings</span>
            </h3>
            <button
              onClick={() => setShowControls(false)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all duration-200 flex items-center justify-center border border-white/20 hover:border-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <PartyControls 
              party={currentParty}
              onUpdateParty={() => {
                // Refresh party data after updates
                // This could trigger a reload of party data if needed
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
