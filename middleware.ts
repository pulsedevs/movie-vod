import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCanonicalHost, getLegacyRedirectHosts } from '@/utils/siteUrl';

export function middleware(request: NextRequest) {
  // Behind a CDN/proxy (Cloudflare) the visitor's hostname arrives in x-forwarded-host; reading only
  // `host` made this check silently miss, so www.boredflix.tv served 200 and Google indexed it as a
  // duplicate ("Duplicate without user-selected canonical").
  const rawHost =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  const host = rawHost.split(',')[0].trim().split(':')[0].toLowerCase();
  const canonicalHost = getCanonicalHost().toLowerCase();

  // One canonical host: fixes "Duplicate without user-selected canonical" (.com vs .tv, apex vs www).
  // `www.<canonical>` is always treated as legacy so it can never fall out of the configured list.
  const shouldRedirectHost =
    host !== '' &&
    host !== canonicalHost &&
    (getLegacyRedirectHosts().has(host) || host === `www.${canonicalHost}`);

  if (shouldRedirectHost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = canonicalHost;
    // Assigning a portless .host does NOT clear an existing port, so a request that reaches the
    // origin on its internal port would redirect to boredflix.tv:<port>.
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  
  // Enhanced security headers with comprehensive CSP
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    // Comprehensive Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app *.googleapis.com https://cloud.umami.is https://*.umami.is https://analytics.boredflix.tv",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: *.tmdb.org *.amazonaws.com *.googleusercontent.com *.supabase.co",
      "media-src 'self' blob: data: *.vidsrc.co *.vidsrc.me *.vidsrc.to *.2embed.cc *.embedplex.com *.smashystream.com *.vidbinge.com *.showboxmovies.net *.fastmovies.to *.vodflix.tv *.embedsito.net *.multiembed.mov https://cinetaro.tv https://*.cinetaro.tv",
      "connect-src 'self' *.supabase.co *.googleapis.com *.youtube.com *.tmdb.org wss: ws: https://cinetaro.tv https://*.cinetaro.tv https://cloud.umami.is https://*.umami.is https://analytics.boredflix.tv",
      "frame-src 'self' *.youtube.com *.vidsrc.co *.vidsrc.me *.vidsrc.to *.2embed.cc *.embedplex.com *.smashystream.com *.vidbinge.com *.showboxmovies.net *.fastmovies.to *.vodflix.tv *.embedsito.net *.multiembed.mov https://cinetaro.tv https://*.cinetaro.tv",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"    ].join('; '),

    // Rate limiting headers
    'X-RateLimit-Limit': '1000',
    'X-RateLimit-Window': '3600',
  };

  // Apply headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });  // Add device detection for optimization
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  response.headers.set('X-Device-Type', isMobile ? 'mobile' : 'desktop');
  
  // Balanced cache control headers - only for specific routes that need freshness
  if (pathname.startsWith('/api/')) {
    // API routes should not be cached
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  // If the path is exactly /watchlist
  if (request.nextUrl.pathname === '/watchlist') {
    return NextResponse.redirect(new URL('/library', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/watchlist',
  ],
};
