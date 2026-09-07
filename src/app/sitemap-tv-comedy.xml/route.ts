import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-tv-comedy.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular comedy TV shows
    const comedyShows = [
      { id: 1668, name: 'Friends' },
      { id: 2316, name: 'The Office' },
      { id: 18165, name: 'The Big Bang Theory' },
      { id: 1433, name: 'American Dad!' },
      { id: 1434, name: 'Family Guy' },
      { id: 456, name: 'The Simpsons' },
      { id: 60625, name: 'Rick and Morty' },
      { id: 71712, name: 'The Good Place' },
      { id: 1421, name: 'Modern Family' },
      { id: 67915, name: 'The Marvelous Mrs. Maisel' },
      { id: 4026, name: 'How I Met Your Mother' },
      { id: 1413, name: 'American Horror Story' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 4614, name: 'NCIS' },
      { id: 4629, name: 'The West Wing' }
    ]
    
    return generateComedyTVSitemap(baseUrl, comedyShows)
  }

  try {
    // Fetch comedy TV shows from TMDB (Genre ID 35 = Comedy)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allShows = []
    const maxPages = 25 // Fetch 25 pages = ~500 comedy shows
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=35&sort_by=popularity.desc`,
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
        console.warn(`Comedy TV batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueShows = allShows
      .filter((show, index, self) => self.findIndex(s => s.id === show.id) === index)
      .slice(0, 500)
    
    return generateComedyTVSitemap(baseUrl, uniqueShows)
    
  } catch (error) {
    console.error('Comedy TV sitemap error:', error)
    
    const comedyShows = [
      { id: 1668, name: 'Friends' },
      { id: 2316, name: 'The Office' },
      { id: 18165, name: 'The Big Bang Theory' },
      { id: 60625, name: 'Rick and Morty' },
      { id: 71712, name: 'The Good Place' }
    ]
    
    return generateComedyTVSitemap(baseUrl, comedyShows)
  }
}

function generateComedyTVSitemap(baseUrl: string, shows: any[]) {
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
