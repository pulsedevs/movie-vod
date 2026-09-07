'use client';

import { useState, useEffect, useCallback } from 'react';
import { FIREBASE_ENABLED, fetchRemoteConfig, getAllRemoteConfigValues } from '@/lib/firebase';

export interface FourKContent {
  available: boolean;
  streamUrl?: string; // Cloudflare Stream HLS URL (manifest/video.m3u8)
  streamId?: string; // Cloudflare Stream ID for future API calls
  qualities?: string[];
  episodes?: Record<string, string>; // For TV shows: episode key -> Stream URL
}

export interface FourKAvailability {
  movies: Record<string, FourKContent>;
  tvShows: Record<string, FourKContent>;
}

export interface RemoteSourceOverrides {
  movieOverrides: Record<string, number>;
  tvOverrides: Record<string, number>;
  emergencyDisabledSources: number[];
  sourceHealthCheckEnabled: boolean;
  fourKAvailability: FourKAvailability;
}

export interface UseRemoteSourceOverridesReturn {
  config: RemoteSourceOverrides;
  loading: boolean;
  error: string | null;
  lastFetchTime: Date | null;
  refreshConfig: () => Promise<void>;
  getSourceForMovie: (movieId: string | number) => number;
  getSourceForTv: (tvId: string | number) => number;
  isSourceDisabled: (sourceIndex: number) => boolean;
  // 4K availability functions
  isMovieAvailableIn4K: (movieId: string | number) => boolean;
  isTvShowAvailableIn4K: (tvId: string | number) => boolean;
  get4KMovieUrl: (movieId: string | number) => string | null;
  get4KTvEpisodeUrl: (tvId: string | number, episode: string) => string | null;
}

const useRemoteSourceOverrides = (): UseRemoteSourceOverridesReturn => {  const [config, setConfig] = useState<RemoteSourceOverrides>({
    movieOverrides: {}, // Start with empty - Firebase will populate
    tvOverrides: {},
    emergencyDisabledSources: [],
    sourceHealthCheckEnabled: true,
    fourKAvailability: {
      movies: {},
      tvShows: {}
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Parse JSON safely with fallback
  const safeJSONParse = <T>(jsonString: string, fallback: T): T => {
    try {
      return JSON.parse(jsonString) || fallback;
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString, error);
      return fallback;
    }
  };  // Load config from Remote Config
  const loadRemoteConfig = useCallback(async () => {
    // Firebase is disabled — use hard-coded defaults immediately
    if (!FIREBASE_ENABLED) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('🔄 Loading Remote Config...');
      }
      
      // Try to get current cached values first
      const cachedValues = getAllRemoteConfigValues();
      if (isDev) {
        console.log('📦 Current cached values:', cachedValues);
      }
      
      // If we have cached values, use them while trying to fetch new ones
      if (Object.keys(cachedValues).length > 0) {
        if (isDev) {
          console.log('✅ Using cached Remote Config values');
        }
        
        const movieOverrides = safeJSONParse(
          cachedValues.movieSourceOverrides || '{}',
          {}
        );
        
        const tvOverrides = safeJSONParse(
          cachedValues.tvSourceOverrides || '{}',
          {}
        );
        
        const emergencyDisabledSources = safeJSONParse(
          cachedValues.emergencySourceDisable || '[]',
          []
        );
        
        const sourceHealthCheckEnabled = (cachedValues.sourceHealthCheckEnabled || 'true') === 'true';
        
        const fourKAvailability = safeJSONParse(
          cachedValues.fourKAvailability || '{"movies": {}, "tvShows": {}}',
          { movies: {}, tvShows: {} }
        );
        
        const cachedConfig: RemoteSourceOverrides = {
          movieOverrides,
          tvOverrides,
          emergencyDisabledSources,
          sourceHealthCheckEnabled,
          fourKAvailability,
        };
        
        if (isDev) {
          console.log('📋 Parsed cached Remote Config:', cachedConfig);
        }
        setConfig(cachedConfig);
        setLastFetchTime(new Date());
      }
      
      // Now try to fetch fresh values from Firebase
      const success = await fetchRemoteConfig();
      if (isDev) {
        console.log('📡 Firebase fetch result:', success);
      }
      
      // Whether fetch succeeded or not, try to get the current values
      // (they might be cached from a previous successful fetch)
      const allValues = getAllRemoteConfigValues();
      if (isDev) {
        console.log('📋 All Remote Config values after fetch attempt:', allValues);
      }
      
      if (Object.keys(allValues).length > 0) {        
        // Get raw values first
        const rawMovieOverrides = allValues.movieSourceOverrides || '{}';
        const rawTvOverrides = allValues.tvSourceOverrides || '{}';
        const rawEmergencyDisabled = allValues.emergencySourceDisable || '[]';
        const rawHealthCheck = allValues.sourceHealthCheckEnabled || 'true';
        const rawFourKAvailability = allValues.fourKAvailability || '{"movies": {}, "tvShows": {}}';
        
        if (isDev) {
          console.log('📋 Raw Remote Config values:', {
            movieSourceOverrides: rawMovieOverrides,
            tvSourceOverrides: rawTvOverrides,
            emergencySourceDisable: rawEmergencyDisabled,
            sourceHealthCheckEnabled: rawHealthCheck,
            fourKAvailability: rawFourKAvailability
          });
        }
        
        // Parse all config values
        const movieOverrides = safeJSONParse(rawMovieOverrides, {});
        const tvOverrides = safeJSONParse(rawTvOverrides, {});
        const emergencyDisabledSources = safeJSONParse(rawEmergencyDisabled, []);
        const sourceHealthCheckEnabled = rawHealthCheck === 'true';
        const fourKAvailability = safeJSONParse(rawFourKAvailability, { movies: {}, tvShows: {} });
        
        const newConfig: RemoteSourceOverrides = {
          movieOverrides,
          tvOverrides,
          emergencyDisabledSources,
          sourceHealthCheckEnabled,
          fourKAvailability,
        };
        
        if (isDev) {
          console.log('✅ Parsed Remote Config:', newConfig);
        }
        setConfig(newConfig);
        setLastFetchTime(new Date());
      } else {
        if (isDev) {
          console.warn('⚠️ No Remote Config values available (cached or fresh)');
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading Remote Config:', errorMessage);
      setError(errorMessage);
      
      // Even on error, try to use any available cached values
      const cachedValues = getAllRemoteConfigValues();
      if (Object.keys(cachedValues).length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Using cached values despite error');
        }
        // Parse cached values as fallback... 
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadRemoteConfig();
  }, [loadRemoteConfig]);

  // Auto-refresh every hour (no-op when Firebase is disabled)
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    const interval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Auto-refreshing Remote Config...');
      }
      loadRemoteConfig();
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, [loadRemoteConfig]);
  // Get source index for a specific movie
  const getSourceForMovie = useCallback((movieId: string | number): number => {
    const id = movieId.toString();
    const overrideSource = config?.movieOverrides?.[id];
    
    if (overrideSource !== undefined) {
      // Check if the override source is disabled
      if (config?.emergencyDisabledSources?.includes(overrideSource)) {
        console.warn(`🚫 Source ${overrideSource} is disabled for movie ${id}, using default`);
        return 0; // Always return 0 as default
      }
      return overrideSource;
    }
    
    return 0; // Always return 0 as default
  }, [config]);

  // Get source index for a specific TV show
  const getSourceForTv = useCallback((tvId: string | number): number => {
    const id = tvId.toString();
    const overrideSource = config?.tvOverrides?.[id];
    
    if (overrideSource !== undefined) {
      // Check if the override source is disabled
      if (config?.emergencyDisabledSources?.includes(overrideSource)) {
        console.warn(`🚫 Source ${overrideSource} is disabled for TV ${id}, using default`);
        return 0; // Always return 0 as default
      }
      return overrideSource;
    }
    
    return 0; // Always return 0 as default
  }, [config]);

  // Check if a source is disabled
  const isSourceDisabled = useCallback((sourceIndex: number): boolean => {
    return config?.emergencyDisabledSources?.includes(sourceIndex) ?? false;
  }, [config]);

  // 4K availability functions
  const isMovieAvailableIn4K = useCallback((movieId: string | number): boolean => {
    const id = movieId.toString();
    const fourKMovie = config?.fourKAvailability?.movies?.[id];
    return fourKMovie?.available === true;
  }, [config]);

  const isTvShowAvailableIn4K = useCallback((tvId: string | number): boolean => {
    const id = tvId.toString();
    const fourKTvShow = config?.fourKAvailability?.tvShows?.[id];
    return fourKTvShow?.available === true;
  }, [config]);

  const get4KMovieUrl = useCallback((movieId: string | number): string | null => {
    const id = movieId.toString();
    const fourKMovie = config?.fourKAvailability?.movies?.[id];
    if (fourKMovie?.available && fourKMovie.streamUrl) {
      return fourKMovie.streamUrl;
    }
    return null;
  }, [config]);

  const get4KTvEpisodeUrl = useCallback((tvId: string | number, episode: string): string | null => {
    const id = tvId.toString();
    const fourKTvShow = config?.fourKAvailability?.tvShows?.[id];
    if (fourKTvShow?.available && fourKTvShow.episodes?.[episode]) {
      return fourKTvShow.episodes[episode];
    }
    return null;
  }, [config]);

  // Manual refresh function
  const refreshConfig = useCallback(async () => {
    setLoading(true);
    await loadRemoteConfig();
  }, [loadRemoteConfig]);

  return {
    config,
    loading,
    error,
    lastFetchTime,
    refreshConfig,
    getSourceForMovie,
    getSourceForTv,
    isSourceDisabled,
    isMovieAvailableIn4K,
    isTvShowAvailableIn4K,
    get4KMovieUrl,
    get4KTvEpisodeUrl,
  };
};

export default useRemoteSourceOverrides;
