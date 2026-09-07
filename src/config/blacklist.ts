/**
 * Blacklist Configuration
 * 
 * This file contains lists of content IDs that should be blocked from the application
 * due to copyright issues or other restrictions.
 */

// Movies that should be blocked from the application
export const BLACKLISTED_MOVIE_IDS: number[] = [
  883987,301507,
];

// TV shows that should be blocked from the application  
export const BLACKLISTED_TV_IDS: number[] = [
  // Add TV show IDs here as needed
];

/**
 * Check if a movie ID is blacklisted
 */
export function isMovieBlacklisted(movieId: number | string): boolean {
  const id = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
  return BLACKLISTED_MOVIE_IDS.includes(id);
}

/**
 * Check if a TV show ID is blacklisted
 */
export function isTvShowBlacklisted(tvId: number | string): boolean {
  const id = typeof tvId === 'string' ? parseInt(tvId, 10) : tvId;
  return BLACKLISTED_TV_IDS.includes(id);
}

/**
 * Filter out blacklisted items from a results array
 */
export function filterBlacklistedContent<T extends { id: number; media_type?: string }>(
  results: T[]
): T[] {
  return results.filter(item => {
    if (item.media_type === 'movie') {
      return !isMovieBlacklisted(item.id);
    } else if (item.media_type === 'tv') {
      return !isTvShowBlacklisted(item.id);
    }
    // For items without media_type, assume movie for backwards compatibility
    return !isMovieBlacklisted(item.id);
  });
}
