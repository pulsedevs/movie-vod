import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails, getTvShowDetails } from '@/services/api';
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter';
import { CACHE } from '@/lib/cache';

// Input validation and sanitization
function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

function validateMediaType(type: string): type is 'movie' | 'tv' {
  return ['movie', 'tv'].includes(type);
}

function validateMediaId(id: string): boolean {
  const idNum = parseInt(id, 10);
  return !isNaN(idNum) && idNum > 0 && idNum < 10000000; // Reasonable TMDB ID range
}

async function mediaDetailsHandler(request: Request) {
  const nextRequest = request as NextRequest;
  try {
    const searchParams = nextRequest.nextUrl.searchParams;
    const rawId = searchParams.get('id');
    const rawType = searchParams.get('type');
    
    // Input validation
    if (!rawId || !rawType) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and type' },
        { status: 400 }
      );
    }
    
    // Sanitize inputs
    const id = sanitizeInput(rawId);
    const type = sanitizeInput(rawType);
    
    if (!validateMediaId(id)) {
      return NextResponse.json(
        { error: 'Invalid media ID format' },
        { status: 400 }
      );
    }
    
    if (!validateMediaType(type)) {
      return NextResponse.json(
        { error: 'Invalid media type. Must be "movie" or "tv"' },
        { status: 400 }
      );
    }
    
    let data;
    if (type === 'movie') {
      data = await getMovieDetails(id);
    } else {
      data = await getTvShowDetails(id);
    }
    
    return NextResponse.json(data, { headers: CACHE.details() });
  } catch (error) {
    console.error(`Error fetching media details:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch media details',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          'Internal server error'
      },
      { status: 500 }
    );  }
}

// Apply rate limiting
export const GET = withRateLimit(apiRateLimiter)(mediaDetailsHandler);