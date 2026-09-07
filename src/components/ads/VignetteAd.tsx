'use client';

import { useEffect } from 'react';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';

const VIGNETTE_SCRIPT_ID = 'vignette-ad-script';
const VIGNETTE_SCRIPT_SRC = 'https://dd133.com/vignette.min.js';
const VIGNETTE_ZONE = '10472745'; // dd133 ad zone (data-zone attribute the script reads)

export default function VignetteAd() {
  const { adsEnabled } = useAdPreferences();

  useEffect(() => {
    const envEnabled = process.env.NEXT_PUBLIC_VIGNETTE_ADS_ENABLED !== 'false';
    const enabled = envEnabled && adsEnabled;

    if (!enabled) {
      const existing = document.querySelectorAll(
        `script#${VIGNETTE_SCRIPT_ID}, script[src*="dd133.com"], script[src*="dc9xwpjprguup.cloudfront.net"]`
      );
      existing.forEach((s) => s.remove());
      return;
    }

    const userAgent = navigator.userAgent || '';
    const shouldSkipForAuditOrCrawler =
      /googlebot|bingbot|yandex|duckduckbot|baiduspider|lighthouse|pagespeed|headlesschrome|slurp/i.test(
        userAgent
      );
    if (shouldSkipForAuditOrCrawler) {
      return;
    }

    let detached = false;
    let interactionTimer: ReturnType<typeof setTimeout> | null = null;

    const loadScript = () => {
      if (detached || document.getElementById(VIGNETTE_SCRIPT_ID)) return;

      const script = document.createElement('script');
      script.id = VIGNETTE_SCRIPT_ID;
      script.dataset.zone = VIGNETTE_ZONE; // set BEFORE src — the script reads it on load
      script.src = VIGNETTE_SCRIPT_SRC;
      script.async = true;
      script.type = 'text/javascript';
      script.setAttribute('data-cfasync', 'false');

      const target = document.body || document.documentElement;
      if (target) target.appendChild(script);
    };

    const loadAndCleanupListeners = () => {
      loadScript();
      window.removeEventListener('pointerdown', loadAndCleanupListeners);
      window.removeEventListener('keydown', loadAndCleanupListeners);
      window.removeEventListener('scroll', loadAndCleanupListeners);
    };

    // Keep ad vendors out of the initial critical path.
    interactionTimer = setTimeout(loadScript, 6000);
    window.addEventListener('pointerdown', loadAndCleanupListeners, { once: true });
    window.addEventListener('keydown', loadAndCleanupListeners, { once: true });
    window.addEventListener('scroll', loadAndCleanupListeners, { once: true });

    return () => {
      detached = true;
      if (interactionTimer) clearTimeout(interactionTimer);
      window.removeEventListener('pointerdown', loadAndCleanupListeners);
      window.removeEventListener('keydown', loadAndCleanupListeners);
      window.removeEventListener('scroll', loadAndCleanupListeners);
      const s = document.getElementById(VIGNETTE_SCRIPT_ID);
      if (s) s.remove();
    };
  }, [adsEnabled]);

  return null;
}
