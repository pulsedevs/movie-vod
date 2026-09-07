import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-movies-scifi.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular sci-fi movies
    const scifiMovies = [
      { id: 11, title: 'Star Wars' },
      { id: 1891, title: 'The Empire Strikes Back' },
      { id: 1892, title: 'Return of the Jedi' },
      { id: 140607, title: 'Star Wars: The Force Awakens' },
      { id: 181808, title: 'Star Wars: The Last Jedi' },
      { id: 27205, title: 'Inception' },
      { id: 78, title: 'Blade Runner' },
      { id: 329, title: 'Jurassic Park' },
      { id: 603, title: 'The Matrix' },
      { id: 604, title: 'The Matrix Reloaded' },
      { id: 605, title: 'The Matrix Revolutions' },
      { id: 348, title: 'Alien' },
      { id: 679, title: 'Aliens' },
      { id: 62, title: 'E.T. the Extra-Terrestrial' },
      { id: 89, title: 'Indiana Jones and the Raiders of the Lost Ark' }
    ]
    
    return generateSciFiMovieSitemap(baseUrl, scifiMovies)
  }

  try {
    // Fetch sci-fi movies from TMDB (Genre ID 878 = Science Fiction)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allMovies = []
    const maxPages = 25 // Fetch 25 pages = ~500 sci-fi movies
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=878&sort_by=popularity.desc`,
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
        console.warn(`Sci-fi movies batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueMovies = allMovies
      .filter((movie, index, self) => self.findIndex(m => m.id === movie.id) === index)
      .slice(0, 500)
    
    return generateSciFiMovieSitemap(baseUrl, uniqueMovies)
    
  } catch (error) {
    console.error('Sci-fi movies sitemap error:', error)
    
    const scifiMovies = [
      { id: 11, title: 'Star Wars' },
      { id: 1891, title: 'The Empire Strikes Back' },
      { id: 1892, title: 'Return of the Jedi' },
      { id: 27205, title: 'Inception' },
      { id: 78, title: 'Blade Runner' }
    ]
    
    return generateSciFiMovieSitemap(baseUrl, scifiMovies)
  }
}

function generateSciFiMovieSitemap(baseUrl: string, movies: any[]) {
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
