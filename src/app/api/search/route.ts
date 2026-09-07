import { NextRequest, NextResponse } from 'next/server';
import { filterBlacklistedContent } from '@/config/blacklist';
import { apiRateLimiter, getClientIP, withRateLimit } from '@/lib/rate-limiter';
import { CACHE } from '@/lib/cache';

// Input validation and sanitization
const validateSearchQuery = (query: string): string | null => {
  if (!query || typeof query !== 'string') {
    return 'Query is required and must be a string';
  }
  
  // Remove potentially harmful characters
  const sanitized = query.trim().slice(0, 100); // Limit length
  
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
};

const searchHandler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // Validate input
  const validationError = validateSearchQuery(query || '');
  if (validationError) {
    return NextResponse.json({ 
      error: validationError,
      results: [] 
    }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 });
  }

  // Sanitize and encode query
  const sanitizedQuery = query!.trim().slice(0, 100);
  const encodedQuery = encodeURIComponent(sanitizedQuery);
  const pageParam = searchParams.get('page');
  const page = Math.max(1, Math.min(500, Number.parseInt(pageParam || '1', 10) || 1));

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=en-US&query=${encodedQuery}&include_adult=false&page=${page}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Movie-Streaming-App/1.0',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}`);
      return NextResponse.json({ 
        error: 'Search service temporarily unavailable',
        results: [] 
      }, { status: 503 });
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || !Array.isArray(data.results)) {
      return NextResponse.json({ 
        error: 'Invalid response from search service',
        results: [] 
      }, { status: 502 });
    }

    // Filter and sanitize results
    const initialResults = data.results
      .filter((item: any) => {
        return item && 
               (item.media_type === 'movie' || item.media_type === 'tv') && 
               item.poster_path &&
               item.id &&
               typeof item.id === 'number';
      })
      .map((item: any) => ({
        id: item.id,
        title: item.title || item.name || 'Unknown Title',
        media_type: item.media_type,
        poster_path: item.poster_path,
        overview: item.overview || '',
        release_date: item.release_date || item.first_air_date || '',
        vote_average: item.vote_average || 0,
      }));

    // Filter out blacklisted content (TMDB already ranks by relevance per page).
    const filteredResults = filterBlacklistedContent(initialResults);

    return NextResponse.json({
      results: filteredResults,
      page: data.page ?? page,
      total_pages: data.total_pages ?? 1,
      total_results: data.total_results ?? filteredResults.length,
    }, { headers: CACHE.search() });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: 'Search service temporarily unavailable',
      results: [] 
    }, { status: 503 });
  }
}

// Apply rate limiting
export const GET = withRateLimit(apiRateLimiter)(searchHandler);