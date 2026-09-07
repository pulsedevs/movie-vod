import { getGenres, discoverMedia } from '@/services/api';
import { Genre, MediaItem } from '@/types';

export type BrowseMediaType = 'movie' | 'tv' | 'anime';

export interface BrowseInitialFilters {
  genres: string[];
  year?: string;
  sortBy?: string;
  minRating?: string;
  minVoteCount?: string;
  language?: string;
}

export interface BrowsePageData {
  genres: Genre[];
  initialFilters: BrowseInitialFilters;
  results: MediaItem[];
  totalPages: number;
  totalResults: number;
  currentPage: number;
}

function parseSearchParams(searchParams: { [key: string]: string | string[] | undefined }) {
  const pageParam = searchParams.page;
  const pageStr = pageParam ? String(pageParam) : '1';
  const pageNum = parseInt(pageStr, 10);
  const currentPage = pageNum > 0 ? pageNum : 1;

  let selectedGenres: string[] = [];
  if (searchParams.genres) {
    selectedGenres = String(searchParams.genres).split(',');
  }

  const initialFilters: BrowseInitialFilters = {
    genres: selectedGenres,
    year: searchParams.year as string | undefined,
    sortBy: searchParams.sortBy as string | undefined,
    minRating: searchParams.minRating as string | undefined,
    minVoteCount: searchParams.minVoteCount as string | undefined,
    language: searchParams.language as string | undefined,
  };

  return { currentPage, initialFilters };
}

async function fetchBrowseResults(
  mediaType: BrowseMediaType,
  searchParams: { [key: string]: string | string[] | undefined },
  currentPage: number
) {
  const { genres, year, sortBy, minRating, minVoteCount, language } = searchParams;

  try {
    return await discoverMedia(mediaType, {
      page: currentPage,
      genres: genres ? String(genres) : undefined,
      year: year ? String(year) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      minRating: minRating ? String(minRating) : undefined,
      minVoteCount: minVoteCount ? String(minVoteCount) : undefined,
      language: language ? String(language) : undefined,
    });
  } catch (error) {
    console.error(`[loadBrowsePage] Error fetching ${mediaType}:`, error);
    return {
      results: [] as MediaItem[],
      totalPages: 0,
      totalResults: 0,
    };
  }
}

export async function loadBrowsePage(
  mediaType: BrowseMediaType,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
): Promise<BrowsePageData> {
  const currSearchParams = await searchParams;
  const { currentPage, initialFilters } = parseSearchParams(currSearchParams);

  const genreType = mediaType === 'anime' ? 'tv' : mediaType;

  const [genres, { results, totalPages, totalResults }] = await Promise.all([
    getGenres(genreType),
    fetchBrowseResults(mediaType, { ...currSearchParams, page: String(currentPage) }, currentPage),
  ]);

  return {
    genres,
    initialFilters,
    results: results as MediaItem[],
    totalPages,
    totalResults,
    currentPage,
  };
}
