// Hard-coded fallback source overrides for movies and TV shows
// These serve as fallbacks when Firebase Remote Config is unavailable
// Firebase Remote Config will override these values when available

// Media ID to source index mappings (0-based indices)
// 0 = Source 1, 1 = Source 2, etc.

// Per-title source overrides — populate via Firebase Remote Config when re-enabled
export const MOVIE_SOURCE_OVERRIDES: Record<string, number> = {};

export const TV_SOURCE_OVERRIDES: Record<string, number> = {};

// Default source indices (used when no specific override exists)
export const DEFAULT_MOVIE_SOURCE = 0;  // Source 1
export const DEFAULT_TV_SOURCE = 0;     // Source 1

/**
 * Get source index for a movie, with Firebase Remote Config integration
 * @param movieId - TMDB movie ID
 * @param remoteConfig - Optional remote config overrides from Firebase
 * @returns Source index (0-based)
 */
export const getMovieSourceIndex = (
  movieId: string | number,
  remoteConfig?: {
    movieOverrides?: Record<string, number>;
    defaultMovieSource?: number;
    emergencyDisabledSources?: number[];
  }
): number => {
  const id = movieId.toString();
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log(`🔧 getMovieSourceIndex Debug for movie ${id}:`);
    console.log(`   → Remote config available:`, !!remoteConfig);
    console.log(`   → Movie overrides:`, remoteConfig?.movieOverrides);
  }
  
  // First priority: Firebase Remote Config
  if (remoteConfig?.movieOverrides) {
    const remoteSource = remoteConfig.movieOverrides[id];
    if (isDev) {
      console.log(`   → Remote source for ${id}:`, remoteSource);
    }
    
    if (remoteSource !== undefined) {
      // Check if source is emergency disabled
      if (remoteConfig.emergencyDisabledSources?.includes(remoteSource)) {
        console.warn(`🚫 Remote source ${remoteSource} disabled for movie ${id}, using default`);
        return remoteConfig.defaultMovieSource ?? DEFAULT_MOVIE_SOURCE;
      }
      if (isDev) {
        console.log(`   → Using Firebase Remote Config source: ${remoteSource}`);
      }
      return remoteSource;
    }
    // Use remote default if no specific override
    if (remoteConfig.defaultMovieSource !== undefined) {
      if (isDev) {
        console.log(`   → Using remote default source: ${remoteConfig.defaultMovieSource}`);
      }
      return remoteConfig.defaultMovieSource;
    }
  }
  
  // Second priority: Hard-coded overrides
  const fallbackSource = MOVIE_SOURCE_OVERRIDES[id];
  if (fallbackSource !== undefined) {
    if (isDev) {
      console.log(`   → Using hard-coded fallback source: ${fallbackSource}`);
    }
    return fallbackSource;
  }
  
  // Last resort: Default source
  if (isDev) {
    console.log(`   → Using default source: ${DEFAULT_MOVIE_SOURCE}`);
  }
  return DEFAULT_MOVIE_SOURCE;
};

/**
 * Get source index for a TV show, with Firebase Remote Config integration
 * @param tvId - TMDB TV show ID
 * @param remoteConfig - Optional remote config overrides from Firebase
 * @returns Source index (0-based)
 */
export const getTvSourceIndex = (
  tvId: string | number,
  remoteConfig?: {
    tvOverrides?: Record<string, number>;
    defaultTvSource?: number;
    emergencyDisabledSources?: number[];
  }
): number => {
  const id = tvId.toString();
  
  // First priority: Firebase Remote Config
  if (remoteConfig?.tvOverrides) {
    const remoteSource = remoteConfig.tvOverrides[id];
    if (remoteSource !== undefined) {
      // Check if source is emergency disabled
      if (remoteConfig.emergencyDisabledSources?.includes(remoteSource)) {
        console.warn(`🚫 Remote source ${remoteSource} disabled for TV ${id}, using default`);
        return remoteConfig.defaultTvSource ?? DEFAULT_TV_SOURCE;
      }
      return remoteSource;
    }
    // Use remote default if no specific override
    if (remoteConfig.defaultTvSource !== undefined) {
      return remoteConfig.defaultTvSource;
    }
  }
  
  // Second priority: Hard-coded overrides
  const fallbackSource = TV_SOURCE_OVERRIDES[id];
  if (fallbackSource !== undefined) {
    return fallbackSource;
  }
  
  // Last resort: Default source
  return DEFAULT_TV_SOURCE;
};