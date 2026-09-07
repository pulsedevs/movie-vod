import { NextResponse, NextRequest } from 'next/server';
import { Movie, TVShow, MediaItem } from '@/types';
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter';
import { filterBlacklistedContent } from '@/config/blacklist';
import { CACHE } from '@/lib/cache';

// Base URL for TMDB API
const API_BASE_URL = 'https://api.themoviedb.org/3';

// Input validation and sanitization
function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

function validateMediaType(mediaType: string): mediaType is 'movie' | 'tv' | 'anime' {
  return ['movie', 'tv', 'anime'].includes(mediaType);
}

function validateYear(year: string): boolean {
  const yearNum = parseInt(year, 10);
  return !isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 5;
}

function validateRating(rating: string): boolean {
  const ratingNum = parseFloat(rating);
  return !isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 10;
}

function validatePage(page: string): boolean {
  const pageNum = parseInt(page, 10);
  return !isNaN(pageNum) && pageNum >= 1 && pageNum <= 1000; // TMDB limit
}

// Function to format a query parameter array to comma-separated string
function formatQueryParam(value: string | string[] | null): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value.join(',') : value;
}

// Function to discover movies or TV shows with filters
async function discoverMedia(
  mediaType: 'movie' | 'tv' | 'anime',
  params: {
    genres?: string | null;
    year?: string | null;
    sortBy?: string | null;
    minRating?: string | null;
    minVoteCount?: string | null;
    language?: string | null;
    page?: string | null;
    textQuery?: string | null;
    provider?: string | null;
  }
): Promise<{ results: MediaItem[]; totalPages: number; totalResults: number }> {
  const { genres, year, sortBy, minRating, minVoteCount, language, textQuery, provider } = params;
  
  // Ensure page is a valid number string (default to '1')
  // Parse it as an integer, then back to string to normalize it
  const pageStr = params.page && /^\d+$/.test(params.page) ? params.page : '1';
  const pageNum = parseInt(pageStr, 10);
  const page = pageNum > 0 ? String(pageNum) : '1';
  
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB API Key is missing');
  }

  // For anime, we use TV endpoint with Japanese filters
  const actualMediaType = mediaType === 'anime' ? 'tv' : mediaType;

  // Build query parameters for the API call
  const queryParams = new URLSearchParams();
  queryParams.append('api_key', apiKey);  
  // Set language parameter with anime-specific filtering
  if (mediaType === 'anime') {
    queryParams.append('language', language || 'en-US');
    
    // Proper anime filtering based on TMDB best practices:
    // 1. Animation genre (ID: 16)
    // 2. Anime keywords (210024|287501) 
    // 3. Japanese origin country
    queryParams.append('with_genres', '16'); // Animation genre
    queryParams.append('with_keywords', '210024|287501'); // Anime keywords
    queryParams.append('with_origin_country', 'JP'); // Japanese origin
    
    // If user specifically selected other genres, append them to animation
    if (genres && genres !== '16') {
      queryParams.set('with_genres', `16,${genres}`); // Always include animation + selected genres
    }
  } else {
    queryParams.append('language', language || 'en-US');
    // Add genre filter for non-anime content
    if (genres) queryParams.append('with_genres', genres);
  }
  
  queryParams.append('include_adult', 'false');
  queryParams.append('include_video', 'false'); // Consistent with TMDB API
  queryParams.append('page', page);
  
  // Add language filter for non-anime content
  if (mediaType !== 'anime' && language && language !== 'en-US') {
    // For movie original language filter
    queryParams.append('with_original_language', language.split('-')[0]);
  }
  
  // Handle year differently based on media type
  if (year) {
    if (actualMediaType === 'movie') {
      queryParams.append('primary_release_year', year);
    } else {
      queryParams.append('first_air_date_year', year);
    }
  }
  
  // Add sorting if provided
  if (sortBy) {
    queryParams.append('sort_by', sortBy);
  } else {
    // Default sort - ensures consistent results    queryParams.append('sort_by', 'popularity.desc');
  }
  
  // Add text query for enhanced search (particularly useful for anime)
  if (textQuery) {
    queryParams.append('with_text_query', textQuery.trim());
  }
  
  // Add minimum rating filter
  if (minRating) queryParams.append('vote_average.gte', minRating);
  
  // Add minimum vote count to ensure reliable ratings
  if (minVoteCount && minVoteCount !== 'auto') {
    // User specified vote count
    if (minVoteCount !== '0') {
      queryParams.append('vote_count.gte', minVoteCount);
    }
  } else {
    // Auto mode: apply smart defaults based on media type
    const autoMinVoteCount = actualMediaType === 'movie' ? '100' : '50';
    queryParams.append('vote_count.gte', autoMinVoteCount);
  }
  
  if (provider) {
    queryParams.append('with_watch_providers', provider);
    queryParams.append('watch_region', 'US');
  }

  const url = `${API_BASE_URL}/discover/${actualMediaType}?${queryParams.toString()}`;
    try {
    console.log(`[API] Discover ${mediaType} (${actualMediaType}) request to TMDB - Page: ${page}, Language: ${language || (mediaType === 'anime' ? 'ja-JP' : 'en-US')}, URL: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      next: { revalidate: 3600, tags: [`discover-${mediaType}-page-${page}`] },
      signal: controller.signal,
      headers: {
        'User-Agent': 'StreamVibe/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} for URL: ${url}`);
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid TMDB API response format');
    }
    
    console.log(`[API] TMDB response: page=${data.page}, total_pages=${data.total_pages}, total_results=${data.total_results}`);
    
    // Transform the data to include media_type for each item
    const results = data.results.map((item: any) => ({
      ...item,
      media_type: mediaType
    })) as MediaItem[];

    // Filter out blacklisted content
    const filteredResults = filterBlacklistedContent(results);

    return {
      results: filteredResults,
      totalPages: data.total_pages,
      totalResults: data.total_results
    };
  } catch (error) {
    console.error(`Error fetching ${mediaType} data:`, error);
    throw error;
  }
}

async function discoverHandler(request: Request) {
  const nextRequest = request as NextRequest;
  try {
    const searchParams = nextRequest.nextUrl.searchParams;
      // Extract and validate parameters
    const rawMediaType = searchParams.get('mediaType');
    const rawGenres = formatQueryParam(searchParams.get('genres'));
    const rawYear = searchParams.get('year');
    const rawSortBy = searchParams.get('sortBy');
    const rawMinRating = searchParams.get('minRating');    const rawMinVoteCount = searchParams.get('minVoteCount');
    const rawLanguage = searchParams.get('language');
    const rawTextQuery = searchParams.get('textQuery');
    let rawPage = searchParams.get('page') || '1';
    
    // Input validation
    if (!rawMediaType) {
      return NextResponse.json(
        { error: 'mediaType parameter is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const mediaType = sanitizeInput(rawMediaType);
      if (!validateMediaType(mediaType)) {
      return NextResponse.json(
        { error: 'Invalid mediaType parameter (must be "movie", "tv", or "anime")' },
        { status: 400 }
      );
    }    // Validate and sanitize optional parameters
    let genres = rawGenres ? sanitizeInput(rawGenres) : null;
    let year = rawYear ? sanitizeInput(rawYear) : null;
    let sortBy = rawSortBy ? sanitizeInput(rawSortBy) : null;
    let minRating = rawMinRating ? sanitizeInput(rawMinRating) : null;    let minVoteCount = rawMinVoteCount ? sanitizeInput(rawMinVoteCount) : null;
    let language = rawLanguage ? sanitizeInput(rawLanguage) : null;
    let textQuery = rawTextQuery ? sanitizeInput(rawTextQuery) : null;
    const rawProvider = searchParams.get('provider');
    const provider = rawProvider ? sanitizeInput(rawProvider) : null;

    // Validate specific parameters
    if (year && !validateYear(year)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }
    
    if (minRating && !validateRating(minRating)) {
      return NextResponse.json(
        { error: 'Invalid minRating parameter (must be between 0 and 10)' },
        { status: 400 }
      );
    }
    
    if (!validatePage(rawPage)) {
      rawPage = '1';
    }
    
    const page = sanitizeInput(rawPage);
      console.log(`[API route] Request for ${mediaType}, page=${page}, genres=${genres}, year=${year}, sortBy=${sortBy}, minVoteCount=${minVoteCount}, language=${language}`);
      const data = await discoverMedia(mediaType, {
      genres,
      year,
      sortBy,
      minRating,
      minVoteCount,
      language,
      textQuery,
      provider,
      page
    });
    
    return NextResponse.json(data, { headers: CACHE.discover() });
  } catch (error) {
    console.error('Discover API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch discovery data', 
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Internal server error'
      },      { status: 500 }
    );
  }
}

// Apply rate limiting
export const GET = withRateLimit(apiRateLimiter)(discoverHandler);