// components/seo/RelatedContent.tsx
'use client';

import Link from 'next/link';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';

interface RelatedContentProps {
  currentId: number;
  mediaType: 'movie' | 'tv';
  genres?: Array<{ id: number; name: string }>;
}

// Hardcoded popular content for internal linking
const POPULAR_MOVIES = [
  { id: 550, title: "Fight Club", genres: [18] },
  { id: 13, title: "Forrest Gump", genres: [18, 35] },
  { id: 680, title: "Pulp Fiction", genres: [80, 18] },
  { id: 238, title: "The Godfather", genres: [18, 80] },
  { id: 424, title: "Schindler's List", genres: [18, 36, 10752] },
  { id: 278, title: "The Shawshank Redemption", genres: [18, 80] },
  { id: 19404, title: "Dilwale Dulhania Le Jayenge", genres: [35, 18, 10749] },
  { id: 389, title: "12 Angry Men", genres: [18] },
  { id: 129, title: "Spirited Away", genres: [16, 10751, 14] },
  { id: 346, title: "Seven", genres: [80, 9648, 53] }
];

const POPULAR_TV_SHOWS = [
  { id: 1399, title: "Game of Thrones", genres: [10765, 18, 10759] },
  { id: 1396, title: "Breaking Bad", genres: [18, 80] },
  { id: 456, title: "The Simpsons", genres: [16, 35] },
  { id: 2316, title: "The Office", genres: [35] },
  { id: 1668, title: "Friends", genres: [35] },
  { id: 94605, title: "Arcane", genres: [16, 10759, 10765] },
  { id: 85552, title: "Euphoria", genres: [18] },
  { id: 60625, title: "Rick and Morty", genres: [16, 35, 10765] },
  { id: 4614, title: "Naruto", genres: [16, 10759] },
  { id: 1402, title: "The Walking Dead", genres: [18, 10759, 9648] }
];

export default function RelatedContent({ currentId, mediaType, genres = [] }: RelatedContentProps) {
  const genreIds = genres.map(g => g.id);
  const contentPool = mediaType === 'movie' ? POPULAR_MOVIES : POPULAR_TV_SHOWS;
  
  // Filter out current item and find related content
  const relatedContent = contentPool
    .filter(item => item.id !== currentId)
    .sort((a, b) => {
      // Prioritize items with matching genres
      const aMatches = a.genres.filter(g => genreIds.includes(g)).length;
      const bMatches = b.genres.filter(g => genreIds.includes(g)).length;
      return bMatches - aMatches;
    })
    .slice(0, 6);

  if (relatedContent.length === 0) return null;

  return (
    <section className="container mx-auto px-4 md:px-6 mt-8 mb-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          More {mediaType === 'movie' ? 'Movies' : 'TV Shows'} You Might Like
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {relatedContent.map((item) => {
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
                  {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
