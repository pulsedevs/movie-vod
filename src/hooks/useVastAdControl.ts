'use client';

// ─────────────────────────────────────────────────────────────────────────────
// VAST Ad remote control via Firebase Remote Config — currently disabled.
// Returns hard-coded defaultConfig (ads off) while FIREBASE_ENABLED = false.
// Re-enable by setting FIREBASE_ENABLED = true in src/lib/firebase.ts and
// uncommenting the Firebase import/usage below.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { FIREBASE_ENABLED } from '@/lib/firebase';

// When re-enabling: uncomment these two lines
// import { getValue } from 'firebase/remote-config';
// import { remoteConfig } from '@/lib/firebase';

interface VastAdConfig {
  enabled: boolean;
  testPageEnabled: boolean;
  prerollEnabled: boolean;
  vastUrls: {
    primary: string;
    fallback: string[];
  };
  frequency: {
    maxAdsPerSession: number;
    cooldownMinutes: number;
  };
  targeting: {
    enableForMobile: boolean;
    enableForDesktop: boolean;
    geoRestrictions: string[];
  };
}

const defaultConfig: VastAdConfig = {
  enabled: false,
  testPageEnabled: true,
  prerollEnabled: false,
  vastUrls: {
    primary: 'https://s.magsrv.com/v1/vast.php?idzone=5650700',
    fallback: [
      'https://s.magsrv.com/v1/vast.php?idzone=2366423',
      'https://s.magsrv.com/v1/vast.php?idzone=2916384',
    ],
  },
  frequency: {
    maxAdsPerSession: 3,
    cooldownMinutes: 5,
  },
  targeting: {
    enableForMobile: true,
    enableForDesktop: true,
    geoRestrictions: [],
  },
};

export const useVastAdControl = () => {
  const [config, setConfig] = useState<VastAdConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firebase disabled — use defaults immediately
    if (!FIREBASE_ENABLED) {
      setConfig(defaultConfig);
      setLoading(false);
      return;
    }

    /* ── Re-enable block ────────────────────────────────────────────────────
    const loadRemoteConfig = async () => {
      try {
        if (!remoteConfig) {
          setConfig(defaultConfig);
          setLoading(false);
          return;
        }

        const enabled          = getValue(remoteConfig, 'vast_ads_enabled').asBoolean();
        const testPageEnabled  = getValue(remoteConfig, 'vast_test_page_enabled').asBoolean();
        const prerollEnabled   = getValue(remoteConfig, 'vast_preroll_enabled').asBoolean();
        const vastUrlsJson     = getValue(remoteConfig, 'vast_urls_config').asString();
        const frequencyJson    = getValue(remoteConfig, 'vast_frequency_config').asString();
        const targetingJson    = getValue(remoteConfig, 'vast_targeting_config').asString();

        let vastUrls  = defaultConfig.vastUrls;
        let frequency = defaultConfig.frequency;
        let targeting = defaultConfig.targeting;

        try { if (vastUrlsJson)  vastUrls  = JSON.parse(vastUrlsJson);  } catch {}
        try { if (frequencyJson) frequency = JSON.parse(frequencyJson); } catch {}
        try { if (targetingJson) targeting = JSON.parse(targetingJson); } catch {}

        setConfig({ enabled, testPageEnabled, prerollEnabled, vastUrls, frequency, targeting });
        if (process.env.NODE_ENV === 'development') {
          console.log('VAST Ad Remote Config loaded:', { enabled, testPageEnabled, prerollEnabled });
        }
      } catch (err) {
        console.error('Error loading VAST ad remote config:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    };
    loadRemoteConfig();
    ── End re-enable block ─────────────────────────────────────────────── */
  }, []);

  const shouldShowAds       = () => config.enabled;
  const shouldShowTestPage  = () => config.testPageEnabled;
  const shouldShowPrerollAds = () => config.enabled && config.prerollEnabled;
  const isDeviceAllowed     = () => {
    const isMobile = window.innerWidth <= 768;
    return isMobile ? config.targeting.enableForMobile : config.targeting.enableForDesktop;
  };
  const getPrimaryVastUrl   = () => config.vastUrls.primary;
  const getFallbackVastUrls = () => config.vastUrls.fallback;
  const getAllVastUrls       = () => [config.vastUrls.primary, ...config.vastUrls.fallback];
  const getAdFrequencyConfig = () => config.frequency;

  const canShowAd = () => {
    if (!shouldShowAds() || !isDeviceAllowed()) return false;
    const sessionCount = parseInt(localStorage.getItem('vast_ad_session') || '0');
    const lastShown    = parseInt(localStorage.getItem('vast_ad_last_shown') || '0');
    const cooldownMs   = config.frequency.cooldownMinutes * 60 * 1000;
    if (lastShown && Date.now() - lastShown < cooldownMs) return false;
    if (sessionCount >= config.frequency.maxAdsPerSession) return false;
    return true;
  };

  const recordAdShown = () => {
    const current = parseInt(localStorage.getItem('vast_ad_session') || '0');
    localStorage.setItem('vast_ad_session', (current + 1).toString());
    localStorage.setItem('vast_ad_last_shown', Date.now().toString());
  };

  const resetAdSession = () => {
    localStorage.removeItem('vast_ad_session');
    localStorage.removeItem('vast_ad_last_shown');
  };

  return {
    config,
    loading,
    error,
    shouldShowAds,
    shouldShowTestPage,
    shouldShowPrerollAds,
    isDeviceAllowed,
    getPrimaryVastUrl,
    getFallbackVastUrls,
    getAllVastUrls,
    getAdFrequencyConfig,
    canShowAd,
    recordAdShown,
    resetAdSession,
  };
};
