import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter';
import { CACHE } from '@/lib/cache';

/**
 * Proxy API for YouTube API requests to keep API key secure
 * - videoInfo: Get video information (title, like count, comment count)
 * - comments: Get comments for a video
 */

// Input validation and sanitization
function validateVideoId(videoId: string): boolean {
  // YouTube video IDs are 11 characters, alphanumeric + underscore + hyphen
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

function validateAction(action: string): action is 'videoInfo' | 'comments' {
  return ['videoInfo', 'comments'].includes(action);
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, '');
}

async function youtubeHandler(request: Request) {
  const nextRequest = request as NextRequest;
  try {

    // Get API keys from environment (comma-separated)
    const apiKeys = (process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    if (!apiKeys.length) {
      return NextResponse.json(
        { error: 'YouTube API key(s) are not configured' },
        { status: 500 }
      );
    }    // Get and validate parameters from URL
    const searchParams = nextRequest.nextUrl.searchParams;
    const rawAction = searchParams.get('action');
    const rawVideoId = searchParams.get('videoId');

    // Input validation
    if (!rawAction) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    if (!rawVideoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const action = sanitizeInput(rawAction);
    const videoId = sanitizeInput(rawVideoId);

    if (!validateAction(action)) {
      return NextResponse.json(
        { error: 'Invalid action parameter. Must be "videoInfo" or "comments"' },
        { status: 400 }
      );
    }

    if (!validateVideoId(videoId)) {
      return NextResponse.json(
        { error: 'Invalid videoId format' },
        { status: 400 }
      );
    }    if (action === 'videoInfo') {
      let lastError = null;
      for (const apiKey of apiKeys) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`,
            { 
              signal: controller.signal,
              headers: {
                'User-Agent': 'StreamVibe/1.0'
              }
            }
          );
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();

            // Validate response structure
            if (!data.items || !Array.isArray(data.items)) {
              throw new Error('Invalid YouTube API response format');
            }

            return NextResponse.json(data, { headers: CACHE.youtube() });
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`YouTube API key failed (${apiKey.slice(0, 8)}...):`, response.status, errorText);
            lastError = response;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error(`YouTube API fetch error (${apiKey.slice(0, 8)}...):`, fetchError);
          lastError = { status: 500 };
        }
      }
      return NextResponse.json(
        { error: `YouTube API error: ${lastError?.status || 'unknown'}` },
        { status: lastError?.status || 500 }
      );
    }

    else if (action === 'comments') {
      const rawPageToken = searchParams.get('pageToken') || '';
      const rawMaxResults = searchParams.get('maxResults') || '20';
      
      // Validate and sanitize additional parameters
      const pageToken = sanitizeInput(rawPageToken);
      const maxResults = parseInt(rawMaxResults, 10);
      
      if (isNaN(maxResults) || maxResults < 1 || maxResults > 100) {
        return NextResponse.json(
          { error: 'Invalid maxResults parameter. Must be between 1 and 100' },
          { status: 400 }
        );
      }
      
      let lastError = null;
      for (const apiKey of apiKeys) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          let url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(videoId)}&maxResults=${maxResults}&key=${encodeURIComponent(apiKey)}&textFormat=plainText`;
          if (pageToken) {
            url += `&pageToken=${encodeURIComponent(pageToken)}`;
          }
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'StreamVibe/1.0'
            }
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();

            // Validate response structure
            if (!data.items || !Array.isArray(data.items)) {
              throw new Error('Invalid YouTube API response format');
            }

            return NextResponse.json(data, { headers: CACHE.youtube() });
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`YouTube API key failed (${apiKey.slice(0, 8)}...):`, response.status, errorText);
            lastError = response;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error(`YouTube API fetch error (${apiKey.slice(0, 8)}...):`, fetchError);
          lastError = { status: 500 };
        }
      }
      return NextResponse.json(
        { error: `YouTube API error: ${lastError?.status || 'unknown'}` },
        { status: lastError?.status || 500 }
      );
    }

    else {
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
    }  } catch (error) {
    console.error('YouTube API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting
export const GET = withRateLimit(apiRateLimiter)(youtubeHandler);