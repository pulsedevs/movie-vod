import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const buildInfoPath = path.join(process.cwd(), 'public', 'build-info.json');
    
    // Check if build-info.json exists
    if (!fs.existsSync(buildInfoPath)) {
      // Create a default build info if it doesn't exist
      const defaultBuildInfo = {
        buildTime: Date.now().toString(),
        buildDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      fs.writeFileSync(buildInfoPath, JSON.stringify(defaultBuildInfo, null, 2));
    }
    
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
    
    // Return with no-cache headers to ensure fresh data
    return NextResponse.json(buildInfo, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error reading build info:', error);
    
    // Return current timestamp as fallback
    const fallbackInfo = {
      buildTime: Date.now().toString(),
      buildDate: new Date().toISOString(),
      version: 'unknown'
    };
    
    return NextResponse.json(fallbackInfo, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
