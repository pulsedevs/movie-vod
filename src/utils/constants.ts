// src/utils/constants.ts
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
// Common sizes: w300, w500, w780, original

// Optimized image sizes for different screen sizes
export const OPTIMIZED_IMAGE_SIZES = {
  poster: {
    tiny: 'w92',
    small: 'w154',
    medium: 'w300',
    large: 'w500',
    xlarge: 'w780'
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  },
  profile: {
    tiny: 'w45',
    small: 'w185',
    medium: 'h632',
    original: 'original'
  },
  logo: {
    small: 'w92',
    medium: 'w300',
    large: 'w500'
  }
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};