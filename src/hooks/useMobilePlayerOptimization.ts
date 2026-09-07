'use client';

import { useState, useEffect } from 'react';

/** CSS class with fixed aspect-ratio shell — see globals.css `.player-aspect-shell` */
export const PLAYER_ASPECT_SHELL_CLASS = 'player-aspect-shell';

interface MobilePlayerDimensions {
  height: string;
  aspectRatio: string;
  className: string;
}

export const useMobilePlayerOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile =
        width <= 768 ||
        /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(mobile);
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  const dimensions: MobilePlayerDimensions = {
    height: 'auto',
    aspectRatio: '16/9',
    className: PLAYER_ASPECT_SHELL_CLASS,
  };

  const getVideoJSConfig = () => {
    const baseConfig = {
      controls: false,
      autoplay: true,
      playsinline: true,
      preload: 'auto',
      aspectRatio: '16:9',
    };

    if (isMobile) {
      return {
        ...baseConfig,
        fluid: false,
        responsive: false,
        fill: true,
        width: '100%',
        height: '100%',
      };
    }

    return {
      ...baseConfig,
      fluid: true,
      responsive: true,
    };
  };

  return {
    dimensions,
    isMobile,
    orientation,
    getVideoJSConfig,
  };
};
