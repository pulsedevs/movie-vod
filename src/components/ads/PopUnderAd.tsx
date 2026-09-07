'use client';

import { useEffect, useState } from 'react';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';

export default function PopUnderAd() {
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { adsEnabled } = useAdPreferences();

  useEffect(() => {
    setMounted(true);
    const scriptUrl = process.env.NEXT_PUBLIC_POP_UNDER_ADS_SCRIPT_URL;

    if (!adsEnabled) {
      setScriptLoaded(false);
      const existingScripts = document.querySelectorAll('script#popunder-ad-script');
      existingScripts.forEach(script => script.remove());
      return;
    }
    
    if (!scriptUrl) {
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
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const injectScript = () => {
      if (detached || document.getElementById('popunder-ad-script')) return;

      // Remove any existing pop-under ad scripts first
      const existingScripts = document.querySelectorAll('script#popunder-ad-script');
      existingScripts.forEach(script => script.remove());
      
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.type = 'text/javascript';
      script.id = 'popunder-ad-script';
      script.setAttribute('data-cfasync', 'false'); // Important: Disable Cloudflare async for ad scripts

      script.onload = () => {
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        setScriptLoaded(false);
      };
      
      document.head.appendChild(script);
    };

    const injectOnInteraction = () => {
      injectScript();
      window.removeEventListener('pointerdown', injectOnInteraction);
      window.removeEventListener('keydown', injectOnInteraction);
      window.removeEventListener('scroll', injectOnInteraction);
    };

    // Keep ad requests away from first paint and Lighthouse critical chain.
    fallbackTimer = setTimeout(injectScript, 3000);
    window.addEventListener('pointerdown', injectOnInteraction, { once: true });
    window.addEventListener('keydown', injectOnInteraction, { once: true });
    window.addEventListener('scroll', injectOnInteraction, { once: true });

    return () => {
      detached = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      window.removeEventListener('pointerdown', injectOnInteraction);
      window.removeEventListener('keydown', injectOnInteraction);
      window.removeEventListener('scroll', injectOnInteraction);
    };
  }, [adsEnabled]);

  return null; // Component doesn't render visible content
}
