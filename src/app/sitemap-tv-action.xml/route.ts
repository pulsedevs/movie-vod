import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-tv-action.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular action/adventure TV shows
    const actionShows = [
      { id: 1412, name: 'Arrow' },
      { id: 1418, name: 'The Flash' },
      { id: 1403, name: 'Marvel\'s Agents of S.H.I.E.L.D.' },
      { id: 85271, name: 'WandaVision' },
      { id: 91557, name: 'Loki' },
      { id: 88396, name: 'The Falcon and the Winter Soldier' },
      { id: 1405, name: 'Gotham' },
      { id: 75006, name: 'The Umbrella Academy' },
      { id: 1402, name: 'The Walking Dead' },
      { id: 62286, name: 'Fear the Walking Dead' },
      { id: 65820, name: 'Van Helsing' },
      { id: 1419, name: 'Castle' },
      { id: 103768, name: 'The Expanse' },
      { id: 73586, name: 'Yellowstone' },
      { id: 1429, name: 'Attack on Titan' }
    ]
    
    return generateActionTVSitemap(baseUrl, actionShows)
  }

  try {
    // Fetch action/adventure TV shows from TMDB (Genre ID 10759 = Action & Adventure)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allShows = []
    const maxPages = 25 // Fetch 25 pages = ~500 action shows
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=10759&sort_by=popularity.desc`,
            { signal: controller.signal }
          )
        )
      }
      
      try {
        const responses = await Promise.all(batchPromises)
        
        for (const response of responses) {
          if (response.ok) {
            const data = await response.json()
            if (data.results) {
              allShows.push(...data.results)
            }
          }
        }
        
        if (page + 3 <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (batchError) {
        console.warn(`Action TV batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueShows = allShows
      .filter((show, index, self) => self.findIndex(s => s.id === show.id) === index)
      .slice(0, 500)
    
    return generateActionTVSitemap(baseUrl, uniqueShows)
    
  } catch (error) {
    console.error('Action TV sitemap error:', error)
    
    const actionShows = [
      { id: 1412, name: 'Arrow' },
      { id: 1418, name: 'The Flash' },
      { id: 1403, name: 'Marvel\'s Agents of S.H.I.E.L.D.' },
      { id: 85271, name: 'WandaVision' },
      { id: 91557, name: 'Loki' }
    ]
    
    return generateActionTVSitemap(baseUrl, actionShows)
  }
}

function generateActionTVSitemap(baseUrl: string, shows: any[]) {
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${shows.map(show => `
  <url>
    <loc>${baseUrl}/tv/${show.id}/${createSlug(show.name)}</loc>
    <lastmod>${formatSitemapLastMod()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}
