"use client";

import { useState, useEffect } from 'react';
import { X, Shield, Globe, Play, Lock } from 'lucide-react';

interface MovieVPNAdProps {
  movieTitle?: string;
  delay?: number;
  position?: 'inline' | 'floating' | 'modal';
}

const MovieVPNAd: React.FC<MovieVPNAdProps> = ({ 
  movieTitle,
  delay = 5000,
  position = 'floating'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this session
    const sessionDismissed = sessionStorage.getItem('movie-vpn-ad-dismissed');
    if (sessionDismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('movie-vpn-ad-dismissed', 'true');
    }, 300);
  };

  const handleClick = () => {
    // Track click event
    window.open('https://surfshark.com?promo=movie-stream', '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;
  // Inline ad for placement within movie content
  if (position === 'inline') {
    return (
      <div className="my-4 sm:my-6 relative">
        <div className="bg-gradient-to-r from-blue-900/80 to-cyan-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-cyan-500/30 p-3 sm:p-4 relative overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 sm:p-1 hover:bg-white/20 rounded-full transition-colors z-10 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
            aria-label="Close ad"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="bg-cyan-500/20 p-2 sm:p-3 rounded-full shrink-0 self-start sm:self-auto">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white mb-1 text-sm sm:text-base">
                🔒 Stream {movieTitle ? `"${movieTitle}"` : 'Movies'} Safely
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-2 line-clamp-2">
                Protect your privacy and bypass geo-restrictions with SurfShark VPN
              </p>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Global access</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />                <span>Anonymous</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={handleClick}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-3 sm:py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 w-full sm:w-auto min-h-[44px] flex items-center justify-center"
                >
                  Get 81% OFF
                </button>
                <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold self-start sm:self-auto">
                  LIMITED TIME
                </div>
              </div>
            </div>
          </div>
          
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-2 left-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 right-8 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 right-4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  // Floating corner ad
  if (position === 'floating') {    return (      <div 
        className={`fixed bottom-20 sm:bottom-20 right-2 sm:right-4 z-[110] transform transition-all duration-300 ${
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 80px)`
        }}
      >
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-xl sm:rounded-2xl shadow-2xl border border-cyan-500/30 max-w-[280px] sm:max-w-xs">
          <div className="relative p-3 sm:p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 sm:p-1 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
              aria-label="Close ad"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="bg-cyan-500/20 p-1.5 sm:p-2 rounded-full">
                <Play className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs sm:text-sm truncate">Stream Securely</h3>
                <p className="text-[10px] sm:text-xs text-gray-300 truncate">
                  Watch {movieTitle ? `"${movieTitle}"` : 'movies'} safely
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2 mb-3 text-[10px] sm:text-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-green-400 shrink-0" />
                <span className="truncate">Bypass geo-blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-yellow-400 shrink-0" />
                <span className="truncate">Anonymous browsing</span>
              </div>
            </div>
            
            <div className="bg-red-500 text-center py-1 rounded-lg mb-3">
              <span className="text-[10px] sm:text-xs font-bold">🔥 81% OFF</span>
            </div>
              <button
              onClick={handleClick}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all hover:scale-105 min-h-[44px] flex items-center justify-center"
            >
              Get SurfShark
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Modal overlay
  if (position === 'modal') {
    return (      <div className={`fixed inset-0 z-[120] flex items-center justify-center transition-all duration-300 p-4 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}>
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleDismiss}
        />
        <div className={`relative bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-cyan-500/30 max-w-sm sm:max-w-md w-full transform transition-transform duration-300 ${
          isAnimating ? 'scale-100' : 'scale-95'
        }`}>
          <div className="p-4 sm:p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-4 sm:mb-6 pt-2">
              <div className="bg-cyan-500/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                Stream {movieTitle ? `"${movieTitle}"` : 'Movies'} Safely
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm px-2">
                Protect your privacy and access global content with SurfShark VPN
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-center py-2 sm:py-3 rounded-xl mb-4">              <div className="text-base sm:text-lg font-bold">🔥 SPECIAL OFFER</div>
              <div className="text-xl sm:text-2xl font-black">81% OFF</div>
              <div className="text-[10px] sm:text-xs">+ 2 months FREE</div>
            </div>
            
            <button
              onClick={handleClick}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 sm:py-3 rounded-xl font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-lg min-h-[48px] flex items-center justify-center"
            >
              Secure My Streaming
            </button>
            
            <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-3">
              30-day money-back guarantee • Stream safely
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MovieVPNAd;
