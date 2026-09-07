'use client';

import { useEffect, useState, useRef } from 'react';
import { useHybridData } from '@/hooks/useHybridData';
import MediaCard from '@/components/media/MediaCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Tv, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
// Lazy load framer-motion to reduce initial bundle size
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';

// Dynamic import for motion components
// Use simple components in development to avoid HMR issues
const MotionDiv = dynamic(
  () => process.env.NODE_ENV === 'development' 
    ? import('@/components/motion/SimpleMotionDiv').catch(() => ({ default: ({ children, ...props }: any) => <div {...props}>{children}</div> }))
    : import('@/components/motion/SafeMotionDiv').catch(() => ({ default: ({ children, ...props }: any) => <div {...props}>{children}</div> })), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-16 bg-gray-800/30 rounded-lg animate-pulse flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
        </div>
      </div>
    )
  }
);

export default function LibraryPage() {
  const { toasts, showToast } = useToast();
  const { watchlist, addToWatchlist, removeFromWatchlist, clearWatchlist, isInWatchlist, isLoading } = useHybridData();    // Function to move item from continue watching to watchlist
  const handleFinishLater = (id: number | string, media_type: string) => {
    // Find the item to move
    const itemToMove = continueWatching.find(item => item.id === id && item.media_type === media_type);
    
    if (itemToMove) {
      // Check if already in watchlist to prevent duplicates
      if (isInWatchlist(id, media_type as 'movie' | 'tv')) {
        // Just remove from continue watching if already in watchlist
        handleRemoveContinue(id, media_type);
        return;
      }
      
      // Create watchlist item format
      const watchlistItem = {
        id: itemToMove.id,
        title: itemToMove.title || itemToMove.name,
        name: itemToMove.name || itemToMove.title,
        poster_path: itemToMove.poster_path,
        backdrop_path: itemToMove.backdrop_path,
        release_date: itemToMove.release_date || itemToMove.first_air_date,
        first_air_date: itemToMove.first_air_date || itemToMove.release_date,
        overview: itemToMove.overview,
        vote_average: itemToMove.vote_average,
        media_type: itemToMove.media_type,
        genre_ids: itemToMove.genre_ids || []
      };
      
      // Add to watchlist
      addToWatchlist(watchlistItem);
      
      // Remove from continue watching
      handleRemoveContinue(id, media_type);
    }
  };  const [mounted, setMounted] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'movie' | 'tv'>('movie');
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [watchedHistory, setWatchedHistory] = useState<any[]>([]);
  const [libraryTab, setLibraryTab] = useState<'want-to-watch' | 'currently-watching' | 'watched'>('want-to-watch');
  const router = useRouter();
  
  // Dialog states
  const [showWatchlistDialog, setShowWatchlistDialog] = useState(false);
  const [showContinueWatchingDialog, setShowContinueWatchingDialog] = useState(false);
  const [showWatchHistoryDialog, setShowWatchHistoryDialog] = useState(false);
  
  // For scrolling containers
  const scrollContainerRefs = {
    recentlyAdded: useRef<HTMLDivElement>(null),
    actionMovies: useRef<HTMLDivElement>(null),
    comedyShows: useRef<HTMLDivElement>(null),
    recentlyWatched: useRef<HTMLDivElement>(null),
    almostFinished: useRef<HTMLDivElement>(null),
  };
  // To avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Load continue watching and watched history from localStorage
    if (typeof window !== 'undefined') {
      const continueData = localStorage.getItem('continueWatching');
      if (continueData) {
        setContinueWatching(JSON.parse(continueData));
      }
      
      // Load watched history if it exists
      const watchedData = localStorage.getItem('watchedHistory');
      if (watchedData) {
        setWatchedHistory(JSON.parse(watchedData));
      }
    }
  }, []);
  // Remove item from continue watching
  const handleRemoveContinue = (id: number | string, media_type: string) => {
    const updated = continueWatching.filter(item => !(item.id === id && item.media_type === media_type));
    setContinueWatching(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('continueWatching', JSON.stringify(updated));
    }
  };
  
  // Remove item from watched history
  const handleRemoveWatched = (id: number | string, media_type: string) => {
    const updated = watchedHistory.filter(item => !(item.id === id && item.media_type === media_type));
    setWatchedHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('watchedHistory', JSON.stringify(updated));
    }
  };
  // Mark item as watched (move from continue watching to watched history)
  const handleMarkAsWatched = (id: number | string, media_type: string) => {
    // Find the item to move
    const itemToMove = continueWatching.find(item => item.id === id && item.media_type === media_type);
    
    if (itemToMove) {
      // Check if item already exists in watched history
      const existingWatchedIndex = watchedHistory.findIndex(
        item => item.id === id && item.media_type === media_type
      );
      
      // Create the watched item
      const watchedItem = {
        ...itemToMove,
        progress: 100, // Mark as 100% complete
        watchedAt: new Date().toISOString() // Add timestamp
      };
      
      let updatedWatchedHistory;
      
      if (existingWatchedIndex !== -1) {
        // Update existing entry with new watch date (move to top)
        updatedWatchedHistory = [...watchedHistory];
        updatedWatchedHistory.splice(existingWatchedIndex, 1); // Remove old entry
        updatedWatchedHistory.unshift(watchedItem); // Add updated entry at the beginning
      } else {
        // Add new entry to the beginning
        updatedWatchedHistory = [watchedItem, ...watchedHistory];
      }
      
      setWatchedHistory(updatedWatchedHistory);
      
      // Remove from continue watching
      const updatedContinueWatching = continueWatching.filter(
        item => !(item.id === id && item.media_type === media_type)
      );
      setContinueWatching(updatedContinueWatching);
      
      // Remove from watchlist when marked as finished
      removeFromWatchlist(id, media_type as 'movie' | 'tv');
      
      // Save both to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('watchedHistory', JSON.stringify(updatedWatchedHistory));
        localStorage.setItem('continueWatching', JSON.stringify(updatedContinueWatching));
      }
      
      // Switch to watched tab if needed
      if (libraryTab === 'currently-watching' && updatedContinueWatching.length === 0) {
        setLibraryTab('watched');
      }
    }
  };
  // Add CSS for our options menu in the <head> of the document
  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined') {
      // Create style element for the action menu
      const style = document.createElement('style');
      style.id = 'action-options-menu-styles'; // Add ID for safer removal
      style.innerHTML = `
        .action-options-menu {
          position: absolute;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 4px;
          padding: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          min-width: 150px;
        }
        .action-option {
          color: white;
          font-size: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .action-option:hover {
          background-color: rgba(55, 65, 81, 1);
        }
        .action-option svg {
          margin-right: 0.5rem;
        }
        
        /* Mark as Finished button styling */
        @media (max-width: 640px) {
          .mark-finished-text {
            font-size: 9px; /* Make text smaller on mobile */
          }
        }
      `;
      document.head.appendChild(style);
      
      // Cleanup
      return () => {
        // Safe removal - check if element exists and has a parent
        const existingStyle = document.getElementById('action-options-menu-styles');
        if (existingStyle && existingStyle.parentNode) {
          existingStyle.parentNode.removeChild(existingStyle);
        }
      };
    }
  }, []);
  // Function to show the options menu for a media item
  const showOptionsMenu = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    
    // Remove any existing menu safely
    const existingMenu = document.querySelector('.action-options-menu');
    if (existingMenu && existingMenu.parentNode) {
      existingMenu.parentNode.removeChild(existingMenu);
    }
    
    // Create options menu element
    const rect = e.currentTarget.getBoundingClientRect();
    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'action-options-menu';
    optionsMenu.style.position = 'fixed';
    optionsMenu.style.top = rect.bottom + 'px';
    optionsMenu.style.left = (rect.left - 100) + 'px';
    
    // Helper function to safely remove menu
    const safeRemoveMenu = () => {
      if (optionsMenu && optionsMenu.parentNode) {
        optionsMenu.parentNode.removeChild(optionsMenu);
      }
    };
    
    // Option 1: Mark as Finished
    const finishedOption = document.createElement('div');
    finishedOption.className = 'action-option';
    finishedOption.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Mark as Finished';
    finishedOption.onclick = () => {
      handleMarkAsWatched(item.id, item.media_type);
      safeRemoveMenu();
    };
    
    // Option 2: Finish Later (move to watchlist)
    const watchLaterOption = document.createElement('div');
    watchLaterOption.className = 'action-option';
    watchLaterOption.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Finish Later';
    watchLaterOption.onclick = () => {
      // Move from continue watching to watchlist
      handleFinishLater(item.id, item.media_type);
      safeRemoveMenu();
    };
    
    // Option 3: Remove
    const removeOption = document.createElement('div');
    removeOption.className = 'action-option';
    removeOption.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Remove';
    removeOption.onclick = () => {
      handleRemoveContinue(item.id, item.media_type);
      safeRemoveMenu();
    };
    
    // Add options to menu
    optionsMenu.appendChild(finishedOption);
    optionsMenu.appendChild(watchLaterOption);
    optionsMenu.appendChild(removeOption);
    
    // Add click outside to close
    const closeMenu = (event: MouseEvent) => {
      if (!optionsMenu.contains(event.target as Node)) {
        safeRemoveMenu();
        document.removeEventListener('click', closeMenu);
      }
    };
    
    // Add menu to body
    document.body.appendChild(optionsMenu);
    
    // Add click outside listener after a short delay
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  };

  const movies = watchlist.filter(item => item.media_type === 'movie');
  const tvShows = watchlist.filter(item => item.media_type === 'tv');

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading your watchlist...</span>
        </div>
      </div>
    );
  }  return (
    <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      

      <Tabs defaultValue="want-to-watch" className="w-full" onValueChange={(value) => setLibraryTab(value as any)}>
        <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="want-to-watch" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <Film className="h-4 w-4" />
            <span className="hidden xs:inline">Want to Watch</span>
            <span className="xs:hidden">Watch</span>
            <span className="text-xs">({watchlist.length})</span>
          </TabsTrigger>
          <TabsTrigger value="currently-watching" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <Tv className="h-4 w-4" />
            <span className="hidden xs:inline">Currently Watching</span>
            <span className="xs:hidden">Watching</span>
            <span className="text-xs">({continueWatching.length})</span>
          </TabsTrigger>
          <TabsTrigger value="watched" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            <ChevronRight className="h-4 w-4" />
            <span className="hidden xs:inline">Watched History</span>
            <span className="xs:hidden">History</span>
            <span className="text-xs">({watchedHistory.length})</span>
          </TabsTrigger>
        </TabsList>
          {/* Want to Watch (Watchlist) Section */}
        <TabsContent value="want-to-watch" className="mt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-4 sm:mb-6 gap-4">
                  {watchlist.length > 0 && (
              <button 
                onClick={() => setShowWatchlistDialog(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors text-sm"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clear Watchlist</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
            {watchlist.length > 0 ? (
            <Tabs defaultValue="movie" className="w-full">
              <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-2">
                <TabsTrigger 
                  value="movie" 
                  onClick={() => setActiveMediaTab('movie')}
                  disabled={movies.length === 0}
                  className={`flex items-center gap-2 ${movies.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Film className="h-4 w-4" />
                  <span className="hidden sm:inline">Movies</span>
                  <span className="sm:hidden">Movies</span>
                  <span>({movies.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tv" 
                  onClick={() => setActiveMediaTab('tv')}
                  disabled={tvShows.length === 0}
                  className={`flex items-center gap-2 ${tvShows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Tv className="h-4 w-4" />
                  <span className="hidden sm:inline">TV Shows</span>
                  <span className="sm:hidden">TV</span>
                  <span>({tvShows.length})</span>
                </TabsTrigger>
              </TabsList>                <TabsContent value="movie" className="mt-0">
                {movies.length > 0 ? (
                  <div className="space-y-6 sm:space-y-8">
                
                   
                  {/* All Movies - Grid layout */}
                    <div>
                      
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">                        {movies.map((item) => (
                          <MotionDiv 
                            key={`movie-${item.id}`}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <MediaCard 
                              item={item} 
                              priority={false} 
                              customActions={[
                                {
                                  label: 'Remove from watchlist',
                                  onClick: () => removeFromWatchlist(item.id, 'movie'),
                                  icon: <Trash2 size={16} className="text-red-400" />
                                }
                              ]}
                            />
                          </MotionDiv>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-400">No movies in your watchlist.</p>
                  </div>
                )}
              </TabsContent>
                <TabsContent value="tv" className="mt-0">
                {tvShows.length > 0 ? (
                  <div className="space-y-8">
                    {/* Popular Shows - Horizontal scroll */}
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-3">Popular Shows</h3>
                      <div className="relative group">
                        {/* Left scroll button */}
                        <button 
                          onClick={() => {
                            if (scrollContainerRefs.comedyShows.current) {
                              scrollContainerRefs.comedyShows.current.scrollBy({ left: -300, behavior: 'smooth' });
                            }
                          }}
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full hover:bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="h-6 w-6 text-white" />
                        </button>
                        
                        {/* Scrollable container */}
                        <div 
                          ref={scrollContainerRefs.comedyShows}
                          className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide scroll-smooth"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {tvShows.slice(0, Math.min(10, tvShows.length)).map((item) => (
                            <div key={`popular-${item.id}`} className="flex-shrink-0 w-[180px]">
                              <MediaCard 
                                item={item} 
                                priority={false} 
                                customActions={[
                                  {
                                    label: 'Remove from watchlist',
                                    onClick: () => removeFromWatchlist(item.id, 'tv'),
                                    icon: <Trash2 size={16} className="text-red-400" />
                                  }
                                ]}
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Right scroll button */}
                        <button 
                          onClick={() => {
                            if (scrollContainerRefs.comedyShows.current) {
                              scrollContainerRefs.comedyShows.current.scrollBy({ left: 300, behavior: 'smooth' });
                            }
                          }}
                          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full hover:bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    {/* All TV Shows - Grid layout */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">All TV Shows</h3>
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">                        {tvShows.map((item) => (
                          <MotionDiv 
                            key={`tv-${item.id}`}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <MediaCard 
                              item={item} 
                              priority={false}
                              customActions={[
                                {
                                  label: 'Remove from watchlist',
                                  onClick: () => removeFromWatchlist(item.id, 'tv'),
                                  icon: <Trash2 size={16} className="text-red-400" />
                                }
                              ]}
                            />
                          </MotionDiv>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-400">No TV shows in your watchlist.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 p-6 bg-gray-800/50 rounded-full">
                <Trash2 size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
              <p className="text-gray-400 max-w-md mb-6">
                Add movies and TV shows to your watchlist by clicking the "Save to Watchlist" button while watching.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Currently Watching Section */}
        <TabsContent value="currently-watching" className="mt-0">
          <div className="flex items-end justify-between mb-6">
                {continueWatching.length > 0 && (
              <button 
                onClick={() => setShowContinueWatchingDialog(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors text-sm"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
            {continueWatching.length > 0 ? (
            <div className="space-y-8">
              {/* Almost Finished - Horizontal scroll for items with progress > 50% */}
              
              
              {/* All Currently Watching - Grid layout */}
              <div>

                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">                  {continueWatching.map((item) => (
                    <MotionDiv 
                      key={`continue-${item.id}-${item.media_type}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}                    ><div className="relative group cursor-pointer">                        {/* Options menu button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showOptionsMenu(e, item);
                          }}
                          className="absolute top-1 right-1 z-20 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 text-xs"
                          aria-label="Options"
                        >
                          ×
                        </button>
                          {/* Mark as Finished button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsWatched(item.id, item.media_type);
                          }}
                          className="absolute top-1 left-1 z-20 bg-green-600/80 hover:bg-green-600 text-white rounded-md px-2 py-0.5 text-xs flex items-center"
                          aria-label="Mark as Finished"
                        >
                          <span className="mark-finished-text">Mark as Finished</span>
                        </button>
                        
                        <div
                          className="block relative overflow-hidden rounded-xl transition-all duration-500 ease-out bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-blue-500/20 group transform hover:md:-translate-y-1 hover:scale-[1.02] active:scale-98"
                          onClick={() => {
                            const url = item.media_type === 'movie'
                              ? getMovieUrl(item.id, item.title || 'untitled')
                              : getTvShowUrl(item.id, item.name || 'untitled');
                            router.push(url);
                          }}
                        >
                          {/* Progress indicator */}
                          {item.progress && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          )}
                          
                          {/* Animated border gradient */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
                          
                          {/* Main poster container */}
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900">
                            <Image
                              src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '/images/placeholder-poster.png'}
                              alt={item.title || item.name || 'Poster'}
                              fill
                              sizes="(max-width: 640px) 142px, 200px"
                              className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-110 group-hover:saturate-110"
                            />
                            
                            {/* Subtle gradient overlay always present */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                          </div>
                          
                          {/* Bottom info - always visible with media type and year */}
                          <div className="absolute bottom-1 left-0 right-0">
                            <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent p-1 md:p-1.5">
                              <div className="flex items-center justify-between text-[9px] md:text-xs">
                                <div className="flex items-center gap-1 md:gap-1.5">
                                  <span className="text-white/90 font-medium bg-black/40 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                                  </span>
                                  {item.season && item.episode && (
                                    <span className="text-white/80 font-medium bg-black/40 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                                      S{item.season}:E{item.episode}
                                    </span>
                                  )}
                                </div>
                              </div>                              <div className="text-white/90 font-medium truncate mt-0.5 text-[9px] md:text-xs">
                                {item.title || item.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 p-6 bg-gray-800/50 rounded-full">
                <Tv size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Nothing to continue watching</h2>
              <p className="text-gray-400 max-w-md mb-6">
                Start watching a movie or TV show, and it will appear here so you can continue where you left off.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Watched History Section */}
        <TabsContent value="watched" className="mt-0">
          <div className="flex items-end justify-between mb-6">
                {watchedHistory.length > 0 && (
              <button 
                onClick={() => setShowWatchHistoryDialog(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors text-sm"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clear History</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
            {watchedHistory.length > 0 ? (
            <div className="space-y-8">
             {/* All Watched History - Grid layout */}
              <div>
                
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">                  {watchedHistory.map((item) => (
                    <MotionDiv 
                      key={`watched-${item.id}-${item.media_type}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative group cursor-pointer">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWatched(item.id, item.media_type);
                          }}
                          className="absolute top-1 right-1 z-20 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 text-xs"
                          aria-label="Remove from Watch History"
                        >
                          ×
                        </button>
                        <div
                          className="block relative overflow-hidden rounded-xl transition-all duration-500 ease-out bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-blue-500/20 group transform hover:md:-translate-y-1 hover:scale-[1.02] active:scale-98"
                          onClick={() => {
                            const url = item.media_type === 'movie'
                              ? getMovieUrl(item.id, item.title || 'untitled')
                              : getTvShowUrl(item.id, item.name || 'untitled');
                            router.push(url);
                          }}
                        >
                          {/* Animated border gradient */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
                          
                          {/* Main poster container */}
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900">
                            <Image
                              src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '/images/placeholder-poster.png'}
                              alt={item.title || item.name || 'Poster'}
                              fill
                              sizes="(max-width: 640px) 142px, 200px"
                              className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-110 group-hover:saturate-110"
                            />
                            
                            {/* Gray overlay to indicate watched */}
                            <div className="absolute inset-0 bg-gray-900/30" />
                            
                            {/* Subtle gradient overlay always present */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                          </div>
                          
                          {/* Bottom info - always visible with media type and year */}
                          <div className="absolute bottom-0 left-0 right-0">
                            <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent p-1 md:p-1.5">
                              <div className="flex items-center justify-between text-[9px] md:text-xs">
                                <div className="flex items-center gap-1 md:gap-1.5">
                                  <span className="text-white/90 font-medium bg-black/40 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                                  </span>
                                  {item.season && item.episode && (
                                    <span className="text-white/80 font-medium bg-black/40 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                                      S{item.season}:E{item.episode}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-white/90 font-medium truncate mt-0.5 text-[9px] md:text-xs">
                                {item.title || item.name}
                              </div>
                              {item.watched_date && (
                                <div className="text-white/70 text-[8px] md:text-[9px] mt-0.5">
                                  Watched: {new Date(item.watched_date).toLocaleDateString()}
                                </div>
                              )}                            </div>
                          </div>
                        </div>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 p-6 bg-gray-800/50 rounded-full">
                <Film size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your watch history is empty</h2>
              <p className="text-gray-400 max-w-md mb-6">
                Once you finish watching movies or TV shows, they'll appear here in your history.
              </p>
            </div>          )}
        </TabsContent>
      </Tabs>
      
      {/* Confirmation Dialogs */}
      <ConfirmDialog 
        isOpen={showWatchlistDialog}
        onClose={() => setShowWatchlistDialog(false)}
        onConfirm={() => {
          clearWatchlist();
          showToast('Watchlist cleared successfully', 'success');
          setShowWatchlistDialog(false);
        }}
        title="Clear Watchlist"
        message="Are you sure you want to clear your entire watchlist? This action cannot be undone."
        confirmText="Clear Watchlist"
        type="danger"
      />
      
      <ConfirmDialog 
        isOpen={showContinueWatchingDialog}
        onClose={() => setShowContinueWatchingDialog(false)}
        onConfirm={() => {
          setContinueWatching([]);
          localStorage.setItem('continueWatching', JSON.stringify([]));
          showToast('Continue watching list cleared', 'info');
          setShowContinueWatchingDialog(false);
        }}
        title="Clear Continue Watching"
        message="Are you sure you want to clear your continue watching list? This action cannot be undone."
        confirmText="Clear Continue Watching"
        type="warning"
      />
      
      <ConfirmDialog 
        isOpen={showWatchHistoryDialog}
        onClose={() => setShowWatchHistoryDialog(false)}
        onConfirm={() => {
          setWatchedHistory([]);
          localStorage.setItem('watchedHistory', JSON.stringify([]));
          showToast('Watch history cleared successfully', 'success');
          setShowWatchHistoryDialog(false);
        }}
        title="Clear Watch History"
        message="Are you sure you want to clear your watch history? This action cannot be undone."
        confirmText="Clear History"
        type="danger"
      />
    </main>
  );
}