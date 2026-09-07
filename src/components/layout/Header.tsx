'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import SearchBar from '../search/SearchBar';
import { Film, Tv, Home, Library, User, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { UserProfile } from '../auth/UserProfile';
import HeaderAdToggle from '../ads/HeaderAdToggle';
import BoredFlixLogoStatic from '@/components/branding/BoredFlixLogoStatic';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  const { user, loading } = useAuth();

  // Handle scroll events to show/hide header
  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      // Only hide header when:
      // 1. We're scrolling down (current scroll > last scroll)
      // 2. We're past the minimum threshold (50px)
      // 3. Mobile menu is closed
      if (currentScrollY > lastScrollY.current && currentScrollY > 50 && !mobileMenuOpen) {
        setIsVisible(false);
      } else {
        // Show header in all other cases:
        // - When scrolling up
        // - When at the top of page
        // - When mobile menu is open
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        // Throttle the scroll event using requestAnimationFrame
        window.requestAnimationFrame(() => {
          controlHeader();
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };  }, [mobileMenuOpen]);

  // Handle active link
  useEffect(() => {
    setActiveLink(pathname);
  }, [pathname]);
    const isActive = (path: string) => {
    return activeLink === path || activeLink.startsWith(path + '/');
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent<{ mode: 'signin' | 'signup' }>).detail?.mode ?? 'signin';
      setAuthModalMode(mode);
      setShowAuthModal(true);
    };
    window.addEventListener('open-auth-modal', handler);
    return () => window.removeEventListener('open-auth-modal', handler);
  }, []);

  const handleAuthClick = () => {
    if (user) {
      setShowUserProfile(true);
    } else {
      setAuthModalMode('signin');
      setShowAuthModal(true);
    }
  };

  return (
    <header
      className={`fixed left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'translate-y-0 top-[var(--surfshark-banner-height-mobile)] md:top-[var(--surfshark-banner-height-desktop)] bg-gray-900/80 backdrop-blur-md shadow-lg' 
          : '-translate-y-full top-0 bg-transparent'      }`}
    >
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4" style={{ height: 'var(--header-height-mobile)' }}>        {/* Logo pushed to left side */}        <Link href="/" className="relative group flex items-center">
          <BoredFlixLogoStatic className="h-5 w-auto" />
        </Link>
        
        {/* Empty middle section */}
        <div className="flex-grow"></div>
        
        {/* Discord Link & Sign In */}
        <div className="flex items-center space-x-1 min-w-[120px] justify-end">
          {/* Pop Ads Toggle - Mobile optimized */}
          <HeaderAdToggle />
          
          {/* Discord Link - Bigger but balanced */}
          <a
            href="https://discord.gg/VHDedCcbGY"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 transition-all duration-300 opacity-80 hover:opacity-100"
            title="Join our Discord"
          >
            <Image
              src="/images/discord.png"
              alt="Join Discord"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </a>
            {/* Sign In Button - Compact */}
          {loading ? (
            <div className="w-14 h-6 flex items-center justify-center bg-gray-200 text-gray-500 rounded text-xs">
              ...
            </div>
          ) : user ? (
            <button 
              className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors"
              onClick={handleAuthClick}
            >
              {getInitials(user.displayName, user.email).charAt(0)}
            </button>
          ) : (
            <button 
              className="w-14 h-6 flex items-center justify-center bg-white text-black rounded transition-colors duration-300 font-medium text-xs shadow-md hover:shadow-lg"
              onClick={handleAuthClick}
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Desktop Header */}
      <div className={`hidden md:flex items-center justify-between px-3 lg:px-4 transition-all duration-300 ease-in-out`} style={{ height: 'var(--header-height-desktop)' }}>
        {/* Logo */}        <Link 
          href="/" 
          className="relative group flex items-center"
          onClick={() => setActiveLink('/')}
        >
          <BoredFlixLogoStatic className="h-6 lg:h-7 w-auto" />
          <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></div>
        </Link>{/* Desktop Navigation Links */}
        <div className="flex gap-2 lg:gap-3 xl:gap-4 items-center">
          <NavLink 
            href="/" 
            icon={<Home size={18} />} 
            label="Home" 
            isActive={isActive('/')}
            onClick={() => setActiveLink('/')} 
          />
          <NavLink 
            href="/browse/movies" 
            icon={<Film size={18} />} 
            label="Movies" 
            isActive={isActive('/browse/movies')}
            onClick={() => setActiveLink('/browse/movies')} 
          />          <NavLink 
            href="/browse/tv" 
            icon={<Tv size={18} />} 
            label="TV Shows" 
            shortLabel="TV"
            isActive={isActive('/browse/tv')}
            onClick={() => setActiveLink('/browse/tv')} 
          />
          <NavLink 
            href="/browse/anime" 
            icon={<Star size={18} />} 
            label="Anime" 
            isActive={isActive('/browse/anime')}
            onClick={() => setActiveLink('/browse/anime')} 
          />
          <NavLink 
            href="/library" 
            icon={<Library size={18} />} 
            label="My Library" 
            shortLabel="Library"
            isActive={isActive('/library')}
            onClick={() => setActiveLink('/library')}  
          />
        </div>
        
        {/* Search Bar & User Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          <SearchBar />
          
          {/* Pop Ads Toggle */}
          <HeaderAdToggle />
          
          {/* Discord Link */}          <a
            href="https://discord.gg/VHDedCcbGY"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center justify-center w-11 h-11 xl:w-12 xl:h-12 hover:bg-gray-800 rounded-lg transition-all duration-300 opacity-80 hover:opacity-100"
            title="Join our Discord"
          >
            <Image
              src="/images/discord.png"
              alt="Join Discord"
              width={48}
              height={48}
              className="w-9 h-9 xl:w-10 xl:h-10"
            />
          </a>
          
          {/* Login/Profile Button */}
          {loading ? (
            <div className="flex items-center justify-center w-[120px] h-[42px] bg-gray-200 text-gray-500 rounded-md font-medium">
              Loading...
            </div>          ) : user ? (
            <button 
              className="group flex items-center space-x-2 px-3 lg:px-3.5 xl:px-4 py-2.5 bg-gradient-to-r from-gray-800/80 to-gray-900/80 hover:from-gray-700/90 hover:to-gray-800/90 backdrop-blur-md border border-gray-600/30 hover:border-gray-500/50 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:shadow-black/20"
              onClick={handleAuthClick}
            >
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500/80 to-purple-600/80 text-white rounded-lg text-sm font-semibold flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  {getInitials(user.displayName, user.email)}
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full opacity-90"></div>
              </div>              <div className="hidden xl:flex flex-col items-start">
                <span className="text-sm font-medium text-white leading-tight">
                  {user.displayName || 'Profile'}
                </span>
              </div>
              <svg 
                className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-300 hidden xl:block" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>          ) : (
            <button 
              className="group flex items-center space-x-2 px-4 lg:px-5 xl:px-6 py-2.5 bg-gradient-to-r from-white/90 to-gray-100/90 hover:from-white hover:to-gray-50 text-gray-900 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-black/10 backdrop-blur-sm border border-white/20"
              onClick={handleAuthClick}
            >
              <svg 
                className="w-4 h-4 text-gray-700 group-hover:text-gray-900 transition-colors duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm whitespace-nowrap">Sign In</span>
            </button>
          )}
        </div>
      </div>      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </header>
  );
};

// Desktop Navigation Link Component
const NavLink = ({ 
  href, 
  icon, 
  label, 
  shortLabel,
  isActive,
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  shortLabel?: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <Link 
      href={href} 
      className={`relative group flex items-center space-x-1 px-2 py-1 ${
        isActive ? 'text-white' : 'text-gray-300'
      } hover:text-white transition-colors duration-300`}
      onClick={onClick}
    >
      {icon}
      <span className="font-medium text-sm whitespace-nowrap hidden xl:inline">{label}</span>
      <span className="font-medium text-sm whitespace-nowrap xl:hidden">{shortLabel || label}</span>
      <div 
        className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
          isActive ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      ></div>
    </Link>
  );
};

// Mobile Navigation Link Component
const MobileNavLink = ({ 
  href, 
  icon, 
  label, 
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) => {
  return (
    <Link 
      href={href} 
      className="flex items-center space-x-4 p-3 text-white hover:bg-gray-800 rounded-lg transition-colors duration-300"
      onClick={onClick}
    >
      <div className="text-white">{icon}</div>
      <span className="text-xl font-medium">{label}</span>
    </Link>
  );
};

export default Header;