import { Suspense } from 'react';
import { Metadata } from 'next';
import { getGenres, discoverMedia } from '@/services/api';
import FilterPanel from '@/components/browse/FilterPanel';
import PaginatedResults from '@/components/browse/PaginatedResults';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import { MediaItem, Genre } from '@/types';
import { FilterProvider } from '@/components/browse/FilterContext';
import { getMovieUrl } from '@/utils/movieLinks';
import { getHomeLayout } from '@/utils/homeLayout';
import { loadBrowsePage } from '@/lib/browse/loadBrowsePage';
import BrowseV2View from '@/components/home/v2/browse/BrowseV2View';
import BrowseItemListJsonLd from '@/components/browse/BrowseItemListJsonLd';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Watch Free Movies Online | Browse All Movies | BoredFlix',
  description: 'Browse and watch free movies online in HD on BoredFlix. Filter by genre, year, and rating. Stream action, comedy, horror, sci-fi and more — no sign up required.',
  alternates: { canonical: 'https://boredflix.tv/browse/movies' },
};

// Function to fetch filtered movies using direct service call
async function getFilteredMovies(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const { genres, year, sortBy, minRating, minVoteCount, language } = searchParams;
  
  const pageParam = searchParams.page;
  const page = parseInt(pageParam ? String(pageParam) : '1', 10);
  
  try {
    console.log(`[getFilteredMovies] Fetching movies for page: ${page}`);
    
    // Use discoverMedia service directly instead of server-side fetch
    const data = await discoverMedia('movie', {
      page,
      genres: genres ? String(genres) : undefined,
      year: year ? String(year) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      minRating: minRating ? String(minRating) : undefined,
      minVoteCount: minVoteCount ? String(minVoteCount) : undefined,
      language: language ? String(language) : undefined,
    });
    
    console.log(`[getFilteredMovies] Successfully fetched ${data.results?.length || 0} movies`);
    return data;
  } catch (error) {
    console.error('[getFilteredMovies] Error fetching movies:', error);
    // Return empty results instead of throwing to prevent page crash
    return {
      results: [] as MediaItem[],
      totalPages: 0,
      totalResults: 0
    };
  }
}

interface BrowseMoviesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 300;

export default async function BrowseMoviesPage({ searchParams }: BrowseMoviesPageProps) {
  const currSearchParams = await searchParams;

  if (getHomeLayout() === 'v2') {
    const data = await loadBrowsePage('movie', Promise.resolve(currSearchParams));
    return (
      <>
        <BrowseItemListJsonLd mediaType="movie" results={data.results} />
        <BrowseV2View
          mediaType="movie"
          genres={data.genres}
          initialResults={data.results}
          initialTotalPages={data.totalPages}
          initialTotalResults={data.totalResults}
          initialPage={data.currentPage}
          initialFilters={data.initialFilters}
        />
      </>
    );
  }
  
  const genres: Genre[] = await getGenres('movie');
  
  const pageParam = currSearchParams.page;
  const pageStr = pageParam ? String(pageParam) : '1';
  const pageNum = parseInt(pageStr, 10); 
  const currentPage = pageNum > 0 ? pageNum : 1;
  
  console.log(`[BrowseMoviesPage] Initial server rendering with page=${currentPage}, from URL params=${pageParam}`);
  
  let selectedGenres: string[] = [];
  if (currSearchParams.genres) {
    const genresParam = currSearchParams.genres as string;
    selectedGenres = genresParam.split(',');
  }
    const initialFilters = {
    genres: selectedGenres,
    year: currSearchParams.year as string | undefined,
    sortBy: currSearchParams.sortBy as string | undefined,
    minRating: currSearchParams.minRating as string | undefined,
    minVoteCount: currSearchParams.minVoteCount as string | undefined,
    language: currSearchParams.language as string | undefined,
  };
  
  const { results, totalPages, totalResults } = await getFilteredMovies({
    ...currSearchParams,
    page: String(currentPage)
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv';
  // Listing pages: links only (no nested Movie/TVSeries or aggregateRating) so Google
  // does not treat /browse/* as many review-eligible entities. Full schema stays on /movie/* and /tv/*.
  const listSlice = results.slice(0, 24);
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Browse Movies',
    numberOfItems: listSlice.length,
    itemListElement: listSlice.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}${getMovieUrl(item.id, ('title' in item ? item.title : undefined) || 'untitled')}`,
    })),
  };
  
  return (
    <FilterProvider initialFilters={initialFilters}>
      <main className="container mx-auto px-4 py-6 mt-2">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Browse Movies</h1>
        
        {/* Native Banner Ad */}
        <div className="mb-6">
          <NativeBannerAdWrapper className="text-center" />
        </div>
        
        <FilterPanel mediaType="movie" genres={genres} />
        
        <Suspense fallback={
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-transparent border-t-red-500 border-r-red-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-b-purple-500 border-l-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 animate-pulse"></div>
              </div>
              <span className="text-lg font-medium bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Loading movies...
              </span>
            </div>
          </div>
        }>
          <PaginatedResults
            initialResults={results as MediaItem[]}
            initialTotalPages={totalPages}
            initialTotalResults={totalResults}
            initialPage={currentPage}
            mediaType="movie"
          />
        </Suspense>
      </main>
    </FilterProvider>
  );
}