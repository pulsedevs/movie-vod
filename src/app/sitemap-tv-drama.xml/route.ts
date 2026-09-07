import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-tv-drama.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular drama TV shows
    const dramaShows = [
      { id: 1399, name: 'Game of Thrones' },
      { id: 1396, name: 'Breaking Bad' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 1408, name: 'House' },
      { id: 1416, name: 'Grey\'s Anatomy' },
      { id: 46648, name: 'True Detective' },
      { id: 1407, name: 'Homeland' },
      { id: 60574, name: 'Peaky Blinders' },
      { id: 65334, name: 'The Crown' },
      { id: 83097, name: 'The Queen\'s Gambit' },
      { id: 73586, name: 'Yellowstone' },
      { id: 67915, name: 'The Marvelous Mrs. Maisel' },
      { id: 69050, name: 'Riverdale' },
      { id: 1417, name: 'Blue Bloods' },
      { id: 85552, name: 'Euphoria' }
    ]
    
    return generateDramaTVSitemap(baseUrl, dramaShows)
  }

  try {
    // Fetch drama TV shows from TMDB (Genre ID 18 = Drama)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allShows = []
    const maxPages = 20 // Fetch 20 pages = ~400 drama shows
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=18&sort_by=popularity.desc`,
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
        console.warn(`Drama TV batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueShows = allShows
      .filter((show, index, self) => self.findIndex(s => s.id === show.id) === index)
      .slice(0, 500)
    
    return generateDramaTVSitemap(baseUrl, uniqueShows)
    
  } catch (error) {
    console.error('Drama TV sitemap error:', error)
    
    const dramaShows = [
      { id: 1399, name: 'Game of Thrones' },
      { id: 1396, name: 'Breaking Bad' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 1408, name: 'House' },
      { id: 1416, name: 'Grey\'s Anatomy' }
    ]
    
    return generateDramaTVSitemap(baseUrl, dramaShows)
  }
}

function generateDramaTVSitemap(baseUrl: string, shows: any[]) {
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
