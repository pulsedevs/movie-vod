// app/api/bulk-index/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { notifyIndexNow } from '@/lib/indexnow';

// This endpoint helps with bulk indexing requests
export async function POST(request: NextRequest) {
  try {
    const { urls, apiKey } = await request.json();

    // Simple API key protection (replace with your own key)
    const BULK_INDEX_API_KEY = process.env.BULK_INDEX_API_KEY || 'your-secret-key';
    
    if (apiKey !== BULK_INDEX_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array required' }, { status: 400 });
    }

    // Limit to 1000 URLs per request
    const limitedUrls = urls.slice(0, 1000);

    console.log(`📤 Processing bulk index request for ${limitedUrls.length} URLs`);

    // Notify IndexNow
    await notifyIndexNow(limitedUrls);

    return NextResponse.json({ 
      success: true, 
      message: `Submitted ${limitedUrls.length} URLs for indexing`,
      urls: limitedUrls
    });

  } catch (error) {
    console.error('Bulk index error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET endpoint to return indexing status
export async function GET() {
  return NextResponse.json({
    message: 'Bulk indexing API endpoint',
    usage: 'POST with { urls: string[], apiKey: string }',
    limits: 'Max 1000 URLs per request'
  });
}
