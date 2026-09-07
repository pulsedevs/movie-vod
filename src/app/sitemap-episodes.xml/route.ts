import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
import { isEpisodeWorthIndexing } from '@/lib/detail/loadEpisodeDetail'
// src/app/sitemap-episodes.xml/route.ts
import { NextResponse } from 'next/server'

/**
 * Episode sitemap — deliberately narrow.
 *
 * Every episode of every show would be ~24k URLs, which would bury the crawler in pages nobody
 * searches for. Episode demand is concentrated in shows that are ON THE AIR right now ("<show>
 * season 3 episode 5 online" spikes the week an episode drops), so this lists only currently
 * airing shows and only their current season.
 *
 * Cost control: TMDB's show detail carries `last_episode_to_air`, so we learn the current season
 * AND how many episodes have aired from ONE request per show — no per-season fetch needed.
 */

const SHOW_PAGES = 3 // 20 shows per page -> ~60 airing shows
const MAX_EPISODES_PER_SHOW = 30 // guards against daily soaps with 200+ episodes a season
const BATCH_SIZE = 8

interface EpisodeUrl {
  loc: string
  lastmod: string
}

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) return buildSitemap(baseUrl, [])

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    // 1. Shows currently on the air.
    const listPages = await Promise.all(
      Array.from({ length: SHOW_PAGES }, (_, i) =>
        fetch(
          `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=en-US&page=${i + 1}`,
          { signal: controller.signal, next: { revalidate: 21600 } }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    )

    const showIds: number[] = []
    for (const page of listPages) {
      for (const show of page?.results ?? []) {
        if (typeof show?.id === 'number' && !showIds.includes(show.id)) showIds.push(show.id)
      }
    }

    // 2. One detail request per show -> current season + how many episodes have aired.
    const urls: EpisodeUrl[] = []

    for (let i = 0; i < showIds.length; i += BATCH_SIZE) {
      const batch = showIds.slice(i, i + BATCH_SIZE)
      const details = await Promise.all(
        batch.map((id) =>
          fetch(
            `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US`,
            { signal: controller.signal, next: { revalidate: 21600 } }
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      )

      for (const show of details) {
        const last = show?.last_episode_to_air
        if (!show?.id || !show?.name || !last) continue
        // Drops daily strips (talk/news/low-demand reality) that would otherwise be ~1k thin URLs.
        if (!isEpisodeWorthIndexing(show)) continue

        const seasonNumber = Number(last.season_number)
        const airedCount = Number(last.episode_number)

        const slug = createSlug(show.name)
        if (!slug) continue // non-Latin title with no usable slug

        const lastmod = formatSitemapLastMod(last.air_date || undefined)
        const total = Math.min(airedCount, MAX_EPISODES_PER_SHOW)

        for (let ep = 1; ep <= total; ep++) {
          urls.push({
            loc: `${baseUrl}/tv/${show.id}/${slug}/season/${seasonNumber}/episode/${ep}`,
            lastmod,
          })
        }
      }
    }

    return buildSitemap(baseUrl, urls)
  } catch (error) {
    console.error('sitemap-episodes: generation failed', error)
    return buildSitemap(baseUrl, [])
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildSitemap(baseUrl: string, urls: EpisodeUrl[]) {
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      // Episodes drop weekly, so refresh far more often than the catalogue sitemaps.
      'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400',
    },
  })
}
