"use client";

import { useState, useEffect } from 'react';
import { X, Zap, Shield, Clock, Star, Globe, Users, Award, CheckCircle } from 'lucide-react';
import { adNetworks } from '../../config/adConfig'; // Import adNetworks

interface PromotionalOverlayProps {
  delay?: number;
  autoHide?: number;
  movieTitle?: string;
  testing?: boolean;
}

const PromotionalOverlay: React.FC<PromotionalOverlayProps> = ({
  delay = 20000, // Reduced for demo
  autoHide = 180000,
  movieTitle,
  testing = false // Enabled for demo
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isAnimating, setIsAnimating] = useState(false);

  const adId = 'surfshark-promo-overlay';
  useEffect(() => {
    console.log('PromotionalOverlay useEffect - testing:', testing);
    console.log('PromotionalOverlay useEffect - adNetworks.surfshark.enabled:', adNetworks.surfshark.enabled);
    
    // First, check if Surfshark ads are enabled via environment variables
    if (!adNetworks.surfshark.enabled) {
      console.log('PromotionalOverlay: Surfshark ads disabled in config');
      return; // Do not show the overlay if disabled in config
    }

    // Check if user has seen this today
    const lastSeen = testing ? null : localStorage?.getItem('promo-overlay-last-seen');
    const today = new Date().toDateString();
    
    console.log('PromotionalOverlay - lastSeen:', lastSeen, 'today:', today);
    
    if (!testing && lastSeen === today) {
      console.log('PromotionalOverlay: Already seen today, not showing');
      return;
    }

    console.log('PromotionalOverlay: Setting timer to show overlay in', delay, 'ms');
    const showTimer = setTimeout(() => {
      console.log('PromotionalOverlay: Timer fired, showing overlay');
      setIsVisible(true);
      setTimeout(() => {
        console.log('PromotionalOverlay: Setting animation');
        setIsAnimating(true);
      }, 100);
    }, delay);

    return () => {
      console.log('PromotionalOverlay: Cleaning up timer');
      clearTimeout(showTimer);
    };
  }, [delay, movieTitle, testing]);

  useEffect(() => {
    if (!isVisible) return;

    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [isVisible]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (!testing && typeof localStorage !== 'undefined') {
        const today = new Date().toDateString();
        localStorage.setItem('promo-overlay-last-seen', today);
      }
    }, 300);
  };

  const handleClick = () => {
    const promoUrl = `https://get.surfshark.net/aff_c?offer_id=926&aff_id=38849`;
    window.open(promoUrl, '_blank');
    handleDismiss();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        minHeight: '100dvh' // Dynamic viewport height for mobile
      }}
    >
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Fixed container with proper scrolling */}
      <div 
        className={`relative transform transition-all duration-500 w-full max-w-xs sm:max-w-sm md:max-w-md max-h-[90vh] max-h-[90dvh] overflow-y-auto ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Enhanced VPN Brand Design */}
        <div className="bg-gradient-to-br from-teal-600 via-blue-700 to-teal-800 text-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl border-2 border-teal-400/50 w-full z-[10000] relative">
          {/* Professional animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/0 via-blue-400/20 to-teal-600/0 animate-pulse rounded-xl sm:rounded-2xl lg:rounded-3xl"></div>
          
          <div className="relative p-4 sm:p-5 md:p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close promotion"
            >
              <X className="w-5 h-5" />
            </button>            {/* SurfShark Brand Header */}
            <div className="text-center mb-3">              {/* Brand Logo Area */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="bg-white rounded-lg p-2">
                  <img 
                    src="/images/vpn-logo.png?v=1" 
                    alt="SurfShark VPN" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      // Fallback to Shield icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-8 h-8 flex items-center justify-center"><svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>';
                      }
                    }}
                  />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black text-white bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    SurfShark VPN
                  </div>
                  <div className="text-xs text-teal-200 font-medium">Premium VPN Protection</div>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-3 mb-2 text-xs">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-300">4.8/5</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-300" />
                  <span className="text-blue-200">3M+ users</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-green-400" />
                  <span className="text-green-300">Top Rated</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm font-bold text-yellow-400">LIMITED TIME OFFER</span>
              </div>
              
              <h2 className="text-base sm:text-lg font-black mb-1">
                Premium VPN Protection
              </h2>
              
              <p className="text-xs opacity-90 px-2">
                {movieTitle ? `Stream "${movieTitle}" securely & privately` : 'Stream securely from anywhere in the world'}
              </p>
            </div>

            {/* Countdown timer */}
            <div className="bg-black/30 rounded-lg p-2.5 mb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-medium">Offer expires in:</span>
              </div>
              <div className="text-xl font-black text-yellow-400 tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[10px] text-gray-300 mt-0.5">
                Ad closes automatically when timer reaches 0:00
              </div>
            </div>

            {/* Enhanced deal details with VPN features */}
            <div className="bg-white/10 rounded-lg p-2.5 mb-3">
              <div className="text-center mb-2">
                <div className="text-xl font-black text-yellow-400 mb-0.5">
                  86% OFF
                </div>
                <div className="text-xs">
                  + 3 EXTRA MONTHS
                </div>
              </div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span>AES-256 military encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span>3200+ servers in 100+ countries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  <span>Ultra-fast 10Gbps speeds</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span>No-logs policy verified</span>
                </div>
              </div>
            </div>

            {/* Professional CTA Button */}
            <button
              onClick={handleClick}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 active:from-yellow-500 active:to-orange-600 text-black font-black text-base py-3 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg transform hover:shadow-xl min-h-[48px] touch-manipulation mb-2"
              aria-label="Get SurfShark VPN protection now"
            >
              GET SURFSHARK VPN NOW
            </button>

            {/* Enhanced guarantee text */}
            <p className="text-[10px] text-center opacity-70 leading-tight mb-1">
              30-day money-back guarantee • No-logs policy • 24/7 support
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalOverlay;