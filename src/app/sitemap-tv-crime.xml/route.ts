import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-tv-crime.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular crime/thriller TV shows
    const crimeShows = [
      { id: 1396, name: 'Breaking Bad' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 46648, name: 'True Detective' },
      { id: 1407, name: 'Homeland' },
      { id: 1404, name: 'The Blacklist' },
      { id: 60574, name: 'Peaky Blinders' },
      { id: 1911, name: 'Narcos' },
      { id: 63056, name: 'Narcos: Mexico' },
      { id: 1408, name: 'House' },
      { id: 1409, name: 'Supernatural' },
      { id: 1414, name: 'Chicago Fire' },
      { id: 1417, name: 'Blue Bloods' },
      { id: 4614, name: 'NCIS' },
      { id: 4629, name: 'The West Wing' },
      { id: 63174, name: 'Lucifer' }
    ]
    
    return generateCrimeTVSitemap(baseUrl, crimeShows)
  }

  try {
    // Fetch crime/thriller TV shows from TMDB (Genre ID 80 = Crime)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allShows = []
    const maxPages = 25 // Fetch 25 pages = ~500 crime shows
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=80&sort_by=popularity.desc`,
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
        console.warn(`Crime TV batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueShows = allShows
      .filter((show, index, self) => self.findIndex(s => s.id === show.id) === index)
      .slice(0, 500)
    
    return generateCrimeTVSitemap(baseUrl, uniqueShows)
    
  } catch (error) {
    console.error('Crime TV sitemap error:', error)
    
    const crimeShows = [
      { id: 1396, name: 'Breaking Bad' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 46648, name: 'True Detective' },
      { id: 1407, name: 'Homeland' },
      { id: 1404, name: 'The Blacklist' }
    ]
    
    return generateCrimeTVSitemap(baseUrl, crimeShows)
  }
}

function generateCrimeTVSitemap(baseUrl: string, shows: any[]) {
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
