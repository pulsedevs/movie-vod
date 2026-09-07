"use client";

import { useState, useEffect } from 'react';
import { X, ShieldAlert, Globe, Lock, Eye, AlertTriangle } from 'lucide-react';

interface StealthOverlayProps {
  movieTitle?: string;
  delay?: number;
  autoHide?: number;
  testing?: boolean;
}

const StealthOverlay: React.FC<StealthOverlayProps> = ({ 
  movieTitle,
  delay = 8000,
  autoHide = 25000,
  testing = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25); // 25 seconds countdown
  const adId = 'stealth-security-overlay';

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isVisible]);

  // Show overlay based on conditions
  useEffect(() => {
    const checkShouldShow = () => {
      if (testing) {
        console.log('🔍 [StealthOverlay] Testing mode - bypassing checks');
        return true;
      }

      // Check if user has seen this today
      const lastSeen = localStorage.getItem('stealth-overlay-last-seen');
      const today = new Date().toDateString();
        if (lastSeen === today) {
        console.log('🔍 [StealthOverlay] Already seen today');
        return false;
      }

      return true; // Show if not seen today
    };

    if (checkShouldShow()) {      const showTimer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => {
          setIsAnimating(true);
          console.log('🔍 [StealthOverlay] Displayed - Security notification mode');
        }, 100);
      }, delay);

      return () => clearTimeout(showTimer);
    }
  }, [delay, movieTitle, testing]);

  // Countdown timer
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
      if (!testing) {
        const today = new Date().toDateString();
        localStorage.setItem('stealth-overlay-last-seen', today);
      }
    }, 300);
  };

  const handleClick = () => {
    const affiliateUrl = `https://get.surfshark.net/aff_c?offer_id=926&aff_id=38849`;
    window.open(affiliateUrl, '_blank');
    handleDismiss();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 transition-all duration-500 overflow-hidden ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Stealth Security Notification */}
      <div className={`relative bg-gray-900 border border-yellow-500/50 text-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-transform duration-500 ${
        isAnimating ? 'scale-100' : 'scale-95'
      }`}>
        
        {/* Header - Looks like system notification */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-white">
              Streaming Security Notice
            </h3>
            <p className="text-xs text-gray-400">
              Connection Privacy Alert
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Auto-close: {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Educational Content */}
        <div className="p-4 space-y-4">
          
          {/* Security Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-200 font-medium mb-1">
                  Your streaming activity may be visible
                </p>
                <p className="text-yellow-100/80 text-xs">
                  ISPs and networks can monitor what you watch{movieTitle ? `, including "${movieTitle}"` : ''}.
                </p>
              </div>
            </div>
          </div>

          {/* Educational Points */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-200">
              Common streaming privacy risks:
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Eye className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  ISP monitoring and data collection
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Geographic content restrictions
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Unsecured public network risks
                </span>
              </div>
            </div>
          </div>

          {/* Security Recommendation */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
            <h4 className="text-sm font-medium text-white mb-2">
              Recommended security measures:
            </h4>
            <div className="space-y-1 text-xs text-gray-300">
              <p>• Use a VPN to encrypt your connection</p>
              <p>• Enable private browsing mode</p>
              <p>• Avoid public WiFi for streaming</p>
              <p>• Consider privacy-focused services</p>
            </div>
          </div>

          {/* Soft CTA */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 mb-3">
              Want to learn more about protecting your streaming privacy?
            </p>
            
            <button
              onClick={handleClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Learn About VPN Protection
            </button>
            
            <p className="text-[10px] text-gray-500 text-center mt-2">
              Sponsored educational content • Privacy-focused recommendation
            </p>
          </div>

          {/* Testing indicator */}
          {testing && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
              <p className="text-green-400 text-xs text-center">
                🧪 Testing Mode - This overlay will show every time for testing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StealthOverlay;
