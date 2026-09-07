// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppLayoutShell from '@/components/layout/AppLayoutShell';
import { AuthProvider } from '@/contexts/AuthContext';
import ServerLibrarySync from '@/components/auth/ServerLibrarySync';
import { AdPreferencesProvider } from '@/contexts/AdPreferencesContext';
import BuildUpdateChecker from '@/components/common/BuildUpdateChecker';
import CacheDebugPanel from '@/components/common/CacheDebugPanel';
import ChunkErrorBoundary from '@/components/common/ChunkErrorBoundary';
import PopUnderAd from '@/components/ads/PopUnderAd';
import Script from 'next/script';
import NextTopLoader from 'nextjs-toploader';
import { getCanonicalOrigin } from '@/utils/siteUrl';

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevent font blocking
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  variable: '--font-inter'
});

const siteUrl = getCanonicalOrigin();

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Watch Free Movies & TV Shows Online | BoredFlix',
  description: 'Watch free movies and TV shows online on BoredFlix. Stream thousands of HD titles — movies, TV series, and anime — with no sign up and no subscription required.',
  keywords: ['free movies', 'free tv shows', 'watch movies online free', 'stream online', 'hd streaming', 'no sign up movies', 'boredflix', 'watch tv shows online', 'free streaming', 'watch online free'],
  openGraph: {
    title: 'Watch Free Movies & TV Shows Online | BoredFlix',
    description: 'Stream thousands of free movies and TV shows in HD. No sign up, no subscription, no credit card.',
    // No `url` here: it is inherited by every page that doesn't set its own, so og:url on
    // /movie/550 pointed at the homepage. Detail pages already set their own openGraph.url.
    siteName: 'BoredFlix',
    images: [
      {
        url: `${siteUrl}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: 'BoredFlix - Watch Free Movies and TV Shows Online',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watch Free Movies & TV Shows Online | BoredFlix',
    description: 'Stream free movies and TV shows in HD. No registration needed.',
    images: [`${siteUrl}/images/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  alternates: {
    // Relative → Next resolves it per-segment against metadataBase, so EVERY route gets a
    // correct SELF-canonical. An absolute `siteUrl` here was inherited by every page that
    // doesn't set its own, making them all declare the homepage as canonical (which Google
    // discards → "Duplicate without user-selected canonical"). Query strings drop out
    // automatically because Next resolves against pathname.
    canonical: './',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Build time for cache invalidation */}
        <meta name="build-time" content={process.env.NEXT_PUBLIC_BUILD_TIME || Date.now().toString()} />
        {/* TMDB images are loaded directly by some client components (posters, fan stacks) */}
        <link rel="dns-prefetch" href="//image.tmdb.org" />
        {/* Preload critical Inter font subset to break CSS→font discovery chain */}
        <link
          rel="preload"
          href="/_next/static/media/7b0b24f36b1a6d0b-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-white overflow-x-hidden`}>
        <NextTopLoader
          color="#ef4444"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ef4444, 0 0 5px #ef4444"
        />
        <ChunkErrorBoundary>
          <AuthProvider>
            <ServerLibrarySync />
            <AdPreferencesProvider>
              <AppLayoutShell>{children}</AppLayoutShell>
              <PopUnderAd />
              <BuildUpdateChecker />
              <CacheDebugPanel />
            </AdPreferencesProvider>
          </AuthProvider>
        </ChunkErrorBoundary>
        
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
          <Script
            id="umami-analytics"
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://analytics.boredflix.tv/script.js'}
            strategy="lazyOnload"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        ) : null}
          {/* Service worker registration */}
        <Script
          src="/register-sw.js"
          strategy="afterInteractive"
          id="sw-register"
        />
        {/* Lightweight chunk recovery and build tracking */}
        <Script
          id="chunk-error-recovery"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (typeof window === 'undefined') return;
                const buildTime = document.querySelector('meta[name="build-time"]')?.getAttribute('content');
                if (buildTime) {
                  try {
                    localStorage.setItem('lastBuildTime', buildTime);
                  } catch (_) {}
                }
                const reloadOnChunkError = () => {
                  window.location.reload();
                };
                window.addEventListener('error', function (e) {
                  const message = e.message || '';
                  if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
                    reloadOnChunkError();
                  }
                });
                window.addEventListener('unhandledrejection', function (e) {
                  const reason = String(e.reason || '');
                  if (reason.includes('ChunkLoadError') || reason.includes('Loading chunk')) {
                    reloadOnChunkError();
                  }
                });
              })();
            `
          }}
        />
        
        {/* Link prefetching for faster navigation */}
        <Script
          src="/prefetch-links.js"
          strategy="afterInteractive"
          id="prefetch-links"
        />
      </body>
    </html>
  );
}