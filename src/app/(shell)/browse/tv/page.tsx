import { Suspense } from 'react';
import { Metadata } from 'next';
import { getGenres, discoverMedia } from '@/services/api';
import FilterPanel from '@/components/browse/FilterPanel';
import PaginatedResults from '@/components/browse/PaginatedResults';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import { MediaItem, Genre } from '@/types';
import { FilterProvider } from '@/components/browse/FilterContext';
import { getTvShowUrl } from '@/utils/movieLinks';
import { getHomeLayout } from '@/utils/homeLayout';
import { loadBrowsePage } from '@/lib/browse/loadBrowsePage';
import BrowseV2View from '@/components/home/v2/browse/BrowseV2View';
import BrowseItemListJsonLd from '@/components/browse/BrowseItemListJsonLd';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Watch Free TV Shows Online | Browse All Series | BoredFlix',
  description: 'Browse and stream free TV shows online in HD on BoredFlix. Filter by genre, year, and rating. Watch drama, crime, comedy, sci-fi series — no sign up required.',
  alternates: { canonical: 'https://boredflix.tv/browse/tv' },
};

// Function to fetch filtered TV shows using direct service call
async function getFilteredTvShows(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const { genres, year, sortBy, minRating, minVoteCount, language } = searchParams;
  
  const pageParam = searchParams.page;
  const page = parseInt(pageParam ? String(pageParam) : '1', 10);

  try {
    console.log(`[getFilteredTvShows] Fetching TV shows for page: ${page}`);
    
    // Use discoverMedia service directly instead of server-side fetch
    const data = await discoverMedia('tv', {
      page,
      genres: genres ? String(genres) : undefined,
      year: year ? String(year) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      minRating: minRating ? String(minRating) : undefined,
      minVoteCount: minVoteCount ? String(minVoteCount) : undefined,
      language: language ? String(language) : undefined,
    });
    
    console.log(`[getFilteredTvShows] Successfully fetched ${data.results?.length || 0} TV shows`);
    return data;
  } catch (error) {
    console.error('[getFilteredTvShows] Error fetching TV shows:', error);
    // Return empty results instead of throwing to prevent page crash
    return {
      results: [] as MediaItem[],
      totalPages: 0,
      totalResults: 0
    };
  }
}

interface BrowseTvShowsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 300;

export default async function BrowseTvShowsPage({ searchParams }: BrowseTvShowsPageProps) {
  const currSearchParams = await searchParams;

  if (getHomeLayout() === 'v2') {
    const data = await loadBrowsePage('tv', Promise.resolve(currSearchParams));
    return (
      <>
        <BrowseItemListJsonLd mediaType="tv" results={data.results} />
        <BrowseV2View
          mediaType="tv"
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

  const genres: Genre[] = await getGenres('tv');
  
  const pageParam = currSearchParams.page;
  const pageStr = pageParam ? String(pageParam) : '1';
  const pageNum = parseInt(pageStr, 10); 
  const currentPage = pageNum > 0 ? pageNum : 1;
  
  console.log(`[BrowseTvShowsPage] Initial server rendering with page=${currentPage}, from URL params=${pageParam}`);
  
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
  
  const { results, totalPages, totalResults } = await getFilteredTvShows({
    ...currSearchParams,
    page: String(currentPage)
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv';
  const listSlice = results.slice(0, 24);
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Browse TV Shows',
    numberOfItems: listSlice.length,
    itemListElement: listSlice.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}${getTvShowUrl(item.id, ('name' in item ? item.name : undefined) || 'untitled')}`,
    })),
  };
  
  return (
    <FilterProvider initialFilters={initialFilters}>      <main className="container mx-auto px-4 py-6 mt-2">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Browse TV Shows</h1>
        
        {/* Native Banner Ad */}
        <div className="mb-6">
          <NativeBannerAdWrapper className="text-center" />
        </div>
        
        <FilterPanel mediaType="tv" genres={genres} />
        
        <Suspense fallback={
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-transparent border-t-red-500 border-r-red-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-b-purple-500 border-l-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 animate-pulse"></div>
              </div>
              <span className="text-lg font-medium bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Loading TV shows...
              </span>
            </div>
          </div>
        }>
          <PaginatedResults
            initialResults={results as MediaItem[]}
            initialTotalPages={totalPages}
            initialTotalResults={totalResults}
            initialPage={currentPage}
            mediaType="tv"
          />
        </Suspense>
      </main>
    </FilterProvider>
  );
}