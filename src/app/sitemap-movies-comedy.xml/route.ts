import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-movies-comedy.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular comedy movies
    const comedyMovies = [
      { id: 13, title: 'Forrest Gump' },
      { id: 680, title: 'Pulp Fiction' },
      { id: 769, title: 'GoodFellas' },
      { id: 637, title: 'Life Is Beautiful' },
      { id: 19404, title: 'Dilwale Dulhania Le Jayenge' },
      { id: 914, title: 'The Great Dictator' },
      { id: 105, title: 'Back to the Future' },
      { id: 98, title: 'Singin\' in the Rain' },
      { id: 372058, title: 'Your Name.' },
      { id: 429, title: 'The Good, the Bad and the Ugly' },
      { id: 11216, title: 'Cinema Paradiso' },
      { id: 558, title: 'Spider-Man 2' },
      { id: 11353, title: 'Toy Story 3' },
      { id: 862, title: 'Toy Story' },
      { id: 863, title: 'Toy Story 2' }
    ]
    
    return generateComedyMovieSitemap(baseUrl, comedyMovies)
  }

  try {
    // Fetch comedy movies from TMDB (Genre ID 35 = Comedy)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const allMovies = []
    const maxPages = 25 // Fetch 25 pages = ~500 comedy movies
    
    for (let page = 1; page <= maxPages; page += 3) {
      const batchPromises = []
      
      for (let i = 0; i < 3 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&page=${currentPage}&with_genres=35&sort_by=popularity.desc`,
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
        console.warn(`Comedy movies batch error at page ${page}:`, batchError)
        break
      }
    }
    
    clearTimeout(timeoutId)
    
    const uniqueMovies = allMovies
      .filter((movie, index, self) => self.findIndex(m => m.id === movie.id) === index)
      .slice(0, 500)
    
    return generateComedyMovieSitemap(baseUrl, uniqueMovies)
    
  } catch (error) {
    console.error('Comedy movies sitemap error:', error)
    
    const comedyMovies = [
      { id: 13, title: 'Forrest Gump' },
      { id: 680, title: 'Pulp Fiction' },
      { id: 769, title: 'GoodFellas' },
      { id: 637, title: 'Life Is Beautiful' },
      { id: 105, title: 'Back to the Future' }
    ]
    
    return generateComedyMovieSitemap(baseUrl, comedyMovies)
  }
}

function generateComedyMovieSitemap(baseUrl: string, movies: any[]) {
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
