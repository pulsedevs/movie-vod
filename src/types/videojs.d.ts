// VideoJS and VAST plugin types
declare global {
  interface Window {
    videojs: any;
    VASTClient: any;
    vastPlugin: any;
  }
}

declare module 'videojs' {
  interface VideoJsPlayer {
    vastClient: any;
  }
}

export {};
