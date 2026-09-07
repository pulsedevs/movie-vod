'use client';

import { useAdPreferences } from '@/contexts/AdPreferencesContext';
import { useEffect, useState } from 'react';

interface AdPreferencesToggleProps {
  className?: string;
}

export default function AdPreferencesToggle({ className = '' }: AdPreferencesToggleProps) {
  const { adsEnabled, toggleAds } = useAdPreferences();
  const popUnderAdsEnabled = adsEnabled;
  const togglePopUnderAds = toggleAds;
  const [scriptExists, setScriptExists] = useState(false);

  // Check environment variables
  const popUnderAdsEnabledEnv = process.env.NEXT_PUBLIC_POP_UNDER_ADS_ENABLED === 'true';
  const nativeBannerAdsEnabledEnv = process.env.NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED === 'true';

  // Debug logging for environment variables
  useEffect(() => {
    console.log('🔍 AdPreferencesToggle Environment Debug:', {
      NEXT_PUBLIC_POP_UNDER_ADS_ENABLED: process.env.NEXT_PUBLIC_POP_UNDER_ADS_ENABLED,
      NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED: process.env.NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED,
      popUnderAdsEnabledEnv,
      nativeBannerAdsEnabledEnv,
      userPreference: popUnderAdsEnabled
    });
  }, [popUnderAdsEnabledEnv, nativeBannerAdsEnabledEnv, popUnderAdsEnabled]);

  // Check if pop-under script exists in DOM
  useEffect(() => {
    const checkScript = () => {
      // Check for pop-under script by ID only (works for both inline and external)
      const script = document.querySelector('script#popunder-ad-script');
      setScriptExists(!!script);
    };

    // Check immediately and then every second
    checkScript();
    const interval = setInterval(checkScript, 1000);

    return () => clearInterval(interval);
  }, [popUnderAdsEnabled]);

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium">Pop-under Ads Control</h3>
          <p className="text-gray-400 text-sm mt-1">
            {!popUnderAdsEnabledEnv 
              ? 'Pop-under ads are disabled via environment variable'
              : popUnderAdsEnabled 
                ? 'Pop-under ads are currently enabled' 
                : 'Pop-under ads are currently disabled'
            }
          </p>
        </div>
        
        <button
          onClick={togglePopUnderAds}
          disabled={!popUnderAdsEnabledEnv}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
            !popUnderAdsEnabledEnv 
              ? 'bg-gray-500 opacity-50 cursor-not-allowed' 
              : popUnderAdsEnabled 
                ? 'bg-blue-600' 
                : 'bg-gray-600'
          }`}
          role="switch"
          aria-checked={popUnderAdsEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              popUnderAdsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      <div className="mt-3 text-xs space-y-1">
        {/* Environment Variables Status */}
        <div className="mb-2 p-2 bg-gray-900 rounded border border-gray-700">
          <div className="text-gray-300 font-medium mb-1">Environment Controls:</div>
          <div className={`flex items-center gap-2 ${popUnderAdsEnabledEnv ? 'text-green-400' : 'text-red-400'}`}>
            <span>{popUnderAdsEnabledEnv ? '🟢' : '🔴'}</span>
            <span>Pop-Under Ads: {popUnderAdsEnabledEnv ? 'ENABLED' : 'DISABLED'}</span>
          </div>
          <div className={`flex items-center gap-2 ${nativeBannerAdsEnabledEnv ? 'text-green-400' : 'text-red-400'}`}>
            <span>{nativeBannerAdsEnabledEnv ? '🟢' : '🔴'}</span>
            <span>Native Banner Ads: {nativeBannerAdsEnabledEnv ? 'ENABLED' : 'DISABLED'}</span>
          </div>
        </div>

        {/* User Preference Status */}
        <div className={`flex items-center gap-2 ${popUnderAdsEnabled && popUnderAdsEnabledEnv ? 'text-green-400' : 'text-red-400'}`}>
          <span>{(popUnderAdsEnabled && popUnderAdsEnabledEnv) ? '✅' : '❌'}</span>
          <span>
            {(popUnderAdsEnabled && popUnderAdsEnabledEnv)
              ? 'Pop-under ads will load when you click around the site' 
              : !popUnderAdsEnabledEnv 
                ? 'Pop-under ads disabled via environment variable'
                : 'Pop-under ads are disabled for your browsing session'
            }
          </span>
        </div>
        
        <div className={`flex items-center gap-2 ${scriptExists ? 'text-green-400' : 'text-gray-500'}`}>
          <span>{scriptExists ? '📡' : '🚫'}</span>
          <span>
            Script in DOM: {scriptExists ? 'YES (Loaded)' : 'NO (Not loaded)'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 p-2 bg-gray-900 rounded text-xs text-gray-400">
        <div className="font-medium text-gray-300 mb-1">🔍 How to verify script removal:</div>
        <div>1. Open browser DevTools (F12)</div>
        <div>2. Go to Console tab</div>
        <div>3. Look for emoji messages: 🚫 = disabled, ✅ = enabled, 🗑️ = removed</div>
        <div>4. Check Elements tab → search for "popunder-ad-script"</div>
      </div>
    </div>
  );
}
