import { NextRequest, NextResponse } from 'next/server';
import { getSimilarMovies, getSimilarTvShows } from '@/services/api';
import { CACHE } from '@/lib/cache';

const MIN_VOTE_COUNT = 20;
const MIN_VOTE_AVERAGE = 5.0;

export async function GET(request: NextRequest) {
  const mediaType = request.nextUrl.searchParams.get('mediaType');
  const id = request.nextUrl.searchParams.get('id');
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '6', 10), 12);

  if (!id || (mediaType !== 'movie' && mediaType !== 'tv')) {
    return NextResponse.json({ error: 'Invalid mediaType or id' }, { status: 400 });
  }

  try {
    // Fetch two pages so filtering doesn't leave us short
    const [page1, page2] = await Promise.all([
      mediaType === 'movie' ? getSimilarMovies(id, 1) : getSimilarTvShows(id, 1),
      mediaType === 'movie' ? getSimilarMovies(id, 2) : getSimilarTvShows(id, 2),
    ]);

    const seen = new Set<number>();
    const filtered = [...page1, ...page2]
      .filter(item => {
        if (!item.poster_path) return false;
        if ((item.vote_count ?? 0) < MIN_VOTE_COUNT) return false;
        if ((item.vote_average ?? 0) < MIN_VOTE_AVERAGE) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, limit);

    return NextResponse.json({ results: filtered }, { headers: CACHE.similar() });
  } catch (error) {
    console.error('Similar API error:', error);
    return NextResponse.json({ results: [] });
  }
}
