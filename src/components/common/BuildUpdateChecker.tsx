'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BuildInfo {
  buildTime: string;
  buildDate: string;
  version: string;
}

export default function BuildUpdateChecker() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const router = useRouter();
  useEffect(() => {    // Optimized update checking - less frequent, less resource intensive
    const checkForUpdates = async () => {
      try {
        // Only check if page has been idle for a bit to avoid impacting user experience
        if (document.hidden) return;
        
        const response = await fetch('/api/build-info?' + Date.now(), {
          cache: 'no-cache'
        });
        
        if (!response.ok) return;
        
        const buildInfo: BuildInfo = await response.json();
        const lastKnownBuildTime = localStorage.getItem('lastKnownBuildTime');
        
        if (lastKnownBuildTime && lastKnownBuildTime !== buildInfo.buildTime) {
          setShowUpdatePrompt(true);
        }
        
        localStorage.setItem('lastKnownBuildTime', buildInfo.buildTime);
      } catch (error) {
        // Silently fail - don't log errors to avoid console noise
      }
    };

    // Initial check after 2 minutes (to not impact initial page load)
    const initialTimer = setTimeout(checkForUpdates, 120000);
    
    // Less frequent checks every 10 minutes (instead of 5)
    const interval = setInterval(checkForUpdates, 10 * 60 * 1000);

    // Also check when page becomes visible again (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkForUpdates, 5000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);  const handleRefresh = () => {
    // Selective cache clearing before refresh to minimize latency
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(names => {
        // Only clear Next.js related caches
        const nextCaches = names.filter(name => 
          name.includes('next') || name.includes('static') || name.includes('webpack')
        );
        Promise.all(nextCaches.map(name => caches.delete(name)))
          .then(() => {
            // Force page reload using browser API
            (window as any).location.reload();
          });
      });
    } else {
      // Force page reload using browser API
      (window as any).location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Update Available</h3>
          <p className="text-xs text-blue-100 mt-1">
            New features and improvements are ready! Refresh to see the latest version.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRefresh}
              className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
            >
              Refresh Now
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-200 px-3 py-1 rounded text-xs hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
