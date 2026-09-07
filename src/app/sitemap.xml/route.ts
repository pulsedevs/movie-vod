import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { NextResponse } from 'next/server'

function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
  return raw.replace(/\/+$/, '')
}

const SITEMAPS = [
  '/sitemap-static.xml',
  '/sitemap-movies.xml',
  '/sitemap-tv.xml',
  '/sitemap-movies-action.xml',
  '/sitemap-movies-horror.xml',
  '/sitemap-movies-comedy.xml',
  '/sitemap-movies-scifi.xml',
  '/sitemap-movies-thriller.xml',
  '/sitemap-tv-drama.xml',
  '/sitemap-tv-comedy.xml',
  '/sitemap-tv-scifi.xml',
  '/sitemap-tv-crime.xml',
  '/sitemap-tv-action.xml',
  '/sitemap-tv-animation.xml',
  '/sitemap-anime.xml',
  '/sitemap-new-releases.xml',
  '/sitemap-episodes.xml',
]

export async function GET() {
  const baseUrl = getBaseUrl()
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAPS.map(
  (path) => `  <sitemap>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${formatSitemapLastMod()}</lastmod>
  </sitemap>`
).join('\n')}
</sitemapindex>`

  return new NextResponse(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  })
}
