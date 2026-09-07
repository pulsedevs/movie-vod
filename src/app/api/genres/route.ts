import { NextResponse } from 'next/server';
import { getGenres } from '@/services/api';
import { Genre } from '@/types';
import { CACHE } from '@/lib/cache';

export async function GET() {
  try {
    // Fetch both movie and TV genres in parallel
    const [movieGenres, tvGenres] = await Promise.all([
      getGenres('movie'),
      getGenres('tv'),
    ]);

    const data: { movie: Genre[], tv: Genre[] } = {
      movie: movieGenres,
      tv: tvGenres,
    };

    return NextResponse.json(data, { headers: CACHE.genres() });
  } catch (error) {
    console.error("API Route Error fetching genres:", error);
    // Return a structured error response
    return NextResponse.json(
      { error: 'Failed to fetch genres', details: (error instanceof Error) ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 