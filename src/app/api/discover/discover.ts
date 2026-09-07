import { discoverMedia } from '@/services/api';
import { MediaItem } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mediaType = searchParams.get('mediaType');

  if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
    console.error(`[discover] Invalid or missing mediaType: ${mediaType}`);
    return NextResponse.json({ error: 'Invalid mediaType' }, { status: 400 });
  }

  const page = parseInt(searchParams.get('page') || '1', 10);
  const genres = searchParams.get('genres') || undefined;
  const year = searchParams.get('year') || undefined;
  const sortBy = searchParams.get('sortBy') || undefined;
  const minRating = searchParams.get('minRating') || undefined;
  const language = searchParams.get('language') || undefined;

  console.log(`[discover] Fetching: mediaType=${mediaType}, page=${page}, genres=${genres}, year=${year}, sortBy=${sortBy}, minRating=${minRating}, language=${language}`);

  try {
    const data = await discoverMedia(mediaType as 'movie' | 'tv', {
      page: page > 0 ? page : 1,
      genres,
      year,
      sortBy,
      minRating,
      language,
    });

    console.log(`[discover] Response: mediaType=${mediaType}, results=${data.results.length}, totalPages=${data.totalPages}`);

    return NextResponse.json({
      results: data.results as MediaItem[],
      totalPages: data.totalPages,
      totalResults: data.totalResults,
    });
  } catch (error) {
    console.error(`[discover] Error for mediaType=${mediaType}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}