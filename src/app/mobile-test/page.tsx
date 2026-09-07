'use client';

import React, { useState, useEffect } from 'react';
import { useBannerAd } from '@/hooks/useBannerAd';
import { mobileAdConfig } from '@/config/adConfig';
import Image from 'next/image';
import OptimizedImage from '@/components/common/OptimizedImage';
import { TMDB_IMAGE_BASE_URL, OPTIMIZED_IMAGE_SIZES } from '@/utils/constants';
import Description from '@/components/movie/Description';

// Helper function to determine the color for performance metrics
const getMetricColor = (value: number, metricType: string): string => {
  switch (metricType) {
    case 'fcp':
      return value < 1.8 ? 'bg-green-500' : value < 3 ? 'bg-yellow-500' : 'bg-red-500';
    case 'lcp':
      return value < 2.5 ? 'bg-green-500' : value < 4 ? 'bg-yellow-500' : 'bg-red-500';
    case 'cls':
      return value < 0.1 ? 'bg-green-500' : value < 0.25 ? 'bg-yellow-500' : 'bg-red-500';
    case 'fid':
      return value < 100 ? 'bg-green-500' : value < 300 ? 'bg-yellow-500' : 'bg-red-500';
    case 'ttfb':
      return value < 0.5 ? 'bg-green-500' : value < 1 ? 'bg-yellow-500' : 'bg-red-500';
    case 'tbt':
      return value < 200 ? 'bg-green-500' : value < 600 ? 'bg-yellow-500' : 'bg-red-500';
    case 'speedIndex':
      return value < 3.4 ? 'bg-green-500' : value < 5.8 ? 'bg-yellow-500' : 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

export default function MobileTestPage() {
  const [deviceInfo, setDeviceInfo] = useState<{
    userAgent: string;
    viewport: { width: number; height: number };
    deviceType: string;
  } | null>(null);

  const [adId] = useState(`mobile-test-${Date.now()}`);
  const [adState, adControls] = useBannerAd({
    adId,
    config: mobileAdConfig.banner,
    onShow: () => console.log('Mobile banner shown'),
    onHide: () => console.log('Mobile banner hidden'),
    onClose: () => console.log('Mobile banner closed'),
    onClick: () => console.log('Mobile banner clicked'),
    onError: (error) => console.error('Mobile banner error:', error)
  });  // Add performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
    fid: number | null;
    ttfb: number | null;
    score: number | null;
    lcpElement?: string;
    tbt?: number | null;
    speedIndex?: number | null;
  }>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
    score: null,
    tbt: null,
    speedIndex: null
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detectDevice = () => {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent.toLowerCase();
        
        let deviceType = 'desktop';
        if (width <= 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
          deviceType = 'mobile';
        } else if (width <= 1024 || /tablet|ipad|playbook|silk/i.test(userAgent)) {
          deviceType = 'tablet';
        }

        setDeviceInfo({
          userAgent: navigator.userAgent,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          deviceType
        });
      };

      detectDevice();
      window.addEventListener('resize', detectDevice);
      
      // Measure performance metrics
      if ('performance' in window) {
        // First Contentful Paint
        if (PerformanceObserver && 'paint' in PerformanceObserver.supportedEntryTypes) {
          const fcpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                setPerformanceMetrics(prev => ({ ...prev, fcp: entry.startTime }));
                fcpObserver.disconnect();
              }
            }
          });
          fcpObserver.observe({ type: 'paint', buffered: true });
        }
          // Largest Contentful Paint - Enhanced Monitoring
        if (PerformanceObserver && 'largest-contentful-paint' in PerformanceObserver.supportedEntryTypes) {
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              // Track both the timing and the element for better debugging
              const lcpElement = (lastEntry as any).element?.tagName || 'Unknown';
              console.log(`LCP element detected: ${lcpElement}`, lastEntry);
              
              // Store LCP timing
              setPerformanceMetrics(prev => ({ 
                ...prev, 
                lcp: lastEntry.startTime,
                lcpElement: lcpElement
              }));
              
              // Add a class to the LCP element if possible, for visual debugging
              if ((lastEntry as any).element) {
                try {
                  (lastEntry as any).element.classList.add('lcp-element');
                } catch (error) {
                  console.log('Could not add class to LCP element');
                }
              }
            }
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        }
        
        // Cumulative Layout Shift
        if (PerformanceObserver && 'layout-shift' in PerformanceObserver.supportedEntryTypes) {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
                setPerformanceMetrics(prev => ({ ...prev, cls: clsValue }));
              }
            }
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        }
        
        // First Input Delay (approximation with first-input)
        if (PerformanceObserver && 'first-input' in PerformanceObserver.supportedEntryTypes) {
          const fidObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              // processingStart - startTime gives us the FID value
              const fid = (entry as any).processingStart - (entry as any).startTime;
              setPerformanceMetrics(prev => ({ ...prev, fid }));
              fidObserver.disconnect();
            }
          });
          fidObserver.observe({ type: 'first-input', buffered: true });
        }        // Time to First Byte
        const navEntry = performance.getEntriesByType('navigation')[0] as any;
        if (navEntry) {
          setPerformanceMetrics(prev => ({ ...prev, ttfb: navEntry.responseStart }));
        }
        
        // Total Blocking Time approximation
        // We can use longtask to approximate TBT
        if (PerformanceObserver && 'longtask' in PerformanceObserver.supportedEntryTypes) {
          let totalBlockingTime = 0;
          const longTaskObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              // Calculate blocking time (anything over 50ms is blocking)
              const blockingTime = entry.duration - 50;
              if (blockingTime > 0) {
                totalBlockingTime += blockingTime;
                setPerformanceMetrics(prev => ({ ...prev, tbt: totalBlockingTime }));
              }
            }
          });
          longTaskObserver.observe({ type: 'longtask', buffered: true });
        }
        
        // Speed Index approximation
        // We can use the time when most of the page becomes visible
        setTimeout(() => {
          // This is a simplistic approximation - real Speed Index requires visual progress recording
          const fcp = performanceMetrics.fcp || 0;
          const lcp = performanceMetrics.lcp || 0;
          // Speed Index is typically between FCP and LCP
          const speedIndex = fcp + ((lcp - fcp) * 0.75);
          
          if (speedIndex > 0) {
            setPerformanceMetrics(prev => ({ ...prev, speedIndex }));
          }
        }, 3000);
          // Calculate approximate score based on thresholds
        setTimeout(() => {
          setPerformanceMetrics(prev => {
            const fcpScore = prev.fcp ? (prev.fcp < 1800 ? 1 : prev.fcp < 3000 ? 0.5 : 0) : 0;
            const lcpScore = prev.lcp ? (prev.lcp < 2500 ? 1 : prev.lcp < 4000 ? 0.5 : 0) : 0;
            const clsScore = prev.cls ? (prev.cls < 0.1 ? 1 : prev.cls < 0.25 ? 0.5 : 0) : 0;
            const fidScore = prev.fid ? (prev.fid < 100 ? 1 : prev.fid < 300 ? 0.5 : 0) : 0;
            const tbtScore = prev.tbt ? (prev.tbt < 200 ? 1 : prev.tbt < 600 ? 0.5 : 0) : 0;
            const speedIndexScore = prev.speedIndex ? (prev.speedIndex < 3400 ? 1 : prev.speedIndex < 5800 ? 0.5 : 0) : 0;
            
            // Weight the scores - Core Web Vitals (LCP, CLS, FID) are more important
            const weightedScore = (
              (lcpScore * 0.25) + // LCP is important
              (clsScore * 0.15) + // CLS is important
              (fidScore * 0.15) + // FID is important
              (fcpScore * 0.15) + // FCP is moderately important
              (tbtScore * 0.15) + // TBT is moderately important
              (speedIndexScore * 0.15) // Speed Index is moderately important
            );
            
            const totalScore = Math.round(weightedScore * 100);
            return { ...prev, score: totalScore };
          });
        }, 5000); // Wait 5 seconds to collect more metrics
      }
      
      return () => window.removeEventListener('resize', detectDevice);
    }
  }, []);  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mobile Test Page</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Testing mobile performance</p>
        </div>
      </header>
      
      {/* Performance Metrics */}
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Performance Metrics</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">First Contentful Paint (FCP)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {performanceMetrics.fcp ? `${(performanceMetrics.fcp / 1000).toFixed(2)}s` : 'Measuring...'}
                </span>
              </div>
              {performanceMetrics.fcp && (
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className={`h-2 rounded-full ${getMetricColor(performanceMetrics.fcp / 1000, 'fcp')}`} 
                    style={{ width: `${Math.min(100, (performanceMetrics.fcp / 3000) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {performanceMetrics.lcp ? `${(performanceMetrics.lcp / 1000).toFixed(2)}s` : 'Measuring...'}
                </span>
              </div>
              {performanceMetrics.lcp && (
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className={`h-2 rounded-full ${getMetricColor(performanceMetrics.lcp / 1000, 'lcp')}`} 
                    style={{ width: `${Math.min(100, (performanceMetrics.lcp / 4000) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {performanceMetrics.cls !== null ? performanceMetrics.cls.toFixed(3) : 'Measuring...'}
                </span>
              </div>
              {performanceMetrics.cls !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className={`h-2 rounded-full ${getMetricColor(performanceMetrics.cls, 'cls')}`} 
                    style={{ width: `${Math.min(100, (performanceMetrics.cls / 0.25) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">First Input Delay (FID)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {performanceMetrics.fid ? `${performanceMetrics.fid.toFixed(2)}ms` : 'Waiting for input...'}
                </span>
              </div>
              {performanceMetrics.fid && (
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className={`h-2 rounded-full ${getMetricColor(performanceMetrics.fid / 1000, 'fid')}`} 
                    style={{ width: `${Math.min(100, (performanceMetrics.fid / 300) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Time To First Byte (TTFB)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {performanceMetrics.ttfb ? `${(performanceMetrics.ttfb / 1000).toFixed(2)}s` : 'Measuring...'}
                </span>
              </div>
              {performanceMetrics.ttfb && (
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className={`h-2 rounded-full ${getMetricColor(performanceMetrics.ttfb / 1000, 'ttfb')}`} 
                    style={{ width: `${Math.min(100, (performanceMetrics.ttfb / 1000) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Ad Controls</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={adControls.show}
              disabled={!adControls.canDisplay()}
              className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              Show
            </button>
            <button
              onClick={adControls.hide}
              className="bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 transition-colors"
            >
              Hide
            </button>
            <button
              onClick={adControls.close}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => adControls.trackClick({ source: 'mobile_test' })}
              className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors"
            >
              Track Click
            </button>
          </div>
        </div>        {/* Ad State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Ad State</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Visible: {adState.isVisible ? '✅' : '❌'}</div>
            <div>Loading: {adState.isLoading ? '⏳' : '✅'}</div>
            <div>Closing: {adState.isClosing ? '⏳' : '❌'}</div>
            <div>Error: {adState.hasError ? '❌' : '✅'}</div>
            <div>Tracked: {adState.impressionTracked ? '✅' : '❌'}</div>
            <div>Count: {adState.displayCount}</div>
          </div>
        </div>        {/* Sample Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Sample Content</h2><div className="space-y-4 text-sm">
            <p>This is a mobile test page to verify that banner ads work correctly on mobile devices.</p>
            <p>The banner ad should appear at the bottom of the screen when shown, and should be optimized for mobile viewing.</p>            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <h3 className="font-semibold mb-2">Mobile Ad Features:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Responsive design</li>
                <li>Touch-optimized controls</li>
                <li>Bottom positioning</li>
                <li>Mobile-specific sizing</li>
                <li>Reduced animations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Performance Testing */}
        <div className="bg-gray-800 rounded-lg p-4 mt-8">
          <h3 className="text-xl font-bold mb-4">PageSpeed Optimization Tests</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Optimization Test */}
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-bold mb-2">Image Optimization</h4>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm mb-2">Regular Next.js Image:</p>
                  <Image 
                    src={`${TMDB_IMAGE_BASE_URL}${OPTIMIZED_IMAGE_SIZES.poster.medium}/wwemzKWzjKYJFfCeiB57q3r4Bcm.png`} 
                    alt="Movie poster" 
                    width={154} 
                    height={231} 
                    className="rounded"
                  />
                </div>
                
                <div>
                  <p className="text-sm mb-2">Optimized Image Component:</p>
                  <OptimizedImage 
                    src={`${TMDB_IMAGE_BASE_URL}${OPTIMIZED_IMAGE_SIZES.poster.medium}/wwemzKWzjKYJFfCeiB57q3r4Bcm.png`} 
                    alt="Movie poster" 
                    width={154} 
                    height={231}
                    imageType="poster"
                    className="rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* Layout Shift Test */}
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-bold mb-2">Layout Shift Optimization</h4>
              <Description 
                overview="This is a test of the optimized Description component. It should now handle text expansion without causing layout shifts. The component pre-calculates heights and uses proper transitions to ensure smooth rendering on mobile devices. This helps improve the Cumulative Layout Shift score in PageSpeed Insights."
              />
            </div>
              {/* Performance Metrics */}
            <div className="p-4 bg-gray-700 rounded-lg col-span-1 md:col-span-2">
              <h4 className="font-bold mb-2">Real-time Performance Metrics</h4>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className={`p-3 rounded text-center ${
                  performanceMetrics.score !== null 
                    ? performanceMetrics.score >= 90 ? 'bg-green-800' 
                    : performanceMetrics.score >= 70 ? 'bg-yellow-700' 
                    : 'bg-red-800' 
                    : 'bg-gray-800'
                }`}>
                  <p className="text-xs text-gray-300">Mobile Performance Score</p>
                  <p className="text-3xl font-mono font-bold">
                    {performanceMetrics.score !== null ? `${performanceMetrics.score}` : 'Calculating...'}
                  </p>
                  <p className="text-xs mt-1 text-gray-400">Based on Core Web Vitals</p>
                </div>
              </div>              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">FCP</p>
                  <p className="text-lg font-mono">{performanceMetrics.fcp ? `${(performanceMetrics.fcp / 1000).toFixed(1)}s` : 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">LCP</p>
                  <p className="text-lg font-mono">{performanceMetrics.lcp ? `${(performanceMetrics.lcp / 1000).toFixed(1)}s` : 'N/A'}</p>
                  {performanceMetrics.lcpElement && (
                    <p className="text-xs text-gray-500">{performanceMetrics.lcpElement}</p>
                  )}
                </div>
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">CLS</p>
                  <p className="text-lg font-mono">{performanceMetrics.cls !== null ? performanceMetrics.cls.toFixed(3) : 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">FID</p>
                  <p className="text-lg font-mono">{performanceMetrics.fid ? `${performanceMetrics.fid.toFixed(1)}ms` : 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">TTFB</p>
                  <p className="text-lg font-mono">{performanceMetrics.ttfb ? `${(performanceMetrics.ttfb / 1000).toFixed(1)}s` : 'N/A'}</p>
                </div>
              </div>
              
              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">Total Blocking Time</p>
                  <p className="text-lg font-mono">{performanceMetrics.tbt ? `${performanceMetrics.tbt.toFixed(1)}ms` : 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center">
                  <p className="text-xs text-gray-400">Speed Index</p>
                  <p className="text-lg font-mono">{performanceMetrics.speedIndex ? `${(performanceMetrics.speedIndex / 1000).toFixed(1)}s` : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Original Mobile Optimization Testing Section */}
        <div className="bg-gray-800 rounded-lg p-4 mt-8">
          <h3 className="text-xl font-bold mb-4">Mobile Ad Optimizations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-bold mb-2">Features</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Responsive design</li>
                <li>Touch-optimized controls</li>
                <li>Bottom positioning</li>
                <li>Mobile-specific sizing</li>
                <li>Reduced animations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Spacer for bottom banner */}
        <div className="h-20"></div>
      </div>

      {/* Mobile Banner Ad */}
      {adState.isVisible && (
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 shadow-lg z-50 transition-all duration-300 ${
            adState.isClosing ? 'transform translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
          }`}
          style={{ zIndex: mobileAdConfig.banner.zIndex }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-sm">Mobile Test Ad</h3>
              <p className="text-xs opacity-90">Optimized for mobile devices</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => adControls.trackClick({ source: 'mobile_banner' })}
                className="bg-white text-purple-600 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                Learn More
              </button>
              <button
                onClick={adControls.close}
                className="text-white hover:text-gray-200 text-lg font-bold w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}      {/* Configuration Display */}
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Mobile Ad Config</h2>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto">
            {JSON.stringify(mobileAdConfig.banner, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}