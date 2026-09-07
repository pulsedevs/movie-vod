// src/components/layout/Footer.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Tv, Home, Search, X, Library, Star } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import { MediaItem } from '@/types';
import MediaCard from '@/components/media/MediaCard';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';

// Create a custom event for showing/hiding the bottom navigation
// This will be dispatched from the YouTubeComments component
const HIDE_BOTTOM_NAV_EVENT = 'hideBottomNav';
const SHOW_BOTTOM_NAV_EVENT = 'showBottomNav';

// Bottom Navigation Bar Component for Mobile
const BottomNavBar = () => {
  const [activeLink, setActiveLink] = useState('/');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Listen for events to hide/show bottom navigation
  useEffect(() => {
    // Handle comment panel opening (hide nav)
    const handleHideNav = () => {
      setIsVisible(false);
    };

    // Handle comment panel closing (show nav)
    const handleShowNav = () => {
      setIsVisible(true);
    };

    // Add event listeners
    window.addEventListener(HIDE_BOTTOM_NAV_EVENT, handleHideNav);
    window.addEventListener(SHOW_BOTTOM_NAV_EVENT, handleShowNav);

    // Clean up event listeners
    return () => {
      window.removeEventListener(HIDE_BOTTOM_NAV_EVENT, handleHideNav);
      window.removeEventListener(SHOW_BOTTOM_NAV_EVENT, handleShowNav);
    };
  }, []);

  // Update active link when page changes
  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const isActive = (path: string) => {
    return activeLink === path || activeLink.startsWith(path + '/');
  };

  // Fetch search results
  const fetchResults = useCallback(
    async (searchQuery: string, pageNum: number, append: boolean = false) => {
      if (!searchQuery.trim()) {
        setLiveResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(searchQuery)}&page=${pageNum}`
        );
        if (response.ok) {
          const data = await response.json();
          if (append) {
            setLiveResults((prev) => [...prev, ...(data.results || [])]);
          } else {
            setLiveResults(data.results || []);
          }
          setHasMore(data.total_pages > pageNum);
        } else {
          console.error('Failed to fetch search results');
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial search when query changes
  useEffect(() => {
    // Only perform search if we have a query
    if (debouncedQuery.trim()) {
      setPage(1);
      setHasMore(true);
      fetchResults(debouncedQuery, 1, false);
    } else {
      // Clear results if query is empty
      setLiveResults([]);
      setHasMore(true);
      setPage(1);
    }
  }, [debouncedQuery, fetchResults]);

  // Handle clicks outside search and escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleCardClick = (item: MediaItem) => {
    const url = item.media_type === 'movie' 
      ? getMovieUrl(item.id, item.title || 'untitled') 
      : getTvShowUrl(item.id, item.name || 'untitled');
    setIsSearchOpen(false);
    router.push(url);
  };

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const NavButton = ({
    href,
    icon,
    label,
    isSearchButton = false,
  }: {
    href?: string;
    icon: React.ReactNode;
    label: string;
    isSearchButton?: boolean;
  }) => {
    const active = href ? isActive(href) : false;    const buttonContent = (
      <div
        className={`
          relative flex flex-col items-center justify-center h-12 w-11 rounded-2xl
          transition-all duration-300 ease-out
          ${active
            ? 'bg-blue-500/20 backdrop-blur-md shadow-lg'
            : 'hover:bg-white/10 hover:shadow-md'}
        `}
      >
        {active && (
          <div className="absolute -top-1 w-1 h-1 bg-blue-500 rounded-full animate-pulse z-10" />
        )}
        <div
          className={`
            transition-all duration-300 relative z-20
            ${active ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'}
          `}
        >
          {icon}
        </div>
        <span
          className={`
            text-[10px] font-medium mt-1 whitespace-nowrap relative z-20
            ${active ? 'text-blue-300 font-semibold' : 'text-gray-200 group-hover:text-white'}
          `}
        >
          {label}
        </span>
      </div>
    );

    if (isSearchButton) {
      return (
        <button
          onClick={handleSearchOpen}
          className="group relative transition-transform duration-200 active:scale-95"
        >
          {buttonContent}
        </button>
      );
    }

    return (
      <Link
        href={href!}
        onClick={() => {
          if (activeLink !== href) {
            setActiveLink(href!);
          }
        }}
        className="group relative transition-transform duration-200 active:scale-95"
      >
        {buttonContent}
      </Link>
    );
  };

  return (
    <>
      {/* Modern Bottom Navigation with Glassmorphism */}
      <div 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[51] p-2 transition-all duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full opacity-0'
        }`}
      >        <div
          className="
            mx-3 mb-2 rounded-3xl 
            bg-black/85 backdrop-blur-xl 
            border border-white/20
            shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            relative overflow-hidden px-2 py-3
          "
        >          <div className="flex justify-evenly items-center w-full">
              <NavButton href="/" icon={<Home size={20} />} label="Home" />
              <NavButton href="/browse/movies" icon={<Film size={20} />} label="Movies" />
              <NavButton href="/browse/tv" icon={<Tv size={20} />} label="TV" />
              <NavButton href="/browse/anime" icon={<Star size={20} />} label="Anime" />
              <NavButton href="/library" icon={<Library size={20} />} label="Library" />
              <NavButton icon={<Search size={20} />} label="Search" isSearchButton={true} />
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30" />
        </div>
      </div>

      {/* Enhanced Search Overlay */}
      {isSearchOpen && (
        <div
          ref={searchRef}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-start z-[60] animate-in fade-in duration-300"
        >
          <div
            className="
              bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl 
              p-6 pt-8 w-[calc(100%-2rem)] max-w-3xl mt-10 
              border border-white/10
              relative overflow-hidden
              animate-in slide-in-from-top-4 duration-500
            "
          >
            {/* Close Button */}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="
                absolute top-0 right-0 
                w-10 h-10 rounded-bl-2xl
                bg-black/50 hover:bg-black/70 
                text-gray-400 hover:text-white 
                transition-all duration-300
                flex items-center justify-center
                backdrop-blur-sm
                hover:scale-105
                z-50
                shadow-lg border-b border-l border-white/10
              "
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative z-20 mt-2">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies & TV shows..."
                  className="
                    w-full px-6 py-4 pr-14 rounded-2xl 
                    bg-white/10 backdrop-blur-sm
                    border border-white/20
                    text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                    focus:bg-white/15 focus:border-blue-500/50
                    text-lg transition-all duration-300
                    shadow-inner
                    z-20
                  "
                  autoFocus
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="
                    absolute right-4 top-1/2 -translate-y-1/2 
                    w-8 h-8 rounded-xl
                    bg-gradient-to-br from-blue-500 to-purple-600
                    text-white hover:shadow-lg hover:shadow-blue-500/25
                    transition-all duration-300 hover:scale-110
                    flex items-center justify-center
                  "
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Search Results */}
            <div className="mt-10 max-h-[60vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pt-4">
              {/* Loading indicator */}
              {isLoading && page === 1 && (
                <div className="flex justify-center py-8">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-blue-500/30 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}

              {liveResults.length > 0 && (
                <div className="grid grid-cols-2 gap-4 w-full">
                  {liveResults.map((item) => (
                    <div
                      key={`${item.id}-${item.media_type}`}
                      className="transform transition-all duration-300 hover:scale-105"
                    >
                      <MediaCard
                        item={item}
                        onClick={() => handleCardClick(item)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* No results message */}
              {!isLoading && query.trim() !== '' && liveResults.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <p className="text-white text-lg font-medium">No results found</p>
                  <p className="text-gray-400 mt-2">Try different keywords or check spelling</p>
                </div>
              )}

              {/* End of results message */}
              {liveResults.length > 0 && !hasMore && !isLoading && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-3" />
                  End of results
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer>
      {/* Bottom Navigation Bar for Mobile */}
      <BottomNavBar />        {/* Modern Footer Section */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t border-gray-700/50 md:mb-0 mb-[var(--bottom-nav-height)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 mb-6 md:mb-8">
            {/* Brand Section */}
            <div className="sm:col-span-1 lg:col-span-2">
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Boredflix
              </h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                Your ultimate destination for discovering movies and TV shows. Stream, explore, and enjoy endless entertainment.
              </p>
            </div>

            {/* Quick Links */}
            <div className="sm:col-span-1 lg:col-span-1">
              <h4 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Browse</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><Link href="/browse/movies" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">Movies</Link></li>
                <li><Link href="/browse/tv" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">TV Shows</Link></li>
                <li><Link href="/browse/anime" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">Anime</Link></li>
                <li><Link href="/library" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">My Library</Link></li>
                <li><Link href="/search" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">Search</Link></li>
              </ul>
            </div>

            {/* Legal & Info */}
            <div className="sm:col-span-1 lg:col-span-1">
              <h4 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Information</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><Link href="/privacy" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/about" className="inline-flex items-center min-h-10 md:min-h-0 py-1 text-gray-400 hover:text-blue-400 transition-colors">About</Link></li>
              </ul>
            </div>
          </div>

          {/* Disclaimer Section */}
          <div className="border-t border-gray-700/50 pt-4 md:pt-6 mb-4 md:mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 border border-gray-700/30">
              <h5 className="text-white font-medium mb-1 md:mb-2 flex items-center text-sm md:text-base">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full mr-2"></span>
                Important Notice
              </h5>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                Boredflix does not host or store any media files. All content is sourced from third-party services and platforms. 
                We respect intellectual property rights and comply with DMCA regulations.
              </p>
            </div>
          </div>          
          
          {/* Copyright Bar */}
          <div className="border-t border-gray-700/50 pt-4 md:pt-6">
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <p className="text-gray-400 text-xs md:text-sm">
                  &copy; {currentYear} <span className="text-white font-medium">Boredflix</span>. All rights reserved.
                </p>
              </div>              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500">
                <span>Made with ❤️ for movie lovers</span>
                <span className="hidden sm:inline">•</span>
                <button 
                  onClick={() => {
                    // Clear all caches and reload
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                      });
                    }
                    localStorage.removeItem('lastBuildTime');
                    localStorage.removeItem('lastKnownBuildTime');
                    window.location.reload();
                  }}
                  className="hover:text-blue-400 transition-colors underline"
                  title="Clear cache and refresh"
                >
                  Version 1.0 ⟳
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Export the event names to be used by other components
export { HIDE_BOTTOM_NAV_EVENT, SHOW_BOTTOM_NAV_EVENT };
export default Footer;