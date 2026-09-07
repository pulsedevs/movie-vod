import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-tv-animation.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular animated TV shows
    const animatedShows = [
      { id: 456, name: 'The Simpsons' },
      { id: 60625, name: 'Rick and Morty' },
      { id: 1433, name: 'American Dad!' },
      { id: 1434, name: 'Family Guy' },
      { id: 1429, name: 'Attack on Titan' },
      { id: 85937, name: 'Demon Slayer: Kimetsu no Yaiba' },
      { id: 94605, name: 'Arcane' },
      { id: 37854, name: 'One Piece' },
      { id: 1429, name: 'Attack on Titan' },
      { id: 46261, name: 'One Punch Man' },
      { id: 67233, name: 'BoJack Horseman' },
      { id: 60572, name: 'Bob\'s Burgers' },
      { id: 1408, name: 'South Park' },
      { id: 4026, name: 'Futurama' },
      { id: 73586, name: 'Adventure Time' }
    ]
    
    return generateAnimatedTVSitemap(baseUrl, animatedShows)
  }

  try {
    // Fetch animated TV shows from TMDB (Genre ID 16 = Animation)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allShows = []
    const maxPages = 25 // Fetch 25 pages = ~500 animated shows
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=16&sort_by=popularity.desc`,
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
        console.warn(`Animated TV batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueShows = allShows
      .filter((show, index, self) => self.findIndex(s => s.id === show.id) === index)
      .slice(0, 500)
    
    return generateAnimatedTVSitemap(baseUrl, uniqueShows)
    
  } catch (error) {
    console.error('Animated TV sitemap error:', error)
    
    const animatedShows = [
      { id: 456, name: 'The Simpsons' },
      { id: 60625, name: 'Rick and Morty' },
      { id: 1433, name: 'American Dad!' },
      { id: 1434, name: 'Family Guy' },
      { id: 94605, name: 'Arcane' }
    ]
    
    return generateAnimatedTVSitemap(baseUrl, animatedShows)
  }
}

function generateAnimatedTVSitemap(baseUrl: string, shows: any[]) {
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
