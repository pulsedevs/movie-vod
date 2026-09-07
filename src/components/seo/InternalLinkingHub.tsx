// components/seo/InternalLinkingHub.tsx
'use client';

import Link from 'next/link';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';

interface InternalLinkingHubProps {
  currentId: number;
  mediaType: 'movie' | 'tv';
  genres?: Array<{ id: number; name: string }>;
  title?: string;
  releaseYear?: string;
}

// Expanded popular content for better internal linking
const TRENDING_MOVIES = [
  { id: 550, title: "Fight Club", year: "1999", genres: [18] },
  { id: 13, title: "Forrest Gump", year: "1994", genres: [18, 35] },
  { id: 680, title: "Pulp Fiction", year: "1994", genres: [80, 18] },
  { id: 238, title: "The Godfather", year: "1972", genres: [18, 80] },
  { id: 424, title: "Schindler's List", year: "1993", genres: [18, 36, 10752] },
  { id: 278, title: "The Shawshank Redemption", year: "1994", genres: [18, 80] },
  { id: 389, title: "12 Angry Men", year: "1957", genres: [18] },
  { id: 129, title: "Spirited Away", year: "2001", genres: [16, 10751, 14] },
  { id: 346, title: "Seven", year: "1995", genres: [80, 9648, 53] },
  { id: 155, title: "The Dark Knight", year: "2008", genres: [18, 28, 80, 53] },
  { id: 496243, title: "Parasite", year: "2019", genres: [35, 53, 18] },
  { id: 122, title: "The Lord of the Rings: The Return of the King", year: "2003", genres: [12, 14, 28] },
  { id: 497, title: "The Green Mile", year: "1999", genres: [14, 18, 80] },
  { id: 637, title: "Life Is Beautiful", year: "1997", genres: [35, 18] },
  { id: 769, title: "GoodFellas", year: "1990", genres: [18, 80] }
];

const TRENDING_TV_SHOWS = [
  { id: 1399, title: "Game of Thrones", year: "2011", genres: [10765, 18, 10759] },
  { id: 1396, title: "Breaking Bad", year: "2008", genres: [18, 80] },
  { id: 456, title: "The Simpsons", year: "1989", genres: [16, 35] },
  { id: 2316, title: "The Office", year: "2005", genres: [35] },
  { id: 1668, title: "Friends", year: "1994", genres: [35] },
  { id: 94605, title: "Arcane", year: "2021", genres: [16, 10759, 10765] },
  { id: 85552, title: "Euphoria", year: "2019", genres: [18] },
  { id: 60625, title: "Rick and Morty", year: "2013", genres: [16, 35, 10765] },
  { id: 1402, title: "The Walking Dead", year: "2010", genres: [18, 10759, 9648] },
  { id: 1403, title: "Marvel's Agents of S.H.I.E.L.D.", year: "2013", genres: [10759, 28] },
  { id: 4607, title: "Lost", year: "2004", genres: [18, 9648, 10765] },
  { id: 1412, title: "Arrow", year: "2012", genres: [80, 18, 9648] },
  { id: 60059, title: "Better Call Saul", year: "2015", genres: [80, 18] },
  { id: 1416, title: "Grey's Anatomy", year: "2005", genres: [18] },
  { id: 1399, title: "House of Cards", year: "2013", genres: [18] }
];

// Genre mapping for better recommendations
const GENRE_NAMES: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

export default function InternalLinkingHub({ currentId, mediaType, genres = [], title, releaseYear }: InternalLinkingHubProps) {
  const genreIds = genres.map(g => g.id);
  const contentPool = mediaType === 'movie' ? TRENDING_MOVIES : TRENDING_TV_SHOWS;
  
  // Get related content by genre
  const relatedByGenre = contentPool
    .filter(item => item.id !== currentId)
    .filter(item => item.genres.some(g => genreIds.includes(g)))
    .slice(0, 4);
  
  // Get popular content from same era (decade)
  const currentDecade = releaseYear ? Math.floor(parseInt(releaseYear) / 10) * 10 : null;
  const sameEraContent = currentDecade ? contentPool
    .filter(item => item.id !== currentId)
    .filter(item => Math.floor(parseInt(item.year) / 10) * 10 === currentDecade)
    .slice(0, 3) : [];
  
  // Get trending content (different from current)
  const trendingContent = contentPool
    .filter(item => item.id !== currentId)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Related by Genre */}
      {relatedByGenre.length > 0 && (
        <section className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              Similar {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
              {genres.length > 0 && (
                <span className="text-gray-400 text-base font-normal ml-2">
                  ({genres.slice(0, 2).map(g => g.name).join(', ')})
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedByGenre.map((item) => {
                const url = mediaType === 'movie' 
                  ? getMovieUrl(item.id, item.title)
                  : getTvShowUrl(item.id, item.title);
                
                return (
                  <Link
                    key={item.id}
                    href={url}
                    className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <h3 className="text-sm font-medium text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.year}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Same Era Content */}
      {sameEraContent.length > 0 && currentDecade && (
        <section className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              More from the {currentDecade}s
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sameEraContent.map((item) => {
                const url = mediaType === 'movie' 
                  ? getMovieUrl(item.id, item.title)
                  : getTvShowUrl(item.id, item.title);
                
                return (
                  <Link
                    key={item.id}
                    href={url}
                    className="block p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <h3 className="text-base font-medium text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {item.year} • {item.genres.map(g => GENRE_NAMES[g]).filter(Boolean).slice(0, 2).join(', ')}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trending Content */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">
            Trending {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trendingContent.map((item) => {
              const url = mediaType === 'movie' 
                ? getMovieUrl(item.id, item.title)
                : getTvShowUrl(item.id, item.title);
              
              return (
                <Link
                  key={item.id}
                  href={url}
                  className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <h3 className="text-sm font-medium text-white truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.year}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-white mb-4">
            Explore More
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/browse/movies"
              className="block p-4 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors text-center"
            >
              <h3 className="text-sm font-medium text-white">Browse Movies</h3>
              <p className="text-xs text-gray-400 mt-1">All Movies</p>
            </Link>
            <Link
              href="/browse/tv"
              className="block p-4 bg-green-600/20 rounded-lg hover:bg-green-600/30 transition-colors text-center"
            >
              <h3 className="text-sm font-medium text-white">Browse TV Shows</h3>
              <p className="text-xs text-gray-400 mt-1">All Series</p>
            </Link>
            <Link
              href="/search"
              className="block p-4 bg-purple-600/20 rounded-lg hover:bg-purple-600/30 transition-colors text-center"
            >
              <h3 className="text-sm font-medium text-white">Search</h3>
              <p className="text-xs text-gray-400 mt-1">Find Content</p>
            </Link>
            <Link
              href="/"
              className="block p-4 bg-orange-600/20 rounded-lg hover:bg-orange-600/30 transition-colors text-center"
            >
              <h3 className="text-sm font-medium text-white">Home</h3>
              <p className="text-xs text-gray-400 mt-1">Popular Content</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
