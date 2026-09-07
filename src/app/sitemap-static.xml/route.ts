import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { PROVIDERS } from '@/config/providers'
// src/app/sitemap-static.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
  
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/browse/movies', priority: '0.9', changefreq: 'daily' },
    { url: '/browse/tv', priority: '0.9', changefreq: 'daily' },
    { url: '/browse/anime', priority: '0.9', changefreq: 'daily' },
    // Provider hubs: indexable, self-canonical, and already earning impressions
    // (netflix 1.4k, prime 726, max 245, disney 107) — but were in no sitemap at all.
    ...PROVIDERS.map((p) => ({
      url: `/browse/provider/${p.slug}`,
      priority: '0.8',
      changefreq: 'daily',
    })),
    // Trust pages. People search "is boredflix safe" / "what happened to boredflix", and these
    // are the only pages that answer as us rather than as a third party, so they must be indexable.
    { url: '/about', priority: '0.4', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'monthly' },
    { url: '/contact', priority: '0.3', changefreq: 'monthly' },
    // Exclude /search pages because that segment is noindex and can create crawl traps.
    // Keep static sitemap focused on stable, indexable browse pages.
  ]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${formatSitemapLastMod()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}
