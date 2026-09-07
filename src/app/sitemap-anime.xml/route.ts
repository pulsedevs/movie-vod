import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
import { NextResponse } from 'next/server'

type AnimeTvItem = { id: number; name: string; first_air_date?: string }
type AnimeMovieItem = { id: number; title: string; release_date?: string }

function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
  return raw.replace(/\/+$/, '')
}


async function fetchAnimeTv(apiKey: string, signal: AbortSignal): Promise<AnimeTvItem[]> {
  const allResults: AnimeTvItem[] = []
  const maxPages = 20

  for (let page = 1; page <= maxPages; page += 4) {
    const batch: Promise<Response>[] = []
    for (let i = 0; i < 4 && page + i <= maxPages; i++) {
      const currentPage = page + i
      batch.push(
        fetch(
          `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc`,
          { signal }
        )
      )
    }

    const responses = await Promise.all(batch)
    for (const response of responses) {
      if (!response.ok) continue
      const data = await response.json()
      if (Array.isArray(data.results)) {
        allResults.push(...data.results)
      }
    }
  }

  return allResults
    .filter((item, index, self) => self.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 700)
}

async function fetchAnimeMovies(apiKey: string, signal: AbortSignal): Promise<AnimeMovieItem[]> {
  const allResults: AnimeMovieItem[] = []
  const maxPages = 15

  for (let page = 1; page <= maxPages; page += 3) {
    const batch: Promise<Response>[] = []
    for (let i = 0; i < 3 && page + i <= maxPages; i++) {
      const currentPage = page + i
      batch.push(
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
          { signal }
        )
      )
    }

    const responses = await Promise.all(batch)
    for (const response of responses) {
      if (!response.ok) continue
      const data = await response.json()
      if (Array.isArray(data.results)) {
        allResults.push(...data.results)
      }
    }
  }

  return allResults
    .filter((item, index, self) => self.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 500)
}

function buildXml(baseUrl: string, animeTv: AnimeTvItem[], animeMovies: AnimeMovieItem[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${animeTv
  .map(
    (show) => `  <url>
    <loc>${baseUrl}/tv/${show.id}/${createSlug(show.name)}</loc>
    <lastmod>${formatSitemapLastMod(show.first_air_date)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
${animeMovies
  .map(
    (movie) => `  <url>
    <loc>${baseUrl}/movie/${movie.id}/${createSlug(movie.title)}</loc>
    <lastmod>${formatSitemapLastMod(movie.release_date)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
  </url>`
  )
  .join('\n')}
</urlset>`
}

export async function GET() {
  const baseUrl = getBaseUrl()
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    const fallbackTv: AnimeTvItem[] = [
      { id: 37854, name: 'One Piece' },
      { id: 1429, name: 'Attack on Titan' },
      { id: 85937, name: 'Demon Slayer: Kimetsu no Yaiba' },
      { id: 31911, name: 'Fullmetal Alchemist: Brotherhood' },
      { id: 60863, name: 'Haikyu!!' },
    ]
    const fallbackMovies: AnimeMovieItem[] = [
      { id: 129, title: 'Spirited Away' },
      { id: 372058, title: 'Your Name.' },
      { id: 568160, title: 'Weathering with You' },
      { id: 13398, title: 'Tokyo Godfathers' },
      { id: 149, title: 'Akira' },
    ]

    return new NextResponse(buildXml(baseUrl, fallbackTv, fallbackMovies), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    const [animeTv, animeMovies] = await Promise.all([
      fetchAnimeTv(apiKey, controller.signal),
      fetchAnimeMovies(apiKey, controller.signal),
    ])

    clearTimeout(timeoutId)

    return new NextResponse(buildXml(baseUrl, animeTv, animeMovies), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Anime sitemap error:', error)
    return new NextResponse(buildXml(baseUrl, [], []), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1200, s-maxage=1200',
      },
    })
  }
}
