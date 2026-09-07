import { NextResponse, NextRequest } from 'next/server';
import { TVShow, MediaItem } from '@/types';
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter';

// Input validation and sanitization
function validateSearchQuery(query: string): string | null {
  if (!query || typeof query !== 'string') {
    return 'Query is required and must be a string';
  }
  
  const sanitized = query.trim().slice(0, 100);
  
  if (sanitized.length < 1) {
    return 'Query cannot be empty';
  }
  
  if (sanitized.length > 100) {
    return 'Query is too long';
  }
  
  // Check for malicious patterns
  if (/<script|javascript:|data:|vbscript:/i.test(sanitized)) {
    return 'Invalid query format';
  }
  
  return null;
}

function validatePage(page: string): boolean {
  const pageNum = parseInt(page, 10);
  return !isNaN(pageNum) && pageNum >= 1 && pageNum <= 1000;
}

// Enhanced anime search using discover endpoint with text query
async function searchAnime(query: string, page: string = '1'): Promise<{
  results: MediaItem[];
  totalPages: number;
  totalResults: number;
}> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB API Key is missing');
  }

  // Build query parameters for anime search using discover endpoint
  const queryParams = new URLSearchParams();
  queryParams.append('api_key', apiKey);
  queryParams.append('language', 'en-US');
  queryParams.append('page', page);
  queryParams.append('include_adult', 'false');
  queryParams.append('include_video', 'false');
  
  // Anime-specific filtering (based on TMDB forum best practices)
  queryParams.append('with_genres', '16'); // Animation genre
  queryParams.append('with_keywords', '210024|287501'); // Anime keywords
  queryParams.append('with_origin_country', 'JP'); // Japanese origin
  
  // Use with_text_query for better anime search results
  queryParams.append('with_text_query', query);
  
  // Sort by popularity for better results
  queryParams.append('sort_by', 'popularity.desc');
  
  // Add minimum vote count for quality results
  queryParams.append('vote_count.gte', '10');

  const url = `https://api.themoviedb.org/3/discover/tv?${queryParams.toString()}`;

  console.log(`[API] Anime search request to TMDB - Query: "${query}", Page: ${page}, URL: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'StreamVibe/1.0',
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`);
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid response structure from TMDB');
    }

    // Transform TV show data to MediaItem format
    const transformedResults: MediaItem[] = data.results.map((tvShow: TVShow) => ({
      id: tvShow.id,
      title: tvShow.name,
      media_type: 'tv' as const,
      poster_path: tvShow.poster_path,
      backdrop_path: tvShow.backdrop_path,
      overview: tvShow.overview,
      release_date: tvShow.first_air_date,
      vote_average: tvShow.vote_average,
      vote_count: tvShow.vote_count,
      genre_ids: tvShow.genre_ids,
      popularity: tvShow.popularity,
      original_language: tvShow.original_language,
      adult: false,
    }));

    return {
      results: transformedResults,
      totalPages: Math.min(data.total_pages || 1, 1000), // TMDB limits to 1000 pages
      totalResults: data.total_results || 0,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Anime search request timeout');
        throw new Error('Search request timeout');
      }
      console.error('Anime search error:', error.message);
      throw error;
    }
    
    console.error('Unknown anime search error:', error);
    throw new Error('Unknown error occurred during anime search');
  }
}

const animeSearchHandler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';

  // Validate input
  const validationError = validateSearchQuery(query || '');
  if (validationError) {
    return NextResponse.json({
      error: validationError,
      results: [],
      totalPages: 0,
      totalResults: 0
    }, { status: 400 });
  }

  if (!validatePage(page)) {
    return NextResponse.json({
      error: 'Invalid page number',
      results: [],
      totalPages: 0,
      totalResults: 0
    }, { status: 400 });
  }

  const sanitizedQuery = query!.trim().slice(0, 100);

  try {
    const searchResults = await searchAnime(sanitizedQuery, page);

    return NextResponse.json({
      query: sanitizedQuery,
      page: parseInt(page, 10),
      ...searchResults
    });
  } catch (error) {
    console.error('Anime search API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = errorMessage.includes('timeout') ? 504 : 
                      errorMessage.includes('API error') ? 502 : 500;

    return NextResponse.json({
      error: 'Anime search service temporarily unavailable',
      results: [],
      totalPages: 0,
      totalResults: 0
    }, { status: statusCode });
  }
};

// Apply rate limiting
export const GET = withRateLimit(apiRateLimiter)(animeSearchHandler);
