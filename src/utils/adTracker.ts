export interface AdEvent {
  type: 'impression' | 'click' | 'close' | 'error' | 'load';
  adId: string;
  adType: 'banner' | 'popup' | 'video' | 'native';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AdTrackingData {
  sessionId: string;
  userId?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  events: AdEvent[];
}

class AdTracker {
  private sessionId: string;
  private events: AdEvent[] = [];
  private isTrackingEnabled: boolean = true;
  private pendingEvents: AdEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_EVENTS_BATCH = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `ad_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    if (typeof window !== 'undefined') {
      // Initialize device detection
      this.detectDevice();
      
      // Set up periodic flushing
      this.scheduleFlush();
      
      // Handle page unload
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });
    }
  }

  private detectDevice(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (width <= 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    } else if (width <= 1024 || /tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  public setTrackingEnabled(enabled: boolean): void {
    this.isTrackingEnabled = enabled;
    if (!enabled) {
      this.clearPendingEvents();
    }
  }

  public trackEvent(event: Omit<AdEvent, 'timestamp'>): void {
    if (!this.isTrackingEnabled) return;

    const fullEvent: AdEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);
    this.pendingEvents.push(fullEvent);

    // Flush if we've reached the batch limit
    if (this.pendingEvents.length >= this.MAX_EVENTS_BATCH) {
      this.flush();
    }
  }

  public trackImpression(adId: string, adType: AdEvent['adType'], metadata?: Record<string, any>): void {
    this.trackEvent({
      type: 'impression',
      adId,
      adType,
      metadata
    });
  }

  public trackClick(adId: string, adType: AdEvent['adType'], metadata?: Record<string, any>): void {
    this.trackEvent({
      type: 'click',
      adId,
      adType,
      metadata
    });
  }

  public trackClose(adId: string, adType: AdEvent['adType'], method?: string): void {
    this.trackEvent({
      type: 'close',
      adId,
      adType,
      metadata: { closeMethod: method }
    });
  }

  public trackError(adId: string, adType: AdEvent['adType'], error: string): void {
    this.trackEvent({
      type: 'error',
      adId,
      adType,
      metadata: { error }
    });
  }

  public trackLoad(adId: string, adType: AdEvent['adType'], loadTime?: number): void {
    this.trackEvent({
      type: 'load',
      adId,
      adType,
      metadata: { loadTime }
    });
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    
    this.flushTimeout = setTimeout(() => {
      this.flush();
      this.scheduleFlush();
    }, this.FLUSH_INTERVAL);
  }

  private clearPendingEvents(): void {
    this.pendingEvents = [];
  }

  public flush(immediate: boolean = false): void {
    if (this.pendingEvents.length === 0) return;

    const eventsToSend = [...this.pendingEvents];
    this.clearPendingEvents();

    const trackingData: AdTrackingData = {
      sessionId: this.sessionId,
      deviceType: this.detectDevice(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : { width: 0, height: 0 },
      events: eventsToSend
    };

    if (immediate) {
      this.sendTrackingDataSync(trackingData);
    } else {
      this.sendTrackingData(trackingData);
    }
  }

  private async sendTrackingData(data: AdTrackingData): Promise<void> {
    try {
      if (typeof fetch === 'undefined') return;

      await fetch('/api/tracking/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.warn('Failed to send ad tracking data:', error);
      // Re-add events to pending if send failed
      this.pendingEvents.unshift(...data.events);
    }
  }

  private sendTrackingDataSync(data: AdTrackingData): void {
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/tracking/ads', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to send ad tracking data synchronously:', error);
    }
  }

  public getSessionStats(): {
    sessionId: string;
    totalEvents: number;
    eventsByType: Record<string, number>;
    sessionDuration: number;
  } {
    const eventsByType: Record<string, number> = {};
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const firstEvent = this.events[0];
    const lastEvent = this.events[this.events.length - 1];
    const sessionDuration = firstEvent && lastEvent ? lastEvent.timestamp - firstEvent.timestamp : 0;

    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      eventsByType,
      sessionDuration
    };
  }

  public getEventHistory(): AdEvent[] {
    return [...this.events];
  }

  public clearHistory(): void {
    this.events = [];
    this.clearPendingEvents();
  }

  public destroy(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.flush(true);
    this.clearHistory();
  }
}

// Singleton instance
let adTrackerInstance: AdTracker | null = null;

export const getAdTracker = (): AdTracker => {
  if (!adTrackerInstance) {
    adTrackerInstance = new AdTracker();
  }
  return adTrackerInstance;
};

// Convenience functions
export const trackAdImpression = (adId: string, adType: AdEvent['adType'], metadata?: Record<string, any>) => {
  getAdTracker().trackImpression(adId, adType, metadata);
};

export const trackAdClick = (adId: string, adType: AdEvent['adType'], metadata?: Record<string, any>) => {
  getAdTracker().trackClick(adId, adType, metadata);
};

export const trackAdClose = (adId: string, adType: AdEvent['adType'], method?: string) => {
  getAdTracker().trackClose(adId, adType, method);
};

export const trackAdError = (adId: string, adType: AdEvent['adType'], error: string) => {
  getAdTracker().trackError(adId, adType, error);
};

export const trackAdLoad = (adId: string, adType: AdEvent['adType'], loadTime?: number) => {
  getAdTracker().trackLoad(adId, adType, loadTime);
};

export default getAdTracker;