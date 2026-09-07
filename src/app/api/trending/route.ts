import { NextResponse, NextRequest } from 'next/server';
import { getTrending, enhanceMediaWithLogos } from '@/services/api';
import { MediaItem } from '@/types';
import { CACHE } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeWindow = searchParams.get('timeWindow') as 'day' | 'week' | null;
  const mediaType = searchParams.get('mediaType') as 'movie' | 'tv' | null;
  const withLogos = searchParams.get('withLogos') === 'true'; // Optional parameter for logo enhancement

  // Basic validation
  if (!timeWindow || (timeWindow !== 'day' && timeWindow !== 'week')) {
    return NextResponse.json(
      { error: 'Invalid or missing timeWindow parameter (must be \'day\' or \'week\')' }, 
      { status: 400 }
    );
  }

  if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
    return NextResponse.json(
      { error: 'Invalid or missing mediaType parameter (must be \'movie\' or \'tv\')' }, 
      { status: 400 }
    );
  }

  try {
    let data: MediaItem[] = await getTrending(timeWindow, mediaType);
    
    // Enhance with logos if requested (for hero carousel)
    if (withLogos) {
      data = await enhanceMediaWithLogos(data);
    }
    
    return NextResponse.json(data, { headers: CACHE.trending() });
  } catch (error) {
    console.error(`API Route Error fetching trending ${mediaType}/${timeWindow}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch trending data', details: (error instanceof Error) ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}