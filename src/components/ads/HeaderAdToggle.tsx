'use client';

import { useAdPreferences } from '@/contexts/AdPreferencesContext';
import { useState, useEffect } from 'react';

export default function HeaderAdToggle() {
  const { adsEnabled, toggleAds } = useAdPreferences();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show if any ad type is potentially active
  const anyAdsConfigured =
    process.env.NEXT_PUBLIC_POP_UNDER_ADS_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_VIGNETTE_ADS_ENABLED !== 'false';

  const handleToggle = () => {
    setIsAnimating(true);
    toggleAds();
    setTimeout(() => setIsAnimating(false), 200);
  };

  if (!mounted || !anyAdsConfigured) return null;

  const isOn = adsEnabled;

  return (
    <button
      onClick={handleToggle}
      role="switch"
      aria-checked={!isOn}
      title={isOn ? 'Click to disable ads' : 'Click to enable ads'}
      className="flex items-center gap-1.5 h-7 px-2.5 rounded-full border transition-all duration-300 active:scale-95 focus:outline-none"
      style={isOn
        ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', boxShadow: '0 0 6px rgba(239,68,68,0.2)' }
        : { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', boxShadow: '0 0 6px rgba(34,197,94,0.2)' }
      }
    >
      {/* pill track */}
      <span
        className={`relative inline-flex h-3 w-5 shrink-0 items-center rounded-full transition-colors duration-300 ${isOn ? 'bg-red-500' : 'bg-green-500'}`}
      >
        {/* thumb */}
        <span
          className={`absolute h-2 w-2 rounded-full bg-white shadow transition-transform duration-300 ${isOn ? 'translate-x-0.5' : 'translate-x-2.5'} ${isAnimating ? 'scale-90' : ''}`}
        />
      </span>
      <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${isOn ? 'text-red-400' : 'text-green-400'}`}>
        Ads
      </span>
    </button>
  );
}
