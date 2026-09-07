'use client';

import { useState, useEffect } from 'react';

export default function CacheDebugPanel() {
  const [buildTime, setBuildTime] = useState<string>('');
  const [lastKnownBuildTime, setLastKnownBuildTime] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    // Only show in development AND when explicitly requested via URL parameter
    if (process.env.NODE_ENV === 'development' && 
        new URLSearchParams(window.location.search).has('debug')) {
      setIsVisible(true);
    }
    
    // Get build time from meta tag
    const metaBuildTime = document.querySelector('meta[name="build-time"]')?.getAttribute('content') || '';
    setBuildTime(metaBuildTime);
    
    // Get last known build time from localStorage
    const lastKnown = localStorage.getItem('lastKnownBuildTime') || '';
    setLastKnownBuildTime(lastKnown);
  }, []);

  const clearAllCaches = async () => {
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Cleared caches:', cacheNames);
      }
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (!key.includes('auth') && !key.includes('user') && !key.includes('session')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      alert('Caches cleared! Page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/build-info?' + Date.now());
      const buildInfo = await response.json();
      
      console.log('Current build info:', buildInfo);
      alert(`Current build time: ${buildInfo.buildTime}\nBuild date: ${buildInfo.buildDate}`);
      
      const lastKnown = localStorage.getItem('lastKnownBuildTime');
      if (lastKnown && lastKnown !== buildInfo.buildTime) {
        alert('New build detected! Consider refreshing.');
      }
    } catch (error) {
      console.error('Error checking build info:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs">
      <div className="mb-2">
        <strong>Cache Debug Panel</strong>
      </div>
      <div className="space-y-1 mb-3">
        <div>Build: {buildTime}</div>
        <div>Last: {lastKnownBuildTime}</div>
        <div>Match: {buildTime === lastKnownBuildTime ? '✅' : '❌'}</div>
      </div>
      <div className="space-y-1">
        <button 
          onClick={clearAllCaches}
          className="block w-full bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
        >
          Clear Caches
        </button>
        <button 
          onClick={checkForUpdates}
          className="block w-full bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          Check Updates
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="block w-full bg-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-700"
        >
          Hide Panel
        </button>
      </div>
    </div>
  );
}
