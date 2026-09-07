"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ChevronDown, MessageCircle, Heart, ThumbsUp, SendHorizonal, X } from "lucide-react";

interface YouTubeCommentsProps {
  videoId: string;
  // No longer need API key as we'll use our secure API endpoint
  // When true, display as an inline button (next to download button)
  inline?: boolean;
  /** Compact tile matching v2 detail panel action buttons */
  variant?: 'default' | 'panel';
  className?: string;
  // Optional like count for the video
  likeCount?: number;
  // Whether to show likes count in the button
  showLikes?: boolean;
}

interface CommentItem {
  id: string; // commentThread ID
  snippet: {
    topLevelComment: {
      id: string; // actual comment ID
      snippet: {
        authorProfileImageUrl: string;
        authorDisplayName: string;
        publishedAt: string;
        textDisplay: string; // Or textOriginal if you prefer plain text
        likeCount?: number;
      };
    };
  };
}

// Format large numbers (e.g., 1000 → 1K, 1000000 → 1M)
const formatCount = (count: number | string): string => {
  if (typeof count === 'string') {
    count = parseInt(count);
  }
  if (isNaN(count) || count === null) return '0';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Format date to relative time (e.g., "2 days ago")
const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInSecs < 60) return 'just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 30) return `${diffInDays}d ago`;
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${diffInYears}y ago`;
};

// Helper function to check if comment contains timestamps, specific phrases, words, or restricted scripts
const hasTimestampOrRestrictedContent = (text: string, strictNumberFiltering: boolean = false): boolean => {
  // Remove HTML tags
  const strippedText = text.replace(/<[^>]*>/g, '').trim();
  
  // Skip empty comments
  if (strippedText.length === 0) return false;
  
  // Check for timestamp pattern anywhere in the text (e.g., 1:23, 12:34, 1:23:45)
  const timestampRegex = /\d+:\d{2}(?::\d{2})?\b/;
  if (timestampRegex.test(strippedText)) {
    console.log(`Filtered out timestamp in: "${strippedText}"`);
    return true;
  }
  
  // Check for the phrase "where can I watch this movie?" (case-insensitive)
  const phraseRegex = /where can I watch this movie\?/i;
  if (phraseRegex.test(strippedText)) {
    console.log(`Filtered out phrase "where can I watch this movie?" in: "${strippedText}"`);
    return true;
  }
  
  // Check for the words "trailer" or "trailers" (case-insensitive, standalone words)
  const trailerRegex = /\btrailer(s)?\b/i;
  if (trailerRegex.test(strippedText)) {
    console.log(`Filtered out word "trailer" or "trailers" in: "${strippedText}"`);
    return true;
  }
  
  // Check for non-Latin scripts (Japanese, Chinese, Korean, etc.), excluding Arabic and Latin
  const restrictedScriptRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;
  if (restrictedScriptRegex.test(strippedText)) {
    console.log(`Filtered out restricted script (e.g., Japanese, Chinese, Korean) in: "${strippedText}"`);
    return true;
  }
  
  // Optional: Strict filtering for any numbers
  if (strictNumberFiltering) {
    const hasNumbers = /\d/.test(strippedText);
    if (hasNumbers) {
      console.log(`Filtered out numbers in: "${strippedText}"`);
      return true;
    }
  }
    return false;
};

const YouTubeComments: React.FC<YouTubeCommentsProps> = ({ 
  videoId, 
  inline = false,
  variant = 'default',
  className,
  likeCount, 
  showLikes = false
}) => {
  const [totalCommentCount, setTotalCommentCount] = useState<string | null>(null);
  const [videoLikeCount, setVideoLikeCount] = useState<string | null>(likeCount ? formatCount(likeCount) : null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [filteredComments, setFilteredComments] = useState<CommentItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  
  // Animation states
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [commentPanelAnimation, setCommentPanelAnimation] = useState('translate-y-full');
    // Comment loading state
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const scrollObserverRef = useRef<HTMLDivElement>(null);
  const MAX_RESULTS_PER_PAGE = 20; // Increased for better scrolling experience
  
  // Formatted comment count for display
  const formattedCommentCount = useMemo(() => {
    if (totalCommentCount === null || totalCommentCount === "N/A") {
      return "0";
    }
    return formatCount(totalCommentCount);
  }, [totalCommentCount]);
  // Function to fetch initial video stats
  const fetchInitialStats = useCallback(async () => {
    try {
      setLoadingInitial(true);
      const res = await fetch(`/api/youtube?action=videoInfo&videoId=${videoId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch video statistics: ${res.status}`);
      }
      const data = await res.json();
      if (data.items && data.items.length > 0 && data.items[0].statistics) {
        setTotalCommentCount(data.items[0].statistics.commentCount || "0");
        
        // Only set like count if not already provided as prop
        if (!likeCount && data.items[0].statistics.likeCount) {
          setVideoLikeCount(formatCount(data.items[0].statistics.likeCount));
        }
      } else {
        setTotalCommentCount("N/A");
        if (!likeCount) {
          setVideoLikeCount("N/A");
        }
      }
    } catch (err: any) {
      setError(prev => prev ? `${prev}\n${err.message}` : err.message);
      setTotalCommentCount("N/A"); // Indicate error or unavailability
      if (!likeCount) {
        setVideoLikeCount("N/A");
      }
    } finally {
      setLoadingInitial(false);
    }
  }, [videoId, likeCount]);

  // Filter out comments that contain timestamps, specific phrases, words, or restricted scripts
  useEffect(() => {
    const filtered = comments.filter(
      comment => !hasTimestampOrRestrictedContent(comment.snippet.topLevelComment.snippet.textDisplay, false)
    );
    setFilteredComments(filtered);
  }, [comments]);
  // Function to fetch comments
  const fetchCommentsPage = useCallback(async (pageToken: string | null = null) => {
    if ((pageToken === null && comments.length > 0) || loadingMore) {
      return; // Prevent duplicate fetches
    }
    
    const isLoadingMore = pageToken !== null;
    
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoadingInitial(true);
      setComments([]); // Clear old comments for an initial fetch
    }
    setError(null);
    
    try {
      // Use our secure API endpoint instead of directly calling YouTube API
      let url = `/api/youtube?action=comments&videoId=${videoId}&maxResults=${MAX_RESULTS_PER_PAGE}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to fetch comments: ${res.status}`);
      }
      const data = await res.json();

      // Check if response has valid items
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from API');
      }

      setComments(prevComments => {
        const newComments = isLoadingMore ? [...prevComments, ...data.items] : data.items;
        return newComments;
      });
      
      if (data.nextPageToken) {
        setNextPageToken(data.nextPageToken);
        setReachedEnd(false);
      } else {
        setNextPageToken(null);
        setReachedEnd(true);
      }
    } catch (err: any) {
      setError(prev => prev ? `${prev}\n${err.message}` : err.message);
      console.error('Error fetching comments:', err.message);
    } finally {
      if (isLoadingMore) {
        setLoadingMore(false);
      } else {
        setLoadingInitial(false);
      }
    }
  }, [videoId, comments.length, loadingMore]);

  // Initial data fetch - only fetch stats, not comments
  useEffect(() => {
    if (!videoId) {
        setError("Video ID missing.");
        setLoadingInitial(false);
        return;
    }
    fetchInitialStats();
  }, [videoId, fetchInitialStats]);

  // Set up Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!showCommentPanel || !scrollObserverRef.current || !nextPageToken || loadingMore || reachedEnd) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && nextPageToken) {
          fetchCommentsPage(nextPageToken);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(scrollObserverRef.current);
    
    return () => {
      if (scrollObserverRef.current) {
        observer.unobserve(scrollObserverRef.current);
      }
    };
  }, [showCommentPanel, nextPageToken, loadingMore, reachedEnd, fetchCommentsPage]);
  // Handle comment panel animations and dispatch events for bottom nav visibility
  useEffect(() => {
    // Import events from Footer component (avoiding circular dependencies by using strings)
    const HIDE_BOTTOM_NAV_EVENT = 'hideBottomNav';
    const SHOW_BOTTOM_NAV_EVENT = 'showBottomNav';

    if (isExpanded) {
      // Show the comment panel first
      setShowCommentPanel(true);
      // Then animate it into view after a small delay
      setTimeout(() => {
        setCommentPanelAnimation('translate-y-0');
      }, 10);
      
      // Add body scroll lock
      document.body.style.overflow = 'hidden';
      
      // Dispatch custom event to hide bottom navigation
      window.dispatchEvent(new Event(HIDE_BOTTOM_NAV_EVENT));
    } else {
      // Animate the panel out of view
      setCommentPanelAnimation('translate-y-full');
      // Then hide it completely after animation completes
      setTimeout(() => {
        setShowCommentPanel(false);
        // Remove body scroll lock
        document.body.style.overflow = '';
        
        // Dispatch custom event to show bottom navigation
        window.dispatchEvent(new Event(SHOW_BOTTOM_NAV_EVENT));
      }, 300); // Match the transition duration in your CSS
    }
    
    return () => {
      // Cleanup: ensure body scroll is restored when component unmounts
      document.body.style.overflow = '';
      
      // Ensure bottom nav is restored when component unmounts
      window.dispatchEvent(new Event(SHOW_BOTTOM_NAV_EVENT));
    };
  }, [isExpanded]);
    // Toggle expand and load comments if needed
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Only fetch comments if expanding and comments haven't been loaded yet
    if (newExpandedState && !commentsLoaded && filteredComments.length === 0) {
      fetchCommentsPage();
      setCommentsLoaded(true);
    }
  };
  
  // Function to refresh comments
  const refreshComments = async () => {
    setComments([]);
    await fetchCommentsPage();
  };

  // UI Rendering - Only show loading during initial stats fetch
  if (loadingInitial && !commentsLoaded && !isExpanded) {
    return (
      <div className="p-4 rounded-lg bg-gray-800/50 animate-pulse flex items-center justify-center w-full md:max-w-2xl mx-auto">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        
      </div>
    );
  }

  if (error && filteredComments.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <>
      {inline ? (
        variant === 'panel' ? (
          <button
            type="button"
            onClick={toggleExpand}
            className={
              className ??
              'flex min-h-[2.75rem] w-full flex-col items-center justify-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1 py-1.5 text-zinc-200 transition-colors hover:bg-white/[0.07]'
            }
            aria-label="Show Comments"
            title="View Comments"
          >
            <MessageCircle className="h-3 w-3 shrink-0 text-blue-400" />
            <span className="text-[9px] font-semibold leading-none">
              {formattedCommentCount}
            </span>
          </button>
        ) : (
        <button
          onClick={toggleExpand}
          className="relative inline-flex items-center justify-center gap-2 w-auto px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group group-hover:ring-2 group-hover:ring-white/30"
          aria-label="Show Comments"
          title="View Comments"
        >          {/* Comments Icon & Count */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:text-blue-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">{formattedCommentCount}</span>
          </div>

          {/* Vertical Divider */}
          {showLikes && videoLikeCount && videoLikeCount !== "N/A" && (
            <div className="h-4 w-px bg-white/30 mx-1 sm:mx-2"></div>
          )}

          {/* Likes Icon & Count */}
          {showLikes && videoLikeCount && videoLikeCount !== "N/A" && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 group-hover:text-red-300">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.004-.004.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium">{videoLikeCount}</span>
            </div>
          )}
        </button>
        )
      ) : (
        // Standard floating button style
        <div className="flex justify-center mt-4">
          <button
            onClick={toggleExpand}
            className="group relative flex flex-col items-center gap-2 transition-transform hover:scale-110 duration-300 ease-in-out"
            aria-label="Show comments"
          >
            <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900 rounded-full shadow-lg border-2 border-blue-500/40 overflow-hidden hover:border-blue-400 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-red-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <MessageCircle className="w-7 h-7 text-white group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[22px] h-[22px] text-[10px] font-bold bg-blue-600 text-white rounded-full px-1 border-2 border-blue-400/50 shadow-lg">{formattedCommentCount}</span>
            </div>
            {/* Stats badges with counter text */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Comment count badge */}
              <div className="flex items-center justify-center px-2.5 py-1 bg-gradient-to-r from-blue-700 to-blue-900 backdrop-blur-sm text-white font-medium text-xs rounded-full shadow-lg border border-blue-500/50 transform transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400">
                <span>{formattedCommentCount}</span>
              </div>
              {/* Like count badge - only shown when showLikes is true and we have like data */}
              {showLikes && videoLikeCount && videoLikeCount !== "N/A" && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center px-2.5 py-1 bg-gradient-to-r from-red-700 to-red-900 backdrop-blur-sm text-white font-medium text-xs rounded-full shadow-lg border border-red-500/50 transform transition-all duration-300 group-hover:scale-105 group-hover:border-red-400">
                    <span>{videoLikeCount}</span>
                  </div>
                  <Heart className="w-3.5 h-3.5 text-red-300 fill-red-300" strokeWidth={0} />
                </div>
              )}
            </div>
          </button>
        </div>
      )}
      
      {/* Full-screen comment overlay (Enhanced) */}
      {showCommentPanel && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          onClick={() => setIsExpanded(false)}
        >
          {/* Comment panel that slides up */}
          <div 
            className={`fixed bottom-0 inset-x-0 mx-auto max-w-3xl z-50 bg-gradient-to-b from-gray-900 to-black rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out ${commentPanelAnimation} border-t-2 border-blue-500/50`}
            style={{ maxHeight: '85vh', height: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full h-full flex flex-col relative">
              {/* Handle and Header */}
              <div className="sticky top-0 z-10 rounded-t-3xl border-b border-gray-800 bg-gradient-to-r from-blue-900/30 to-blue-800/20">
                <div className="w-12 h-1.5 bg-blue-500/60 rounded-full mx-auto mt-3 mb-2"></div>
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">
                      {totalCommentCount !== null && totalCommentCount !== "N/A" 
                        ? `${Number(totalCommentCount).toLocaleString()} Comments` 
                        : "Comments"}
                    </h3>
                      {/* Add a small badge for likes if available */}
                    {showLikes && videoLikeCount && videoLikeCount !== "N/A" && (
                      <div className="flex items-center gap-1.5 ml-2 bg-red-900/40 rounded-full px-2 py-0.5 border border-red-500/30">
                        <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                        <span className="text-xs text-red-200">{videoLikeCount}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    
              
                    {/* Close button */}
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 hover:bg-blue-800/30 rounded-full transition-colors"
                      aria-label="Close comments"
                    >
                      <X className="w-5 h-5 text-gray-300 hover:text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments section */}
              <div 
                ref={commentsContainerRef}
                className="overflow-y-auto h-full pb-20 flex-grow"
                style={{ maxHeight: 'calc(85vh - 80px)' }}
              >
                {/* Show loading indicator when loading comments */}
                {loadingInitial && filteredComments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-blue-300 font-medium">Loading comments...</p>
                  </div>
                )}
                
                {error && filteredComments.length === 0 && !loadingInitial && (
                  <div className="p-8 text-center">
                    <p className="text-zinc-500 text-sm">Comments unavailable</p>
                  </div>
                )}
                
                {filteredComments.length > 0 ? (
                  <div className="divide-y divide-gray-800/50">
                    {filteredComments.map((item) => {
                      const commentDate = new Date(item.snippet.topLevelComment.snippet.publishedAt);
                      const likeCount = item.snippet.topLevelComment.snippet.likeCount || 0;
                      
                      return (
                        <div key={item.id} className="p-4 hover:bg-blue-900/20 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Enhanced avatar with border */}
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-50 blur-[1px]"></div>
                              <img 
                                src={item.snippet.topLevelComment.snippet.authorProfileImageUrl} 
                                alt={`${item.snippet.topLevelComment.snippet.authorDisplayName}'s avatar`}
                                className="relative w-9 h-9 rounded-full bg-gray-700 object-cover border border-blue-500/40" 
                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/36')}
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-baseline flex-wrap gap-x-2">
                                <span className="font-medium text-white">
                                  {item.snippet.topLevelComment.snippet.authorDisplayName}
                                </span>
                                <span className="text-xs text-blue-400/70">
                                  {getRelativeTimeString(commentDate)}
                                </span>
                              </div>
                              <p className="mt-1 text-gray-200 whitespace-pre-line text-sm">
                                {item.snippet.topLevelComment.snippet.textDisplay}
                              </p>
                              
                              {/* Enhanced action buttons with better spacing */}
                              <div className="flex items-center gap-6 mt-2 text-xs">
                                <button className="flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors group">
                                  <Heart className="w-4 h-4 group-hover:fill-red-400/30 transition-all" />
                                  <span>{formatCount(likeCount)}</span>
                                </button>
                                <button className="flex items-center gap-2 text-blue-400/70 hover:text-blue-400 transition-colors">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                    {/* Scroll observer element for infinite scrolling */}
                    <div 
                      ref={scrollObserverRef} 
                      className="p-4 flex justify-center"
                    >
                      {loadingMore && (
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 relative mb-2">
                            <svg className="animate-spin w-full h-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <span className="text-sm text-blue-400 font-medium">Loading more comments...</span>
                        </div>
                      )}
                    </div>
                    
                    {/* End of comments message - Enhanced styling */}
                    {reachedEnd && !loadingMore && (
                      <div className="p-8 text-center">
                        <div className="inline-block bg-gradient-to-r from-blue-900/40 to-blue-800/30 rounded-full px-5 py-2 border border-blue-500/30">
                          <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
                            End of comments
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : !loadingInitial && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-blue-400/70" />
                    </div>
                    <p className="text-blue-200 font-medium">No comments to display</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to comment on this video</p>
                  </div>
                )}
              </div>
              
              {/* Comment input field (faux) - enhanced styling */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900/30 to-blue-800/20 backdrop-blur-sm border-t border-blue-500/30 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 bg-black/50 rounded-full px-4 py-2.5 text-gray-300 text-sm border border-blue-500/30 focus-within:border-blue-400/70 transition-colors">
                  Add a comment...
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-full text-white transition-colors shadow-lg shadow-blue-900/40">
                  <SendHorizonal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default YouTubeComments;