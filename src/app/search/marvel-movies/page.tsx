// src/app/search/marvel-movies/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marvel Movies - Watch Online Free | BoredFlix',
  description: 'Watch Marvel movies online free in HD. Stream Iron Man, Avengers, Thor, Captain America and more Marvel superhero movies on BoredFlix.',
  robots: { index: true, follow: true }
}

export default function MarvelMoviesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Marvel Movies</h1>
      <p className="text-gray-300 mb-8">
        Watch all Marvel superhero movies online free in HD. From Iron Man to Avengers Endgame, 
        stream the complete Marvel Cinematic Universe on BoredFlix.
      </p>
      
      {/* This will redirect to search results */}
      <script 
        dangerouslySetInnerHTML={{
          __html: `window.location.href = '/search?q=marvel+movies'`
        }}
      />
      
      <div className="text-center">
        <p className="text-gray-400 mb-4">Loading Marvel movies...</p>
        <a 
          href="/search?q=marvel+movies" 
          className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Search Marvel Movies
        </a>
      </div>
    </main>
  )
}
