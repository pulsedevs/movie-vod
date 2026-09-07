'use client';

import { useEffect, useId, useRef } from 'react';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';

interface NativeBannerAdProps {
  className?: string;
}

const BANNER_SCRIPT_SRC = 'https://rn.taylorbrining.com/t1vK3jxbTH6n0Nd/127976';

export default function NativeBannerAd({ className = '' }: NativeBannerAdProps) {
  // The Monetag zone behind this tag serves multi-format ads (incl. floating
  // video sliders), so it MUST respect the user's Ads toggle.
  const nativeBannerAdsEnabled =
    process.env.NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED === 'true';
  const { adsEnabled } = useAdPreferences();
  const shouldLoad = nativeBannerAdsEnabled && adsEnabled;

  // Inject into THIS instance's slot (not the first `.native-banner-wrapper`
  // in the document) so the ad targets the current page.
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Unique id per mounted instance — no document-wide singleton guard.
  const reactId = useId();
  const containerId = `native-banner-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    if (!shouldLoad) return;

    const userAgent = navigator.userAgent || '';
    const shouldSkipForAuditOrCrawler =
      /googlebot|bingbot|yandex|duckduckbot|baiduspider|lighthouse|pagespeed|headlesschrome|slurp/i.test(
        userAgent
      );
    if (shouldSkipForAuditOrCrawler) {
      return;
    }

    const wrapperEl = wrapperRef.current;
    let injected = false;

    const injectBannerScript = () => {
      if (injected || !wrapperEl) return;
      injected = true;

      // Start clean so a re-mount (SPA navigation) doesn't stack stale nodes.
      wrapperEl.innerHTML = '';

      const adContainer = document.createElement('div');
      adContainer.id = containerId;
      adContainer.style.width = '100%';
      adContainer.style.display = 'block';
      adContainer.style.maxHeight = '120px';
      adContainer.style.overflow = 'hidden';
      wrapperEl.appendChild(adContainer);

      const script = document.createElement('script');
      // Cache-bust the src so the ad library re-executes on client-side route
      // changes instead of being treated as "already loaded" (which left every
      // page after the initial full load with an empty banner slot).
      script.src = `${BANNER_SCRIPT_SRC}?_=${Date.now()}`;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.type = 'text/javascript';
      adContainer.appendChild(script);
    };

    const timer = setTimeout(injectBannerScript, 2000);
    const onInteract = () => {
      injectBannerScript();
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    window.addEventListener('scroll', onInteract, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
      // Clear injected nodes so the next mount starts fresh.
      if (wrapperEl) wrapperEl.innerHTML = '';
    };
  }, [shouldLoad, containerId]);

  if (!shouldLoad) return null;

  return (
    <div className="px-4 sm:px-5 pt-3 pb-1">
      <div className={`native-ad-slot ${className}`.trim()}>
        <div ref={wrapperRef} className="native-banner-wrapper w-full h-full" />
      </div>
    </div>
  );
}
