// next.config.ts
/** @type {import('next').NextConfig} */

// Conditionally import bundle analyzer only when needed
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ 
      enabled: true,
      openAnalyzer: false // Don't auto-open browser
    }) 
  : (config: any) => config;

const nextConfig = {
  productionBrowserSourceMaps: false,
  // Fix double slash URLs causing Soft 404 errors in Google Search Console
  redirects: async () => [
    // Movie redirects: //movie/123 -> /movie/123/movie-123
    {
      source: '//movie/:movieId(\\d+)',
      destination: '/movie/:movieId/movie-:movieId',
      permanent: true
    },
    // TV show redirects: //tv/123 -> /tv/123/show-123  
    {
      source: '//tv/:tvId(\\d+)',
      destination: '/tv/:tvId/show-:tvId',
      permanent: true
    },
    // General double slash fix for any other paths
    {
      source: '//(.+)',
      destination: '/$1',
      permanent: true
    }
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**', // Allows images from TMDb
      },
      // Add other allowed image domains if needed
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours cache for images
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920, 2048], // Optimize for common device widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Add smaller sizes for icons and thumbnails
  },  compress: true, // Enable gzip compression  
  
  // Optimize bundle sizes
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'lucide-react', 'framer-motion'],
  },
  // Move turbo config to turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Enable server-side rendering optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },  // Tree shaking and code splitting optimizations
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Make Sentry and pino optional - use stubs if packages don't exist
    const path = require('path');
    const sentryExists = (() => {
      try {
        require.resolve('@sentry/nextjs');
        return true;
      } catch {
        return false;
      }
    })();
    
    const pinoExists = (() => {
      try {
        require.resolve('pino');
        return true;
      } catch {
        return false;
      }
    })();
    
    if (!sentryExists || !pinoExists) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ...(!sentryExists && {
          '@sentry/nextjs': path.resolve(__dirname, 'src/utils/sentry-stub.ts'),
        }),
        ...(!pinoExists && {
          'pino': path.resolve(__dirname, 'src/utils/pino-stub.ts'),
        }),
      };
    }
    
    // Completely ignore Flash/SWF files from VAST plugins
    config.module.rules.push({
      test: /\.(swf|fla)$/,
      use: 'ignore-loader'
    });

    // Add ignore-loader for problematic VAST plugin files
    config.module.rules.push({
      test: /vpaid-flash-client/,
      use: 'ignore-loader'
    });

    // Ignore VAST plugin Flash dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Optimize for smaller bundle sizes
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
    
    // Let Next.js handle splitChunks defaults (usually better for route-level unused JS).
    if (!isServer) {
      // Optimize module concatenation
      config.optimization.concatenateModules = true;
      
      // Enable modern module splitting
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }
    
    return config;
  },
  // Move outputFileTracingIncludes to top level
  outputFileTracingIncludes: {
    '/*': ['./public/**/*'],
  },
  // Serve BLOCKING metadata (title/description in <head>) on EVERY request.
  // Next 15.2+ streams metadata into the <body> for dynamic pages; because
  // Cloudflare caches one HTML copy per URL (no user-agent vary), bots and
  // Lighthouse were served the streamed user-variant from cache and reported
  // "Document does not have a meta description" — even though a bot-only
  // regex worked at the origin. Matching ALL user agents makes every cached
  // copy audit-proof. Cost is negligible: metadata data is ISR-cached and the
  // HTML itself is edge-cached, so the blocking wait is rarely paid.
  htmlLimitedBots: /.*/,
  // Enable HTTP/2 server push for critical assets  poweredByHeader: false, // Remove X-Powered-By header for security

  reactStrictMode: true, // Enable React strict mode for better development  // Optimized cache control headers for Cloudflare compatibility
  async headers() {
    return [
      {
        // Homepage (both main and preview) — edge-cached but revalidating so
        // content/meta updates propagate (no `immutable`).
        source: '/(home-preview)?',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // build-info must always be fresh — it checks the current deploy version
        source: '/api/build-info',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        // All other API routes — TMDB data, genres, trending, search — cache 1 week
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Next.js hashed chunks are immutable - cache aggressively.
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Other hashed Next.js static assets (CSS, fonts, runtime manifests).
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Browse/search pages — revalidating edge cache (no `immutable`).
        source: '/(browse|search|home-preview/browse)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Movie/TV detail pages — revalidating edge cache (no `immutable`) so
        // metadata/SEO fixes propagate without waiting a year.
        source: '/(movie|tv|movie-preview|tv-preview)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // home-preview movie/TV detail pages — revalidating edge cache.
        source: '/home-preview/(movie|tv)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Static legal/info pages — rarely change; revalidating edge cache so
        // edits still propagate (no `immutable`).
        source: '/(privacy|terms|about|contact)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Everything else (HTML) — revalidating edge cache (no `immutable`).
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Public images are mostly static; increase cache lifetime for repeat visits.
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Apply bundle analyzer wrapper if in analyze mode
export default withBundleAnalyzer(nextConfig);