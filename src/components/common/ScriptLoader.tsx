'use client';

import { useEffect } from 'react';

// This component efficiently loads script tags with proper attributes
// to prevent render blocking

interface ScriptLoaderProps {
  src: string;
  defer?: boolean;
  async?: boolean;
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
  id?: string;
  onLoad?: () => void;
}

export default function ScriptLoader({
  src,
  defer = true,
  async = true,
  strategy = 'afterInteractive',
  id,
  onLoad
}: ScriptLoaderProps) {
  useEffect(() => {
    // Skip if the script already exists
    if (document.querySelector(`script[src="${src}"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    
    if (id) script.id = id;
    if (defer) script.defer = true;
    if (async) script.async = true;
    
    // Handle different loading strategies
    if (strategy === 'beforeInteractive') {
      // Insert at the beginning of head for high priority
      document.head.insertBefore(script, document.head.firstChild);
    } else if (strategy === 'afterInteractive') {
      // Insert at the end of head
      document.head.appendChild(script);
    } else if (strategy === 'lazyOnload') {
      // Load after window load event
      if (document.readyState === 'complete') {
        document.body.appendChild(script);
      } else {
        window.addEventListener('load', () => {
          document.body.appendChild(script);
        });
      }
    }

    if (onLoad) {
      script.onload = onLoad;
    }

    return () => {
      // Clean up only scripts we've added (identified by src and optional id)
      const scriptToRemove = id 
        ? document.querySelector(`script[src="${src}"][id="${id}"]`) 
        : document.querySelector(`script[src="${src}"]`);
      
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, [src, defer, async, strategy, id, onLoad]);

  return null;
}
