import { NextRequest, NextResponse } from 'next/server';
import { discoverStreamSources } from '@/utils/sourceHelper';
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter';

async function sourcesHandler(request: Request) {
  try {

    const sources = discoverStreamSources();
    
    // Validate sources structure
    if (!Array.isArray(sources)) {
      throw new Error('Invalid sources data structure');
    }
    
    return NextResponse.json({
      success: true,
      sources,
      count: sources.length
    });
  } catch (error) {
    console.error('Error discovering stream sources:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to discover stream sources',
        sources: [],
        count: 0
      },      { status: 500 }
    );
  }
}

// Apply rate limiting
export const GET = withRateLimit(apiRateLimiter)(sourcesHandler);
