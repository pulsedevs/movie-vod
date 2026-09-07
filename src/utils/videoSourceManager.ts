// Video source providers with fallbacks for rate limiting
export interface VideoProvider {
  name: string;
  baseUrl: string;
  movieUrl: (id: number) => string;
  tvUrl: (id: number, season: number, episode: number) => string;
  priority: number; // Lower number = higher priority
}

export const VIDEO_PROVIDERS: VideoProvider[] = [
  {
    name: 'VidSrc.me',
    baseUrl: 'https://vidsrc.me',
    movieUrl: (id: number) => `https://vidsrc.me/embed/movie/${id}`,
    tvUrl: (id: number, season: number, episode: number) => `https://vidsrc.me/embed/tv/${id}/${season}/${episode}`,
    priority: 1
  },
  {
    name: 'VidSrc.to',
    baseUrl: 'https://vidsrc.to',
    movieUrl: (id: number) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id: number, season: number, episode: number) => `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
    priority: 2
  },
  {
    name: 'VidSrc.cc',
    baseUrl: 'https://vidsrc.cc',
    movieUrl: (id: number) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tvUrl: (id: number, season: number, episode: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
    priority: 3
  },
  {
    name: 'SuperEmbed',
    baseUrl: 'https://multiembed.mov',
    movieUrl: (id: number) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    tvUrl: (id: number, season: number, episode: number) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
    priority: 4
  }
];

export interface RateLimitInfo {
  provider: string;
  hitAt: number;
  retryAfter: number; // seconds
}

class VideoSourceManager {
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();
  private readonly RATE_LIMIT_DURATION = 60 * 1000; // 1 minute default
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 3000, 5000]; // 1s, 3s, 5s

  /**
   * Check if a provider is currently rate limited
   */
  isProviderRateLimited(provider: VideoProvider): boolean {
    const info = this.rateLimitInfo.get(provider.name);
    if (!info) return false;
    
    const now = Date.now();
    const timeSinceHit = now - info.hitAt;
    const rateLimitDuration = info.retryAfter * 1000 || this.RATE_LIMIT_DURATION;
    
    return timeSinceHit < rateLimitDuration;
  }

  /**
   * Mark a provider as rate limited
   */
  markProviderRateLimited(provider: VideoProvider, retryAfter?: number): void {
    this.rateLimitInfo.set(provider.name, {
      provider: provider.name,
      hitAt: Date.now(),
      retryAfter: retryAfter || 60
    });
  }

  /**
   * Get available providers sorted by priority, excluding rate limited ones
   */
  getAvailableProviders(): VideoProvider[] {
    return VIDEO_PROVIDERS
      .filter(provider => !this.isProviderRateLimited(provider))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get all providers sorted by priority (including rate limited ones for fallback)
   */
  getAllProviders(): VideoProvider[] {
    return VIDEO_PROVIDERS.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Test if a video source loads successfully
   */
  async testVideoSource(url: string, timeoutMs: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // Many video providers block CORS
      });

      clearTimeout(timeoutId);

      // For no-cors requests, we can't check status, so assume success if no error
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Video source test timed out: ${url}`);
        }
        return false;
      }
      
      // Check if it's a rate limit error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // This could be a rate limit, CORS, or network error
        // We'll treat it as potentially rate limited
        return false;
      }
      
      console.error(`Error testing video source ${url}:`, error);
      return false;
    }
  }

  /**
   * Get the best available video source with fallbacks and retry logic
   */
  async getVideoSource(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    season: number = 1,
    episode: number = 1
  ): Promise<{ url: string; provider: VideoProvider } | null> {
    const availableProviders = this.getAvailableProviders();
    
    // If no providers are available due to rate limiting, use all providers as last resort
    const providersToTry = availableProviders.length > 0 ? availableProviders : this.getAllProviders();
    
    for (const provider of providersToTry) {
      const url = mediaType === 'movie' 
        ? provider.movieUrl(mediaId)
        : provider.tvUrl(mediaId, season, episode);

      // Try the provider with retries
      for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAYS[attempt - 1]));
          }

          const isWorking = await this.testVideoSource(url);
          
          if (isWorking) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Successfully got video source from ${provider.name}:`, url);
            }
            return { url, provider };
          }
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed for ${provider.name}:`, error);
          
          // If this looks like a rate limit error, mark the provider
          if (error instanceof Error && (
            error.message.includes('429') || 
            error.message.includes('Too Many Requests') ||
            error.message.includes('rate limit')
          )) {
            this.markProviderRateLimited(provider);
            break; // Don't retry this provider, move to next one
          }
        }
      }
      
      console.warn(`Failed to get working video source from ${provider.name} after ${this.MAX_RETRIES} attempts`);
    }

    console.error('All video providers failed or are rate limited');
    return null;
  }

  /**
   * Get rate limit status for all providers
   */
  getRateLimitStatus(): { provider: string; isLimited: boolean; timeRemaining?: number }[] {
    return VIDEO_PROVIDERS.map(provider => {
      const isLimited = this.isProviderRateLimited(provider);
      let timeRemaining;
      
      if (isLimited) {
        const info = this.rateLimitInfo.get(provider.name);
        if (info) {
          const elapsed = Date.now() - info.hitAt;
          const totalDuration = info.retryAfter * 1000;
          timeRemaining = Math.max(0, totalDuration - elapsed);
        }
      }
      
      return {
        provider: provider.name,
        isLimited,
        timeRemaining
      };
    });
  }

  /**
   * Clear rate limit for a specific provider (for manual override)
   */
  clearRateLimit(providerName: string): void {
    this.rateLimitInfo.delete(providerName);
  }

  /**
   * Clear all rate limits (for manual override)
   */
  clearAllRateLimits(): void {
    this.rateLimitInfo.clear();
  }
}

// Export singleton instance
export const videoSourceManager = new VideoSourceManager();

// Convenience function for getting video sources
export async function getVideoSource(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  season: number = 1,
  episode: number = 1
): Promise<{ url: string; provider: VideoProvider } | null> {
  return videoSourceManager.getVideoSource(mediaType, mediaId, season, episode);
}

// Convenience function for getting rate limit status
export function getProviderStatus() {
  return videoSourceManager.getRateLimitStatus();
}
