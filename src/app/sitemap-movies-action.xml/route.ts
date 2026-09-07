import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-movies-action.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular action movies
    const actionMovies = [
      { id: 155, title: 'The Dark Knight' },
      { id: 299536, title: 'Avengers: Infinity War' },
      { id: 299534, title: 'Avengers: Endgame' },
      { id: 24428, title: 'The Avengers' },
      { id: 271110, title: 'Captain America: Civil War' },
      { id: 140607, title: 'Star Wars: The Force Awakens' },
      { id: 181808, title: 'Star Wars: The Last Jedi' },
      { id: 27205, title: 'Inception' },
      { id: 49026, title: 'The Dark Knight Rises' },
      { id: 361743, title: 'Top Gun: Maverick' },
      { id: 78, title: 'Blade Runner' },
      { id: 335983, title: 'Venom' },
      { id: 1726, title: 'Iron Man' },
      { id: 118340, title: 'Guardians of the Galaxy' },
      { id: 284053, title: 'Thor: Ragnarok' }
    ]
    
    return generateActionMovieSitemap(baseUrl, actionMovies)
  }

  try {
    // Fetch action movies from TMDB (Genre ID 28 = Action)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allMovies = []
    const maxPages = 20 // Fetch 20 pages = ~400 action movies
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=28&sort_by=popularity.desc`,
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
        console.warn(`Action movies batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueMovies = allMovies
      .filter((movie, index, self) => self.findIndex(m => m.id === movie.id) === index)
      .slice(0, 500)
    
    return generateActionMovieSitemap(baseUrl, uniqueMovies)
    
  } catch (error) {
    console.error('Action movies sitemap error:', error)
    
    const actionMovies = [
      { id: 155, title: 'The Dark Knight' },
      { id: 299536, title: 'Avengers: Infinity War' },
      { id: 299534, title: 'Avengers: Endgame' },
      { id: 24428, title: 'The Avengers' },
      { id: 271110, title: 'Captain America: Civil War' }
    ]
    
    return generateActionMovieSitemap(baseUrl, actionMovies)
  }
}

function generateActionMovieSitemap(baseUrl: string, movies: any[]) {
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
