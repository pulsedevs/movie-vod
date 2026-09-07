"use client";

import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { frequencyCapping, adNetworks } from '@/config/adConfig';

interface SurfSharkBannerProps {
  delay?: number;
  showFrequency?: 'once' | 'session' | 'always';
  movieTitle?: string;
  onBannerHidden?: () => void;
}

const SurfSharkBanner: React.FC<SurfSharkBannerProps> = ({ 
  delay = 1000, // Reduced for testing
  showFrequency = 'session',
  movieTitle,
  onBannerHidden
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const adId = 'surfshark-top-banner';
  const config = adNetworks.surfshark;

  // Content configuration
  const content = {
    headline: "Secure Your Streaming with SurfShark VPN",
    description: "",
    discount: "86% OFF",
    ctaText: "Get Protected"
  };  // Check if banner should be shown
  useEffect(() => {
    console.log('SurfSharkBanner useEffect - config.enabled:', config.enabled);
    console.log('SurfSharkBanner useEffect - delay:', delay);
    
    if (!config.enabled) {
      console.log('SurfSharkBanner: Config disabled, calling onBannerHidden');
      onBannerHidden?.();
      return;
    }
    
    console.log('SurfSharkBanner: Setting timer to show banner in', delay, 'ms');
    const timer = setTimeout(() => {
      console.log('SurfSharkBanner: Timer fired, showing banner');
      setIsVisible(true);
      setTimeout(() => {
        console.log('SurfSharkBanner: Setting animation');
        setIsAnimating(true);
      }, 100);
    }, delay);

    return () => {
      console.log('SurfSharkBanner: Cleaning up timer');
      clearTimeout(timer);
    };
  }, [delay, config, onBannerHidden]);
  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onBannerHidden?.();
    }, 300);
  };

  const handleClick = () => {
    const affiliateUrl = `https://get.surfshark.net/aff_c?offer_id=926&aff_id=38849`;
    window.open(affiliateUrl, '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[110] transform transition-transform duration-300 ${
        isAnimating ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div 
        className="bg-gradient-to-r from-cyan-600 via-blue-700 to-cyan-600 text-white px-2 sm:px-4 py-2 sm:py-3 shadow-lg relative overflow-visible"
      >
        {/* Close button in the absolute top-right corner */}
        <button
          onClick={handleDismiss}
          className="absolute top-0 right-0 p-0 hover:bg-white/20 z-[300] flex items-center justify-center rounded-full transition-colors"
          aria-label="Close ad"
        >
          <X className="w-4 h-4 text" /> {/* Changed text-white to text-red-500 */}
        </button>
        
        <div className="max-w-7xl mx-auto flex items-center">          {/* Mobile: Simple single line with just discount */}
          <div className="flex items-center gap-2 flex-1 min-w-0 md:hidden">              
            <div className="bg-red-500 text-white px-2 py-1 rounded text-[12px] font-bold animate-pulse flex-shrink-0 flex items-center gap-1">
            
              <div className="bg-white rounded-sm p-0.5 inline-flex">
                <img 
                  src="/images/vpn-logo.png?v=1" 
                  alt="SurfShark VPN" 
                  className="w-3 h-3 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="w-3 h-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
                    }
                  }}
                />
              </div>
              <span className="text-white font-black">SurfShark VPN</span> {content.discount}
            </div> 
            <span className="font-medium text-[10px] text-cyan-100 truncate">
              {content.description}
            </span>
          </div>
            {/* Mobile: Get Protected button on extreme right */}
          <div className="flex items-center flex-shrink-0 md:hidden">
            <button
              onClick={handleClick}
              className="bg-white text-blue-700 px-1.5 py-0.5 rounded text-[12px] font-semibold hover:bg-gray-100 transition-colors min-h-[29px] flex items-center justify-center"
            >
              {content.ctaText}
            </button>
          </div>          {/* Desktop: Single line layout */}
          <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium text-base truncate flex items-center gap-2">
              🔒 <strong>Secure Your Streaming with </strong>
              <div className="bg-white rounded-sm p-1 inline-flex">
                <img 
                  src="/images/vpn-logo.png?v=1" 
                  alt="SurfShark VPN" 
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>';
                    }
                  }}
                />
              </div>
              <strong className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent font-black text-lg">
                SurfShark VPN
              </strong>
              <span> {content.description}</span>
            </span>
            <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold animate-pulse flex-shrink-0">
              {content.discount}
            </div>
          </div>{/* Desktop: Get Protected button on extreme right */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <button
              onClick={handleClick}
              className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-gray-100 transition-colors min-h-[30px] flex items-center justify-center"
            >
              {content.ctaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurfSharkBanner;
