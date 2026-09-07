'use client';

import { useEffect, useState } from 'react';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';

export default function PopUnderAd() {
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { adsEnabled } = useAdPreferences();

  useEffect(() => {
    setMounted(true);
    
    // Hard reload with cache clearing when ads disabled
    if (!adsEnabled && !sessionStorage.getItem('cache-cleared')) {
      console.log('🚫 Ads disabled - hard reload to clear cache...');
      sessionStorage.setItem('cache-cleared', 'true');
      
      // Force hard reload with timestamp to bypass cache
      window.location.href = window.location.origin + window.location.pathname + 
        (window.location.search ? window.location.search + '&' : '?') + 
        'clearCache=' + Date.now() + window.location.hash;
      return;
    }
    
    // Clear flag when ads enabled
    if (adsEnabled) {
      sessionStorage.removeItem('cache-cleared');
    }
    
    // Handle script loading/removal
    if (!adsEnabled) {
      console.log('🚫 Pop-under ads DISABLED');
      setScriptLoaded(false);
      return;
    }
    
    console.log('✅ Pop-under ads ENABLED - Loading script...');
    
    const timer = setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://aw.ericasfz.com/r285rXikTCVI/127975';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.type = 'text/javascript';
      script.id = 'popunder-ad-script';
      
      script.onload = () => {
        console.log('🎯 Pop-under ads script loaded');
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Pop-under ads script failed');
        setScriptLoaded(false);
      };
      
      document.head.appendChild(script);
    }, 1000);

    return () => clearTimeout(timer);
  }, [adsEnabled]);

  return null;
}
