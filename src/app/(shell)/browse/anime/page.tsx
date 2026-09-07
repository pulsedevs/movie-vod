import { Metadata } from 'next';
import { getGenres, discoverMedia } from '@/services/api';
import { MediaItem, Genre } from '@/types';
import AnimeClientPage from '@/components/browse/AnimeClientPage';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';
import { getHomeLayout } from '@/utils/homeLayout';
import { loadBrowsePage } from '@/lib/browse/loadBrowsePage';
import BrowseV2View from '@/components/home/v2/browse/BrowseV2View';
import BrowseItemListJsonLd from '@/components/browse/BrowseItemListJsonLd';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'Watch Free Anime Online | Browse All Anime | BoredFlix',
  description: 'Watch free anime online in HD on BoredFlix. Stream popular anime series, movies, and classics — no sign up required. Filter by genre, year, and rating.',
  keywords: 'watch anime online free, anime streaming, free anime, japanese animation, anime series, manga adaptation',
  alternates: { canonical: 'https://boredflix.tv/browse/anime' },
};

// Function to fetch filtered anime using direct service call
async function getFilteredAnime(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const { genres, year, sortBy, minRating, minVoteCount, language } = searchParams;
  
  const pageParam = searchParams.page;
  const page = parseInt(pageParam ? String(pageParam) : '1', 10);

  try {
    console.log(`[getFilteredAnime] Fetching anime for page: ${page}`);
    
    // Use discoverMedia service directly instead of server-side fetch
    const data = await discoverMedia('anime', {
      page,
      genres: genres ? String(genres) : undefined,
      year: year ? String(year) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      minRating: minRating ? String(minRating) : undefined,
      minVoteCount: minVoteCount ? String(minVoteCount) : undefined,
      language: language ? String(language) : undefined,
    });
    
    console.log(`[getFilteredAnime] Successfully fetched ${data.results?.length || 0} anime`);
    return data;
  } catch (error) {
    console.error('[getFilteredAnime] Error fetching anime:', error);
    // Return empty results instead of throwing to prevent page crash
    return {
      results: [] as MediaItem[],
      totalPages: 0,
      totalResults: 0
    };
  }
}

interface BrowseAnimePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 300;

export default async function BrowseAnimePage({ searchParams }: BrowseAnimePageProps) {
  const currSearchParams = await searchParams;

  if (getHomeLayout() === 'v2') {
    const data = await loadBrowsePage('anime', Promise.resolve(currSearchParams));
    return (
      <>
        <BrowseItemListJsonLd mediaType="anime" results={data.results} />
        <BrowseV2View
          mediaType="anime"
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

  // Get TV genres (since anime are TV series)
  const genres: Genre[] = await getGenres('tv');
  
  const pageParam = currSearchParams.page;
  const pageStr = pageParam ? String(pageParam) : '1';
  const pageNum = parseInt(pageStr, 10); 
  const currentPage = pageNum > 0 ? pageNum : 1;
  
  console.log(`[BrowseAnimePage] Initial server rendering with page=${currentPage}, from URL params=${pageParam}`);
  
  let selectedGenres: string[] = [];
  if (currSearchParams.genres) {
    const genresParam = currSearchParams.genres as string;
    selectedGenres = genresParam.split(',');
  }  const initialFilters = {
    genres: selectedGenres,
    year: currSearchParams.year as string | undefined,
    sortBy: currSearchParams.sortBy as string | undefined,
    minRating: currSearchParams.minRating as string | undefined,
    minVoteCount: currSearchParams.minVoteCount as string | undefined,
    language: currSearchParams.language as string | undefined,
  };
  
  const { results, totalPages, totalResults } = await getFilteredAnime({
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
    name: 'Browse Anime',
    numberOfItems: listSlice.length,
    itemListElement: listSlice.map((item, index) => {
      const itemTitle = ('title' in item ? item.title : item.name) || 'Untitled';
      const isMovie = item.media_type === 'movie';
      const itemUrl = isMovie
        ? getMovieUrl(item.id, itemTitle)
        : getTvShowUrl(item.id, itemTitle);

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${itemUrl}`,
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <AnimeClientPage
        initialResults={results as MediaItem[]}
        initialTotalPages={totalPages}
        initialTotalResults={totalResults}
        initialPage={currentPage}
        genres={genres}
        initialFilters={initialFilters}
      />
    </>
  );
}
