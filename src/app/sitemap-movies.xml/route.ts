import { formatSitemapLastMod } from '@/utils/sitemapLastMod'
import { createSlug } from '@/utils/movieLinks'
// src/app/sitemap-movies.xml/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    // Fallback to popular movies if no API key
    const popularMovies = [
      { id: 278, title: 'The Shawshank Redemption' },
      { id: 238, title: 'The Godfather' },
      { id: 680, title: 'Pulp Fiction' },
      { id: 550, title: 'Fight Club' },
      { id: 13, title: 'Forrest Gump' },
      { id: 155, title: 'The Dark Knight' },
      { id: 122, title: 'The Lord of the Rings: The Return of the King' },
      { id: 129, title: 'Spirited Away' },
      { id: 346, title: 'Seven' },
      { id: 389, title: '12 Angry Men' },
      { id: 424, title: 'Schindler\'s List' },
      { id: 769, title: 'GoodFellas' },
      { id: 637, title: 'Life Is Beautiful' },
      { id: 497, title: 'The Green Mile' },
      { id: 496243, title: 'Parasite' }
    ]
    
    return generateMovieSitemap(baseUrl, popularMovies)
  }

  try {
    // Fetch multiple pages of popular movies from TMDB (with timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for multiple requests
    
    const allMovies = []
    const maxPages = 50 // Fetch 50 pages = ~1000 movies
    
    // Fetch multiple pages in batches to avoid overwhelming the API
    for (let page = 1; page <= maxPages; page += 5) {
      const batchPromises = []
      
      for (let i = 0; i < 5 && (page + i) <= maxPages; i++) {
        const currentPage = page + i
        batchPromises.push(
          fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${currentPage}`,
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
    
    // Remove duplicates and limit to 1000 movies
    const uniqueMovies = allMovies
      .filter((movie, index, self) => self.findIndex(m => m.id === movie.id) === index)
      .slice(0, 1000)
    
    return generateMovieSitemap(baseUrl, uniqueMovies)
    
  } catch (error) {
    console.error('Movie sitemap error:', error)
    
    // Fallback to expanded popular movies list
    const popularMovies = [
      { id: 278, title: 'The Shawshank Redemption' },
      { id: 238, title: 'The Godfather' },
      { id: 680, title: 'Pulp Fiction' },
      { id: 550, title: 'Fight Club' },
      { id: 13, title: 'Forrest Gump' },
      { id: 155, title: 'The Dark Knight' },
      { id: 122, title: 'The Lord of the Rings: The Return of the King' },
      { id: 129, title: 'Spirited Away' },
      { id: 346, title: 'Seven' },
      { id: 389, title: '12 Angry Men' },
      { id: 424, title: 'Schindler\'s List' },
      { id: 769, title: 'GoodFellas' },
      { id: 637, title: 'Life Is Beautiful' },
      { id: 497, title: 'The Green Mile' },
      { id: 496243, title: 'Parasite' },
      { id: 120, title: 'The Lord of the Rings: The Fellowship of the Ring' },
      { id: 121, title: 'The Lord of the Rings: The Two Towers' },
      { id: 11, title: 'Star Wars' },
      { id: 1891, title: 'The Empire Strikes Back' },
      { id: 1892, title: 'Return of the Jedi' },
      { id: 140607, title: 'Star Wars: The Force Awakens' },
      { id: 181808, title: 'Star Wars: The Last Jedi' },
      { id: 102899, title: 'Ant-Man' },
      { id: 299536, title: 'Avengers: Infinity War' },
      { id: 299534, title: 'Avengers: Endgame' },
      { id: 24428, title: 'The Avengers' },
      { id: 118340, title: 'Guardians of the Galaxy' },
      { id: 315635, title: 'Spider-Man: Homecoming' },
      { id: 429617, title: 'Spider-Man: Far From Home' },
      { id: 634649, title: 'Spider-Man: No Way Home' },
      { id: 27205, title: 'Inception' },
      { id: 49026, title: 'The Dark Knight Rises' },
      { id: 1724, title: 'The Incredible Hulk' },
      { id: 1726, title: 'Iron Man' },
      { id: 10138, title: 'Iron Man 2' },
      { id: 68721, title: 'Iron Man 3' },
      { id: 1771, title: 'Captain America: The First Avenger' },
      { id: 100402, title: 'Captain America: The Winter Soldier' },
      { id: 271110, title: 'Captain America: Civil War' },
      { id: 10195, title: 'Thor' },
      { id: 76338, title: 'Thor: The Dark World' },
      { id: 284053, title: 'Thor: Ragnarok' },
      { id: 383498, title: 'Deadpool' },
      { id: 383498, title: 'Deadpool 2' },
      { id: 545611, title: 'Everything Everywhere All at Once' },
      { id: 926393, title: 'The Whale' },
      { id: 361743, title: 'Top Gun: Maverick' },
      { id: 435841, title: 'Fantastic Beasts: The Crimes of Grindelwald' },
      { id: 338958, title: 'Fantastic Beasts and Where to Find Them' },
      { id: 672, title: 'Harry Potter and the Chamber of Secrets' },
      { id: 673, title: 'Harry Potter and the Prisoner of Azkaban' }
    ]
    
    return generateMovieSitemap(baseUrl, popularMovies)
  }
}

function generateMovieSitemap(baseUrl: string, movies: any[]) {

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const uniqueMovies = movies.filter(
    (movie, index, self) => self.findIndex((candidate) => candidate.id === movie.id) === index
  )

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${uniqueMovies.map(movie => `
  <url>
    <loc>${normalizedBaseUrl}/movie/${movie.id}/${createSlug(movie.title)}</loc>
    <lastmod>${formatSitemapLastMod(movie.release_date)}</lastmod>
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
