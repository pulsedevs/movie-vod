// VideoJS VAST and Ads Plugin Type Declarations
import videojs from 'video.js';

declare module 'video.js' {
  interface Player {
    ads(): void;
    vast(options: VastOptions): void;
  }
}

interface VastOptions {
  url: string;
  adTagUrl?: string;
  playAdAlways?: boolean;
  timeout?: number;
  prerollTimeout?: number;
  adsEnabled?: boolean;
  debug?: boolean;
}

declare global {
  interface Window {
    videojs: typeof videojs;
  }
}

export {};
