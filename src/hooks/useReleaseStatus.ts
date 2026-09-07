/**
 * Utility functions to determine if movie/TV content is released or not
 * Optimized for performance with memoizable functions
 */

/**
 * Check if a movie is unreleased based on release date
 * @param releaseDate - The movie's release date string
 * @returns boolean - true if the movie is unreleased (future date)
 */
export function isMovieUnreleased(releaseDate: string | null | undefined): boolean {
  if (!releaseDate) return false;
  
  try {
    const release = new Date(releaseDate);
    const now = new Date();
    // Set time to start of day for accurate date comparison
    release.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return release > now;
  } catch {
    return false;
  }
}

/**
 * Check if a TV show is unreleased based on first air date
 * @param firstAirDate - The TV show's first air date string
 * @returns boolean - true if the TV show is unreleased (future date)
 */
export function isTVShowUnreleased(firstAirDate: string | null | undefined): boolean {
  if (!firstAirDate) return false;
  
  try {
    const airDate = new Date(firstAirDate);
    const now = new Date();
    // Set time to start of day for accurate date comparison
    airDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return airDate > now;
  } catch {
    return false;
  }
}

/**
 * Hook to determine release status for any media type
 * @param releaseDate - The release/air date string
 * @param mediaType - 'movie' or 'tv'
 * @returns object with isReleased and isUnreleased booleans
 */
export function useReleaseStatus(releaseDate: string | null | undefined, mediaType: 'movie' | 'tv') {
  if (!releaseDate) {
    return { isReleased: true, isUnreleased: false };
  }

  try {
    const release = new Date(releaseDate);
    const now = new Date();
    
    // Set time to start of day for accurate date comparison
    release.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const isReleased = release <= now;
    return {
      isReleased,
      isUnreleased: !isReleased
    };
  } catch (error) {
    console.error('Error parsing release date:', error);
    // If we can't parse the date, assume it's released to avoid blocking content
    return { isReleased: true, isUnreleased: false };
  }
}
