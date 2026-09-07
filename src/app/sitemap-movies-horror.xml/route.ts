import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-movies-horror.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular horror movies
    const horrorMovies = [
      { id: 346, title: 'Seven' },
      { id: 539, title: 'Psycho' },
      { id: 694, title: 'The Shining' },
      { id: 1891, title: 'The Silence of the Lambs' },
      { id: 4522, title: 'Jaws' },
      { id: 348, title: 'Alien' },
      { id: 679, title: 'Aliens' },
      { id: 11, title: 'The Exorcist' },
      { id: 482606, title: 'The Conjuring' },
      { id: 439079, title: 'The Nun' },
      { id: 419430, title: 'Get Out' },
      { id: 447332, title: 'A Quiet Place' },
      { id: 530385, title: 'Midsommar' },
      { id: 526896, title: 'Midsommar' },
      { id: 438799, title: 'Overlord' }
    ]
    
    return generateHorrorMovieSitemap(baseUrl, horrorMovies)
  }

  try {
    // Fetch horror movies from TMDB (Genre ID 27 = Horror)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allMovies = []
    const maxPages = 20 // Fetch 20 pages = ~400 horror movies
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=27&sort_by=popularity.desc`,
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
              allMovies.push(...data.results)
            }
          }
        }
        
        if (page + 3 <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (batchError) {
        console.warn(`Horror movies batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueMovies = allMovies
      .filter((movie, index, self) => self.findIndex(m => m.id === movie.id) === index)
      .slice(0, 500)
    
    return generateHorrorMovieSitemap(baseUrl, uniqueMovies)
    
  } catch (error) {
    console.error('Horror movies sitemap error:', error)
    
    const horrorMovies = [
      { id: 346, title: 'Seven' },
      { id: 539, title: 'Psycho' },
      { id: 694, title: 'The Shining' },
      { id: 1891, title: 'The Silence of the Lambs' },
      { id: 4522, title: 'Jaws' }
    ]
    
    return generateHorrorMovieSitemap(baseUrl, horrorMovies)
  }
}

function generateHorrorMovieSitemap(baseUrl: string, movies: any[]) {
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${movies.map(movie => `
  <url>
    <loc>${baseUrl}/movie/${movie.id}/${createSlug(movie.title)}</loc>
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
