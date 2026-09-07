import { NextResponse, NextRequest } from 'next/server';
import { getPopularMovies, getPopularTvShows } from '@/services/api';
import { MediaItem } from '@/types';
import { CACHE } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mediaType = searchParams.get('mediaType') as 'movie' | 'tv' | null;
  const pageParam = searchParams.get('page');

  // Validate mediaType
  if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
    return NextResponse.json(
      { error: 'Invalid or missing mediaType parameter (must be \'movie\' or \'tv\')' }, 
      { status: 400 }
    );
  }

  // Parse and validate page number
  let page = 1;
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    } else {
      return NextResponse.json(
        { error: 'Invalid page parameter (must be a positive number)' }, 
        { status: 400 }
      );
    }
  }

  try {
    let data: MediaItem[] = [];
    if (mediaType === 'movie') {
      data = await getPopularMovies(page); // Pass page number
    } else {
      data = await getPopularTvShows(page); // Pass page number
    }
    return NextResponse.json(data, { headers: CACHE.popular() });
  } catch (error) {
    console.error(`API Route Error fetching popular ${mediaType} page ${page}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch popular data', details: (error instanceof Error) ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 