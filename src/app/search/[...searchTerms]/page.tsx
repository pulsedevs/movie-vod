// src/app/search/[...searchTerms]/page.tsx
import { notFound } from 'next/navigation'
import { MediaItem } from '@/types'
import { Metadata } from 'next'

type SearchResultsPageProps = {
  params: Promise<{ searchTerms: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function searchMedia(query: string, page = 1): Promise<MediaItem[]> {
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey || !query) {
    return []
  }

  const encodedQuery = encodeURIComponent(query)
  const pageNumber = typeof page === 'string' ? parseInt(page, 10) : 1

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=en-US&query=${encodedQuery}&page=${pageNumber}&include_adult=false`

  try {
    const res = await fetch(url, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!res.ok) {
      return []
    }
    
    const data = await res.json()

    const filteredResults = (data.results || [])
      .filter((item: MediaItem) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
      .map((item: MediaItem) => {
        if (item.media_type === 'movie') return { ...item, name: item.title, first_air_date: item.release_date, media_type: 'movie' }
        if (item.media_type === 'tv') return { ...item, title: item.name, release_date: item.first_air_date, media_type: 'tv' }
        return item
      })
    return filteredResults

  } catch (error) {
    return []
  }
}

export async function generateMetadata({ params }: SearchResultsPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const searchQuery = resolvedParams.searchTerms?.join(' ') || ''
  
  if (!searchQuery) {
    return {
      title: 'Search Results | BoredFlix',
      description: 'Search for movies and TV shows to watch online free in HD on BoredFlix.'
    }
  }

  return {
    title: `${searchQuery} - Search Results | BoredFlix`,
    description: `Search results for "${searchQuery}". Watch ${searchQuery} and more movies and TV shows online free in HD on BoredFlix.`,
    robots: {
      index: true,
      follow: true
    }
  }
}

export default async function SearchResultsPage({ params, searchParams }: SearchResultsPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const searchQuery = resolvedParams.searchTerms?.join(' ') || ''
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1
  
  if (!searchQuery) {
    notFound()
  }

  const results = await searchMedia(searchQuery, page)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Search Results for "{searchQuery}"
        </h1>
        <p className="text-gray-400">
          {results.length > 0 
            ? `Found ${results.length} results for "${searchQuery}"`
            : `No results found for "${searchQuery}". Try a different search term.`
          }
        </p>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((item) => {
            const isMovie = item.media_type === 'movie'
            const title = isMovie ? item.title : item.name
            const year = isMovie 
              ? item.release_date?.substring(0, 4) 
              : item.first_air_date?.substring(0, 4)
            
            const slug = title
              ?.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            
            const href = isMovie 
              ? `/movie/${item.id}/${slug}`
              : `/tv/${item.id}/${slug}`
            
            return (
              <a
                key={item.id}
                href={href}
                className="block group transition-transform hover:scale-105"
              >
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="aspect-[2/3] bg-gray-700 relative">
                    {item.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        alt={`${title} poster`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {title}
                    </h3>
                    {year && (
                      <p className="text-xs text-gray-400 mt-1">{year}</p>
                    )}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            No results found
          </h2>
          <p className="text-gray-400 mb-6">
            Try searching for different keywords or browse our popular content.
          </p>
          <div className="space-x-4">
            <a
              href="/browse/movies"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Movies
            </a>
            <a
              href="/browse/tv"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse TV Shows
            </a>
          </div>
        </div>
      )}

      {/* Popular searches for internal linking */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-white mb-4">Popular Searches</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'Marvel movies', 'DC Comics', 'Horror movies', 'Comedy shows',
            'Action movies', 'Drama series', 'Sci-fi movies', 'Anime shows',
            'Thriller movies', 'Romance movies', 'Crime shows', 'Fantasy series'
          ].map((term) => (
            <a
              key={term}
              href={`/search/${term.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 transition-colors"
            >
              {term}
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
