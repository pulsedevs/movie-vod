import { NextRequest, NextResponse } from 'next/server';
import { CACHE } from '@/lib/cache';

const API_BASE_URL = 'https://api.themoviedb.org/3';

// Get API key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB API Key is missing in environment variables');
  }
  return apiKey;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tvId = searchParams.get('tvId');
  const seasonNumber = searchParams.get('seasonNumber');
  
  if (!tvId || !seasonNumber) {
    return NextResponse.json(
      { error: 'Missing required parameters: tvId and seasonNumber' },
      { status: 400 }
    );
  }
  
  try {
    const apiKey = getApiKey();
    const url = `${API_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&language=en-US`;
    
    const res = await fetch(url, { 
      next: { revalidate: 86400 } // Cache for 24 hours since season data doesn't change often
    });
    
    if (!res.ok) {
      console.error(`API Error fetching season ${seasonNumber} for TV ${tvId}: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch season data: ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data, { headers: CACHE.season() });
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} for TV ${tvId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch season data', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
