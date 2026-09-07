// Utility functions to parse video URLs and extract media information
import { getMovieUrl, getTvShowUrl } from './movieLinks';

export interface ParsedVideoUrl {
  mediaType: 'movie' | 'tv';
  mediaId: string;
  seasonNumber?: number;
  episodeNumber?: number;
  sourceIndex?: number;
}

/**
 * Parse a video streaming URL to extract media information
 * Supports common streaming URL patterns like:
 * - https://vidsrc.vip/movie/12345
 * - https://vidsrc.vip/tv/12345/1/2
 * - https://bludclart.com/movie/12345/watch
 * - https://bludclart.com/tv/12345/watch?season=1&episode=2
 */
export function parseVideoUrl(videoUrl: string): ParsedVideoUrl | null {
  try {
    const url = new URL(videoUrl);

    // cinetaro.tv/.../sub.php?id={tmdb}-movie or id={tmdb}-{season}-{episode}
    if (
      (url.hostname === 'cinetaro.tv' || url.hostname === 'www.cinetaro.tv') &&
      url.pathname.includes('sub.php')
    ) {
      const idParam = url.searchParams.get('id');
      if (!idParam) return null;
      if (idParam.endsWith('-movie')) {
        return {
          mediaType: 'movie',
          mediaId: idParam.slice(0, -'-movie'.length),
        };
      }
      const dashParts = idParam.split('-');
      if (dashParts.length >= 3) {
        const epStr = dashParts[dashParts.length - 1];
        const seStr = dashParts[dashParts.length - 2];
        if (!epStr || !seStr) return null;
        const episodeNumber = parseInt(epStr, 10);
        const seasonNumber = parseInt(seStr, 10);
        const mediaId = dashParts.slice(0, -2).join('-');
        if (mediaId && !Number.isNaN(seasonNumber) && !Number.isNaN(episodeNumber)) {
          return {
            mediaType: 'tv',
            mediaId,
            seasonNumber,
            episodeNumber,
          };
        }
      }
      return null;
    }

    // Parse path segments
    const pathSegments = url.pathname.split('/').filter(segment => segment);
    
    // Handle different URL patterns
    if (pathSegments.length >= 2) {
      const mediaType = pathSegments[0] as 'movie' | 'tv';
      const mediaId = pathSegments[1];
      
      if (mediaType === 'movie') {
        return {
          mediaType: 'movie',
          mediaId
        };
      } else if (mediaType === 'tv') {
        // Check if season/episode are in path (vidsrc pattern) or query params (bludclart pattern)
        if (pathSegments.length >= 4) {
          // Pattern: /tv/{id}/{season}/{episode}
          return {
            mediaType: 'tv',
            mediaId,
            seasonNumber: parseInt(pathSegments[2], 10),
            episodeNumber: parseInt(pathSegments[3], 10)
          };
        } else {
          // Check query parameters for season/episode
          const season = url.searchParams.get('season');
          const episode = url.searchParams.get('episode');
          
          if (season && episode) {
            return {
              mediaType: 'tv',
              mediaId,
              seasonNumber: parseInt(season, 10),
              episodeNumber: parseInt(episode, 10)
            };
          } else {
            // TV show without specific episode
            return {
              mediaType: 'tv',
              mediaId
            };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing video URL:', error);
    return null;
  }
}

/**
 * Build our app's page URL for the given media with optional source index
 * Since we don't have the title here, we use a generic slug that will redirect properly
 */
export function buildAppPageUrl(parsedUrl: ParsedVideoUrl, sourceIndex?: number): string {
  // Use generic slugs that will be redirected by the dynamic routes
  const baseUrl = parsedUrl.mediaType === 'movie' 
    ? getMovieUrl(parsedUrl.mediaId, 'watch')
    : getTvShowUrl(parsedUrl.mediaId, 'watch');
  
  const params = new URLSearchParams();
  
  // Add season/episode for TV shows
  if (parsedUrl.mediaType === 'tv' && parsedUrl.seasonNumber && parsedUrl.episodeNumber) {
    params.set('season', parsedUrl.seasonNumber.toString());
    params.set('episode', parsedUrl.episodeNumber.toString());
  }
  
  // Add source index if provided
  if (typeof sourceIndex === 'number') {
    params.set('source', sourceIndex.toString());
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Extract media information from a video URL and build the appropriate app page URL
 */
export function getRedirectUrlFromVideoUrl(videoUrl: string, sourceIndex?: number): string | null {
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) return null;
  
  return buildAppPageUrl(parsed, sourceIndex);
}
