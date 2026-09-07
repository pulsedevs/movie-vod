'use client';

import { useEffect, useState } from 'react';
import { useAdPreferences } from '@/contexts/AdPreferencesContext';

export default function PopUnderAd() {
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { adsEnabled } = useAdPreferences();

  useEffect(() => {
    setMounted(true);
    
    // Get previous state from localStorage to detect changes
    const previousState = localStorage.getItem('popunder-ads-state');
    const currentState = adsEnabled ? 'enabled' : 'disabled';
    
    // Check if this is a state change (not initial load)
    if (previousState && previousState !== currentState) {
      console.log(`� Pop-under ads state changed from ${previousState} to ${currentState} - reloading page...`);
      
      // Update the state first
      localStorage.setItem('popunder-ads-state', currentState);
      
      // Set flag to prevent reload loop
      sessionStorage.setItem('just-reloaded', 'true');
      
      // Reload the page once
      setTimeout(() => {
        window.location.reload();
      }, 300);
      
      return;
    }
    
    // Check if we just reloaded (prevent infinite loop)
    const justReloaded = sessionStorage.getItem('just-reloaded');
    if (justReloaded) {
      sessionStorage.removeItem('just-reloaded');
      console.log('✅ Page reloaded successfully - continuing normal operation');
    }
    
    // Store current state for next comparison
    localStorage.setItem('popunder-ads-state', currentState);
    
    // Only load script if pop-under ads are enabled
    if (!adsEnabled) {
      console.log('🚫 Pop-under ads DISABLED by user preference - Script NOT loaded');
      setScriptLoaded(false);
      
      // Remove any existing pop-under scripts
      const existingScripts = document.querySelectorAll('script[src*="aw.ericasfz.com"]');
      existingScripts.forEach(script => {
        script.remove();
        console.log('🗑️ Removed existing pop-under script from DOM');
      });
      
      return;
    }
    
    console.log('✅ Pop-under ads ENABLED - Loading script...');
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Create and append the pop-under ad script
      const script = document.createElement('script');
      script.src = 'https://aw.ericasfz.com/r285rXikTCVI/127975';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.type = 'text/javascript';
      script.id = 'popunder-ad-script'; // Add ID for easy identification
      
      script.onload = () => {
        console.log('🎯 Pop-under ads script SUCCESSFULLY loaded and executed');
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Pop-under ads script FAILED to load');
        setScriptLoaded(false);
      };
      
      // Append to document head
      document.head.appendChild(script);
      console.log('📡 Pop-under ads script added to DOM - waiting for load...');
    }, 1000); // Small delay to let page load

    return () => {
      clearTimeout(timer);
    };
  }, [adsEnabled]);

  // This component doesn't render any visible content
  // Pop-under ads work in the background
  return null;
}
