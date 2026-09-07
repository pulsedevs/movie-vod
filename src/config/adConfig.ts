export interface AdConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'sidebar' | 'floating';
  displayDelay: number;
  closeDelay: number;
  maxDisplayTime: number;
  clickThrough: boolean;
  trackingEnabled: boolean;
  responsive: boolean;
  zIndex: number;
}

export interface BannerAdConfig extends AdConfig {
  width: number;
  height: number;
  animationType: 'slide' | 'fade' | 'bounce' | 'none';
  autoClose: boolean;
  showCloseButton: boolean;
}

export interface PopupAdConfig extends AdConfig {
  modal: boolean;
  overlay: boolean;
  backdropClose: boolean;
  escapeClose: boolean;
}

// Default banner ad configuration
export const defaultBannerConfig: BannerAdConfig = {
  enabled: true,
  position: 'top',
  displayDelay: 2000,
  closeDelay: 5000,
  maxDisplayTime: 30000,
  clickThrough: true,
  trackingEnabled: true,
  responsive: true,
  zIndex: 1000,
  width: 728,
  height: 90,
  animationType: 'slide',
  autoClose: false,
  showCloseButton: true
};

// Default popup ad configuration
export const defaultPopupConfig: PopupAdConfig = {
  enabled: true,
  position: 'floating',
  displayDelay: 5000,
  closeDelay: 0,
  maxDisplayTime: 60000,
  clickThrough: true,
  trackingEnabled: true,
  responsive: true,
  zIndex: 1001,
  modal: true,
  overlay: true,
  backdropClose: false,
  escapeClose: true
};

// Mobile-specific configurations
export const mobileAdConfig = {
  banner: {
    ...defaultBannerConfig,
    width: 320,
    height: 50,
    position: 'bottom' as const,
    zIndex: 999
  },
  popup: {
    ...defaultPopupConfig,
    displayDelay: 8000,
    zIndex: 1002
  }
};

// Ad network configurations
export const adNetworks = {
  google: {
    enabled: true,
    publisherId: process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT || '',
    testMode: process.env.NODE_ENV === 'development'
  },  surfshark: {
    enabled: true,
    affiliateId: process.env.NEXT_PUBLIC_SURFSHARK_AFFILIATE_ID || '',
    trackingEnabled: true,
    content: {
      headline: "Stream Securely with SurfShark VPN",
      description: "Protect your privacy while streaming movies",
      discount: "70% OFF",
      ctaText: "Get SurfShark VPN"
    }
  }
};

// Frequency capping
export const frequencyCapping = {
  bannerAd: {
    maxPerSession: 5,
    maxPerDay: 20,
    cooldownPeriod: 300000 // 5 minutes
  },
  popupAd: {
    maxPerSession: 2,
    maxPerDay: 5,
    cooldownPeriod: 1800000 // 30 minutes
  }
};

// Device-specific settings
export const deviceSettings = {
  mobile: {
    enabled: true,
    reducedAnimations: true,
    touchOptimized: true
  },
  tablet: {
    enabled: true,
    reducedAnimations: false,
    touchOptimized: true
  },
  desktop: {
    enabled: true,
    reducedAnimations: false,
    touchOptimized: false
  }
};

export const getAdConfigForDevice = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
  const baseConfig = deviceType === 'mobile' ? mobileAdConfig : {
    banner: defaultBannerConfig,
    popup: defaultPopupConfig
  };

  return {
    ...baseConfig,
    deviceSettings: deviceSettings[deviceType]
  };
};