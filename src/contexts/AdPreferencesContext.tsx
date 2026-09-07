'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdPreferencesContextType {
  adsEnabled: boolean;
  toggleAds: () => void;
}

const AdPreferencesContext = createContext<AdPreferencesContextType | undefined>(undefined);

export function AdPreferencesProvider({ children }: { children: ReactNode }) {
  const [adsEnabled, setAdsEnabled] = useState(true);

  useEffect(() => {
    try {
    // Check new key first, then migrate from old key
    let saved = localStorage.getItem('adsEnabled');
    let savedTimestamp = localStorage.getItem('adsDisabledAt');

    if (saved === null) {
      const oldSaved = localStorage.getItem('popUnderAdsEnabled');
      const oldTimestamp = localStorage.getItem('popUnderAdsDisabledAt');
      if (oldSaved !== null) {
        saved = oldSaved;
        savedTimestamp = oldTimestamp;
        localStorage.setItem('adsEnabled', oldSaved);
        if (oldTimestamp) localStorage.setItem('adsDisabledAt', oldTimestamp);
        localStorage.removeItem('popUnderAdsEnabled');
        localStorage.removeItem('popUnderAdsDisabledAt');
      }
    }

    if (saved !== null && savedTimestamp !== null) {
      const disabledAt = parseInt(savedTimestamp);
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;

      if (now - disabledAt > twelveHours) {
        localStorage.removeItem('adsEnabled');
        localStorage.removeItem('adsDisabledAt');
        setAdsEnabled(true);
      } else {
        setAdsEnabled(JSON.parse(saved));
      }
    }
    } catch {}
  }, []);

  const toggleAds = () => {
    const newValue = !adsEnabled;
    setAdsEnabled(newValue);
    // Safari private windows can throw on setItem — never let that abort the
    // reload below, which is what actually kills already-loaded ad scripts.
    try {
      localStorage.setItem('adsEnabled', JSON.stringify(newValue));
      if (!newValue) {
        localStorage.setItem('adsDisabledAt', Date.now().toString());
      } else {
        localStorage.removeItem('adsDisabledAt');
      }
    } catch {}

    // location.reload() — assigning the same URL to location.href is a no-op
    // in Safari, which left ad click-handlers alive after "disable ads".
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <AdPreferencesContext.Provider value={{ adsEnabled, toggleAds }}>
      {children}
    </AdPreferencesContext.Provider>
  );
}

export function useAdPreferences() {
  const context = useContext(AdPreferencesContext);
  if (context === undefined) {
    throw new Error('useAdPreferences must be used within an AdPreferencesProvider');
  }
  return context;
}
