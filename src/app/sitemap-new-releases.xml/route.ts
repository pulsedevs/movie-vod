import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-new-releases.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to recent popular releases
    const newReleases = [
      { id: 545611, title: 'Everything Everywhere All at Once', media_type: 'movie' },
      { id: 926393, title: 'The Whale', media_type: 'movie' },
      { id: 361743, title: 'Top Gun: Maverick', media_type: 'movie' },
      { id: 634649, title: 'Spider-Man: No Way Home', media_type: 'movie' },
      { id: 85552, name: 'Euphoria', media_type: 'tv' },
      { id: 94605, name: 'Arcane', media_type: 'tv' },
      { id: 83097, name: 'The Queen\'s Gambit', media_type: 'tv' },
      { id: 85271, name: 'WandaVision', media_type: 'tv' },
      { id: 91557, name: 'Loki', media_type: 'tv' },
      { id: 88396, name: 'The Falcon and the Winter Soldier', media_type: 'tv' }
    ]
    
    return generateNewReleasesSitemap(baseUrl, newReleases)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allReleases = []
    
    // Get current date and date from 6 months ago
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, currentDate.getDate())
    const dateString = sixMonthsAgo.toISOString().split('T')[0]
    
    // Fetch new movie releases
    const moviePromises = []
    for (let page = 1; page <= 5; page++) {
      moviePromises.push(
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=${page}&primary_release_date.gte=${dateString}&sort_by=popularity.desc`,
          { signal: controller.signal }
        )
      )
    }
    
    // Fetch new TV releases
    const tvPromises = []
    for (let page = 1; page <= 5; page++) {
      tvPromises.push(
        fetch(
          `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${page}&first_air_date.gte=${dateString}&sort_by=popularity.desc`,
          { signal: controller.signal }
        )
      )
    }
    
    try {
      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises)
      ])
      
      // Process movie responses
      for (const response of movieResponses) {
        if (response.ok) {
          const data = await response.json()
          if (data.results) {
            const moviesWithType = data.results.map((movie: any) => ({ ...movie, media_type: 'movie' }))
            allReleases.push(...moviesWithType)
          }
        }
      }
      
      // Process TV responses
      for (const response of tvResponses) {
        if (response.ok) {
          const data = await response.json()
          if (data.results) {
            const showsWithType = data.results.map((show: any) => ({ ...show, media_type: 'tv' }))
            allReleases.push(...showsWithType)
          }
        }
      }
      
    } catch (batchError) {
      console.warn('New releases batch error:', batchError)
    }
    
    clearTimeout(timeoutId)
    
    // Remove duplicates, sort by popularity, and limit to 200 items
    const uniqueReleases = allReleases
      .filter((item, index, self) => self.findIndex(i => i.id === item.id && i.media_type === item.media_type) === index)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 200)
    
    return generateNewReleasesSitemap(baseUrl, uniqueReleases)
    
  } catch (error) {
    console.error('New releases sitemap error:', error)
    
    const newReleases = [
      { id: 545611, title: 'Everything Everywhere All at Once', media_type: 'movie' },
      { id: 926393, title: 'The Whale', media_type: 'movie' },
      { id: 361743, title: 'Top Gun: Maverick', media_type: 'movie' },
      { id: 85552, name: 'Euphoria', media_type: 'tv' },
      { id: 94605, name: 'Arcane', media_type: 'tv' }
    ]
    
    return generateNewReleasesSitemap(baseUrl, newReleases)
  }
}

function generateNewReleasesSitemap(baseUrl: string, releases: any[]) {

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${releases.map(item => {
    const isMovie = item.media_type === 'movie'
    const title = isMovie ? item.title : item.name
    const path = isMovie ? 'movie' : 'tv'
    const date = isMovie ? item.release_date : item.first_air_date

    return `
  <url>
    <loc>${baseUrl}/${path}/${item.id}/${createSlug(title)}</loc>
    <lastmod>${formatSitemapLastMod(date)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  }).join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800', // Cache for 30 minutes (updates more frequently)
    },
  })
}
