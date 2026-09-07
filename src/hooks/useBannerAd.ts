import { useState, useEffect, useCallback, useRef } from 'react';
import { BannerAdConfig, defaultBannerConfig, frequencyCapping, getAdConfigForDevice } from '@/config/adConfig';
import { trackAdImpression, trackAdClick, trackAdClose, trackAdError } from '@/utils/adTracker';

export interface BannerAdState {
  isVisible: boolean;
  isLoading: boolean;
  isClosing: boolean;
  hasError: boolean;
  impressionTracked: boolean;
  displayCount: number;
  lastDisplayTime: number;
}

export interface BannerAdControls {
  show: () => void;
  hide: () => void;
  close: () => void;
  trackClick: (metadata?: Record<string, any>) => void;
  canDisplay: () => boolean;
  resetDisplayCount: () => void;
}

export interface UseBannerAdProps {
  adId: string;
  config?: Partial<BannerAdConfig>;
  onShow?: () => void;
  onHide?: () => void;
  onClose?: () => void;
  onClick?: () => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

const STORAGE_KEY_PREFIX = 'banner_ad_';

export const useBannerAd = ({
  adId,
  config = {},
  onShow,
  onHide,
  onClose,
  onClick,
  onError,
  enabled = true
}: UseBannerAdProps): [BannerAdState, BannerAdControls] => {
  // Merge default config with provided config and device-specific settings
  const deviceType = useDeviceType();
  const adConfig = {
    ...defaultBannerConfig,
    ...getAdConfigForDevice(deviceType).banner,
    ...config
  };

  const [state, setState] = useState<BannerAdState>({
    isVisible: false,
    isLoading: false,
    isClosing: false,
    hasError: false,
    impressionTracked: false,
    displayCount: 0,
    lastDisplayTime: 0
  });

  const displayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
  const adElementRef = useRef<HTMLElement | null>(null);

  // Load display count from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${adId}_count`;
      const storedCount = localStorage.getItem(storageKey);
      const lastDisplayKey = `${STORAGE_KEY_PREFIX}${adId}_last_display`;
      const lastDisplay = localStorage.getItem(lastDisplayKey);

      setState(prev => ({
        ...prev,
        displayCount: storedCount ? parseInt(storedCount, 10) : 0,
        lastDisplayTime: lastDisplay ? parseInt(lastDisplay, 10) : 0
      }));
    }
  }, [adId]);

  // Save display count to localStorage
  const saveDisplayCount = useCallback((count: number) => {
    if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${adId}_count`;
      const lastDisplayKey = `${STORAGE_KEY_PREFIX}${adId}_last_display`;
      localStorage.setItem(storageKey, count.toString());
      localStorage.setItem(lastDisplayKey, Date.now().toString());
    }
  }, [adId]);

  // Check if ad can be displayed based on frequency capping
  const canDisplay = useCallback((): boolean => {
    if (!enabled || !adConfig.enabled) return false;

    const now = Date.now();
    const timeSinceLastDisplay = now - state.lastDisplayTime;
    
    // Check cooldown period
    if (timeSinceLastDisplay < frequencyCapping.bannerAd.cooldownPeriod) {
      return false;
    }

    // Check session limit
    if (state.displayCount >= frequencyCapping.bannerAd.maxPerSession) {
      return false;
    }

    return true;
  }, [enabled, adConfig.enabled, state.displayCount, state.lastDisplayTime]);

  // Set up intersection observer for impression tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && adConfig.trackingEnabled) {
      visibilityObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && state.isVisible && !state.impressionTracked) {
              trackAdImpression(adId, 'banner', {
                config: adConfig,
                deviceType,
                displayCount: state.displayCount + 1
              });
              setState(prev => ({ ...prev, impressionTracked: true }));
            }
          });
        },
        { threshold: 0.5 }
      );
    }

    return () => {
      if (visibilityObserverRef.current) {
        visibilityObserverRef.current.disconnect();
      }
    };
  }, [adId, adConfig, deviceType, state.isVisible, state.impressionTracked, state.displayCount]);

  // Auto-show with delay
  useEffect(() => {
    if (enabled && adConfig.enabled && adConfig.displayDelay > 0 && canDisplay()) {
      displayTimeoutRef.current = setTimeout(() => {
        show();
      }, adConfig.displayDelay);
    }

    return () => {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
      }
    };
  }, [enabled, adConfig.enabled, adConfig.displayDelay]);

  // Auto-close functionality
  useEffect(() => {
    if (state.isVisible && adConfig.autoClose && adConfig.maxDisplayTime > 0) {
      autoCloseTimeoutRef.current = setTimeout(() => {
        close();
      }, adConfig.maxDisplayTime);
    }

    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, [state.isVisible, adConfig.autoClose, adConfig.maxDisplayTime]);

  const show = useCallback(() => {
    if (!canDisplay()) return;

    setState(prev => ({
      ...prev,
      isVisible: true,
      isLoading: false,
      hasError: false,
      impressionTracked: false,
      displayCount: prev.displayCount + 1,
      lastDisplayTime: Date.now()
    }));

    saveDisplayCount(state.displayCount + 1);
    onShow?.();
  }, [canDisplay, saveDisplayCount, state.displayCount, onShow]);

  const hide = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      isClosing: false
    }));
    onHide?.();
  }, [onHide]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isClosing: true }));

    if (adConfig.trackingEnabled) {
      trackAdClose(adId, 'banner', 'user_action');
    }

    setTimeout(() => {
      hide();
    }, adConfig.closeDelay || 0);

    onClose?.();
  }, [adId, adConfig.trackingEnabled, adConfig.closeDelay, hide, onClose]);

  const trackClick = useCallback((metadata?: Record<string, any>) => {
    if (adConfig.trackingEnabled) {
      trackAdClick(adId, 'banner', {
        ...metadata,
        config: adConfig,
        deviceType,
        displayCount: state.displayCount
      });
    }
    onClick?.();
  }, [adId, adConfig, deviceType, state.displayCount, onClick]);

  const resetDisplayCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      displayCount: 0,
      lastDisplayTime: 0
    }));
    
    if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${adId}_count`;
      const lastDisplayKey = `${STORAGE_KEY_PREFIX}${adId}_last_display`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(lastDisplayKey);
    }
  }, [adId]);

  // Track errors
  const handleError = useCallback((error: string) => {
    setState(prev => ({ ...prev, hasError: true, isLoading: false }));
    
    if (adConfig.trackingEnabled) {
      trackAdError(adId, 'banner', error);
    }
    
    onError?.(error);
  }, [adId, adConfig.trackingEnabled, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
      }
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
      if (visibilityObserverRef.current) {
        visibilityObserverRef.current.disconnect();
      }
    };
  }, []);

  // Observe ad element for intersection tracking
  const observeElement = useCallback((element: HTMLElement | null) => {
    adElementRef.current = element;
    
    if (visibilityObserverRef.current) {
      visibilityObserverRef.current.disconnect();
      
      if (element) {
        visibilityObserverRef.current.observe(element);
      }
    }
  }, []);

  return [
    state,
    {
      show,
      hide,
      close,
      trackClick,
      canDisplay,
      resetDisplayCount
    }
  ];
};

// Hook to detect device type
function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return 'desktop';
      
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (width <= 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        return 'mobile';
      } else if (width <= 1024 || /tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'tablet';
      }
      return 'desktop';
    };

    setDeviceType(detectDevice());

    const handleResize = () => {
      setDeviceType(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

export default useBannerAd;