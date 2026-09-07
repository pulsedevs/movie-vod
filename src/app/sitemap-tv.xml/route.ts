import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-tv.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular TV shows if no API key
    const popularTVShows = [
      { id: 1399, name: 'Game of Thrones' },
      { id: 1396, name: 'Breaking Bad' },
      { id: 4607, name: 'Lost' },
      { id: 1668, name: 'Friends' },
      { id: 2316, name: 'The Office' },
      { id: 1402, name: 'The Walking Dead' },
      { id: 456, name: 'The Simpsons' },
      { id: 60625, name: 'Rick and Morty' },
      { id: 85552, name: 'Euphoria' },
      { id: 94605, name: 'Arcane' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 1412, name: 'Arrow' },
      { id: 1416, name: 'Grey\'s Anatomy' },
      { id: 1403, name: 'Marvel\'s Agents of S.H.I.E.L.D.' },
      { id: 1408, name: 'House' }
    ]
    
    return generateTVSitemap(baseUrl, popularTVShows)
  }

  try {
    // Fetch multiple pages of popular TV shows from TMDB (with timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for multiple requests
    
    const allTVShows = []
    const maxPages = 50 // Fetch 50 pages = ~1000 TV shows
    
    // Fetch multiple pages in batches to avoid overwhelming the API
    for (let page = 1; page <= maxPages; page += 5) {
      const batchPromises = []
      
      for (let i = 0; i < 5 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=${currentPage}`,
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
              allTVShows.push(...data.results)
            }
          }
        }
        
        // Add small delay between batches to be respectful to TMDB API
        if (page + 5 <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
      } catch (batchError) {
        console.warn(`Batch error at page ${page}:`, batchError)
        break // Stop if we hit errors, use what we have
      }
    }
    
    clearTimeout(timeoutId)
    
    // Remove duplicates and limit to 1000 TV shows
    const uniqueTVShows = allTVShows
      .filter((show, index, self) => self.findIndex(s => s.id === show.id) === index)
      .slice(0, 1000)
    
    return generateTVSitemap(baseUrl, uniqueTVShows)
    
  } catch (error) {
    console.error('TV sitemap error:', error)
    
    // Fallback to expanded popular TV shows list
    const popularTVShows = [
      { id: 1399, name: 'Game of Thrones' },
      { id: 1396, name: 'Breaking Bad' },
      { id: 4607, name: 'Lost' },
      { id: 1668, name: 'Friends' },
      { id: 2316, name: 'The Office' },
      { id: 1402, name: 'The Walking Dead' },
      { id: 456, name: 'The Simpsons' },
      { id: 60625, name: 'Rick and Morty' },
      { id: 85552, name: 'Euphoria' },
      { id: 94605, name: 'Arcane' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 1412, name: 'Arrow' },
      { id: 1416, name: 'Grey\'s Anatomy' },
      { id: 1403, name: 'Marvel\'s Agents of S.H.I.E.L.D.' },
      { id: 1408, name: 'House' },
      { id: 60059, name: 'Better Call Saul' },
      { id: 1413, name: 'American Horror Story' },
      { id: 18165, name: 'The Big Bang Theory' },
      { id: 1418, name: 'The Flash' },
      { id: 1419, name: 'Castle' },
      { id: 1433, name: 'American Dad!' },
      { id: 1434, name: 'Family Guy' },
      { id: 1409, name: 'Supernatural' },
      { id: 46648, name: 'True Detective' },
      { id: 1407, name: 'Homeland' },
      { id: 1911, name: 'Narcos' },
      { id: 1412, name: 'Arrow' },
      { id: 62286, name: 'Fear the Walking Dead' },
      { id: 1404, name: 'The Blacklist' },
      { id: 60574, name: 'Peaky Blinders' },
      { id: 65334, name: 'The Crown' },
      { id: 63056, name: 'Narcos: Mexico' },
      { id: 71712, name: 'The Good Place' },
      { id: 1405, name: 'Gotham' },
      { id: 75006, name: 'The Umbrella Academy' },
      { id: 83097, name: 'The Queen\'s Gambit' },
      { id: 85271, name: 'WandaVision' },
      { id: 91557, name: 'Loki' },
      { id: 88396, name: 'The Falcon and the Winter Soldier' },
      { id: 1429, name: 'Attack on Titan' },
      { id: 85937, name: 'Demon Slayer: Kimetsu no Yaiba' },
      { id: 73586, name: 'Yellowstone' },
      { id: 65820, name: 'Van Helsing' },
      { id: 1414, name: 'Chicago Fire' },
      { id: 63174, name: 'Lucifer' },
      { id: 60735, name: 'The Flash' },
      { id: 1421, name: 'Modern Family' },
      { id: 67915, name: 'The Marvelous Mrs. Maisel' },
      { id: 69050, name: 'Riverdale' },
      { id: 1417, name: 'Blue Bloods' }
    ]
    
    return generateTVSitemap(baseUrl, popularTVShows)
  }
}

function generateTVSitemap(baseUrl: string, tvShows: any[]) {

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const uniqueTVShows = tvShows.filter(
    (show, index, self) => self.findIndex((candidate) => candidate.id === show.id) === index
  )

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${uniqueTVShows.map(show => `
  <url>
    <loc>${normalizedBaseUrl}/tv/${show.id}/${createSlug(show.name)}</loc>
    <lastmod>${formatSitemapLastMod(show.first_air_date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800', // Cache for 30 minutes
    },
  })
}
