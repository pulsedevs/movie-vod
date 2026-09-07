// Utility to validate TMDB data before including in sitemap
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache for validated items to avoid redundant API calls
const validationCache = new Map<string, boolean>();

// Function to validate a single TMDB item
export async function validateTmdbItem(id: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
  const cacheKey = `${mediaType}-${id}`;
  
  // Check cache first
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }
  
  try {
    if (!TMDB_API_KEY) {
      console.warn('TMDB_API_KEY not found, skipping validation');
      return true; // Assume valid if we can't validate
    }
    
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url, { 
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const isValid = response.status === 200;
    
    // Cache the result
    validationCache.set(cacheKey, isValid);
    
    if (!isValid) {
      console.warn(`Invalid ${mediaType} ID ${id}: HTTP ${response.status}`);
    }
    
    return isValid;
    
  } catch (error) {
    console.warn(`Validation error for ${mediaType} ${id}:`, (error as Error).message);
    // In case of network errors, assume valid to avoid removing too many items
    validationCache.set(cacheKey, true);
    return true;
  }
}

// Function to validate a batch of items
export async function validateTmdbBatch(
  items: Array<{ id: number; mediaType: 'movie' | 'tv' }>,
  concurrency = 3
): Promise<Array<{ id: number; mediaType: 'movie' | 'tv'; isValid: boolean }>> {
  const results: Array<{ id: number; mediaType: 'movie' | 'tv'; isValid: boolean }> = [];
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (item) => {
      const isValid = await validateTmdbItem(item.id, item.mediaType);
      return { ...item, isValid };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Function to filter out invalid items from sitemap data
export function filterValidItems<T extends { id: number }>(
  items: T[],
  mediaType: 'movie' | 'tv'
): T[] {
  return items.filter(item => {
    // Basic validation rules
    if (!item.id || item.id < 1 || item.id > 10000000) {
      console.warn(`Filtering out invalid ${mediaType} ID:`, item.id);
      return false;
    }
    
    return true;
  });
}

// Function to clean up invalid URLs from existing sitemap data
export function sanitizeSitemapUrls(urls: string[]): string[] {
  return urls.filter(url => {
    try {
      // Basic URL validation
      new URL(url);
      
      // Check if it's a valid movie/TV URL pattern
      const movieTvPattern = /\/(movie|tv)\/(\d+)\/([a-z0-9\-]+)$/;
      const match = url.match(movieTvPattern);
      
      if (match) {
        const [, mediaType, idStr, slug] = match;
        const id = parseInt(idStr);
        
        // Validate ID range
        if (id < 1 || id > 10000000) {
          console.warn(`Filtering out suspicious URL:`, url);
          return false;
        }
        
        // Validate slug format
        if (!slug || slug.length < 2 || slug.includes('--')) {
          console.warn(`Filtering out malformed slug URL:`, url);
          return false;
        }
      }
      
      return true;
    } catch {
      console.warn(`Filtering out invalid URL:`, url);
      return false;
    }
  });
}

// Clear validation cache (useful for development)
export function clearValidationCache(): void {
  validationCache.clear();
}

// Get cache stats
export function getValidationCacheStats(): { size: number; keys: string[] } {
  return {
    size: validationCache.size,
    keys: Array.from(validationCache.keys()).slice(0, 10) // First 10 keys as sample
  };
}
