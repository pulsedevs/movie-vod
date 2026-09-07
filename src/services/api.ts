// src/services/api.ts
// Centralized API service for TMDB data fetching

import { Movie, TVShow, Genre, MediaItem, MovieApiResponse, TvApiResponse, GenreApiResponse } from '@/types';
import { filterBlacklistedContent } from '@/config/blacklist';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const REVALIDATE_DAY = 21600; // 6 hours
const REVALIDATE_WEEK = 86400; // 24 hours
const REVALIDATE_STANDARD = 86400; // 24 hours
const REVALIDATE_STATIC = 86400 * 3; // 3 days for less frequently changing data

// Error handling helper
const handleApiError = (endpoint: string, error: unknown): never => {
  console.error(`API Error (${endpoint}):`, error);
  throw new Error(`Failed to fetch data from ${endpoint}`);
};

// Get API key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB API Key is missing in environment variables');
  }
  return apiKey;
};

// Fetch helper with error handling and typing
async function fetchFromTMDB<T>(
  endpoint: string, 
  revalidate: number = REVALIDATE_STANDARD
): Promise<T> {
  const apiKey = getApiKey();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${API_BASE_URL}${endpoint}${separator}api_key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate } });

    if (!res.ok) {
      console.error(`API Error Status: ${res.status} ${res.statusText} for URL: ${url}`);
      throw new Error(`API returned status code ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`fetchFromTMDB failed for URL: ${url}`, error);
    return handleApiError(endpoint, error);
  }
}

// Discover endpoint for filtered results
export async function discoverMedia(
  mediaType: 'movie' | 'tv' | 'anime',
  params: {
    page?: number | string;
    genres?: string;
    year?: string;
    sortBy?: string;
    minRating?: string;
    minVoteCount?: string;
    language?: string;
    withProvider?: number;
  }
): Promise<{ results: MediaItem[]; totalPages: number; totalResults: number }> {
  try {
    const apiKey = getApiKey();
    const pageNum = typeof params.page === 'string' ? parseInt(params.page, 10) : (params.page || 1);
    const actualMediaType = mediaType === 'anime' ? 'tv' : mediaType;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('api_key', apiKey);
    queryParams.append('language', 'en-US');
    queryParams.append('include_adult', 'false');
    queryParams.append('page', pageNum.toString());
    
    // Add anime-specific filters
    if (mediaType === 'anime') {
      queryParams.append('with_genres', '16'); // Animation genre
      queryParams.append('with_keywords', '210024|287501'); // Anime keywords
      queryParams.append('with_origin_country', 'JP'); // Japanese origin
      
      // If user selected additional genres, append them to animation
      if (params.genres && params.genres !== '16') {
        queryParams.set('with_genres', `16,${params.genres}`);
      }
    } else if (params.genres) {
      queryParams.append('with_genres', params.genres);
    }
    
    // Add other filters
    if (params.year) {
      if (actualMediaType === 'movie') {
        queryParams.append('primary_release_year', params.year);
      } else {
        queryParams.append('first_air_date_year', params.year);
      }
    }
    
    if (params.sortBy) {
      queryParams.append('sort_by', params.sortBy);
    } else {
      queryParams.append('sort_by', 'popularity.desc');
    }
    
    // Validate and add rating filter
    if (params.minRating && params.minRating !== '0') {
      const rating = parseFloat(params.minRating);
      if (!isNaN(rating) && rating >= 0 && rating <= 10) {
        queryParams.append('vote_average.gte', rating.toString());
      }
    }
    
    if (params.minVoteCount) {
      if (params.minVoteCount !== 'auto') {
        const voteCount = parseInt(params.minVoteCount, 10);
        if (!isNaN(voteCount) && voteCount >= 0) {
          queryParams.append('vote_count.gte', voteCount.toString());
        }
      } else {
        // Apply smart defaults
        const autoMinVoteCount = actualMediaType === 'movie' ? '100' : '50';
        queryParams.append('vote_count.gte', autoMinVoteCount);
      }
    }
    
    if (params.language && mediaType !== 'anime') {
      queryParams.append('with_original_language', params.language.split('-')[0]);
    }

    if (params.withProvider) {
      queryParams.append('with_watch_providers', String(params.withProvider));
      queryParams.append('watch_region', 'US');
    }

    const endpoint = `/discover/${actualMediaType}?${queryParams.toString()}`;
    
    if (actualMediaType === 'movie') {
      const data = await fetchFromTMDB<MovieApiResponse>(endpoint, REVALIDATE_STANDARD);
      const results = data.results.map((item) => ({
        ...item,
        media_type: 'movie' as const,
      })) as Movie[];
      return {
        results,
        totalPages: data.total_pages || 0,
        totalResults: data.total_results || 0,
      };
    } else {
      const data = await fetchFromTMDB<TvApiResponse>(endpoint, REVALIDATE_STANDARD);
      const results = data.results.map((item) => ({
        ...item,
        media_type: 'tv' as const,
      })) as TVShow[];
      return {
        results,
        totalPages: data.total_pages || 0,
        totalResults: data.total_results || 0,
      };
    }
  } catch (error) {
    console.error(`Discover ${mediaType} Fetch Error:`, error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
}

// --- Movie API Functions ---
export async function getPopularMovies(page = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTMDB<MovieApiResponse>(`/movie/popular?page=${page}`, REVALIDATE_STANDARD);
    const movies = data.results?.map((movie) => ({ ...movie, media_type: 'movie' as const })) || [];
    return filterBlacklistedContent(movies);
  } catch (error) {
    console.error("Popular Movies Fetch Error:", error);
    return [];
  }
}

export async function getTopRatedMovies(page = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTMDB<MovieApiResponse>(`/movie/top_rated?page=${page}`, REVALIDATE_STATIC);
    const movies = data.results?.map((movie) => ({ ...movie, media_type: 'movie' as const })) || [];
    return filterBlacklistedContent(movies);
  } catch (error) {
    console.error("Top Rated Movies Fetch Error:", error);
    return [];
  }
}

// --- TV API Functions ---
export async function getPopularTvShows(page = 1): Promise<TVShow[]> {
  try {
    const data = await fetchFromTMDB<TvApiResponse>(`/tv/popular?page=${page}`, REVALIDATE_STANDARD);
    return data.results?.map((show) => ({ ...show, media_type: 'tv' as const })) || [];
  } catch (error) {
    console.error("Popular TV Shows Fetch Error:", error);
    return [];
  }
}

export async function getTopRatedTvShows(page = 1): Promise<TVShow[]> {
  try {
    const data = await fetchFromTMDB<TvApiResponse>(`/tv/top_rated?page=${page}`, REVALIDATE_STATIC);
    return data.results?.map((show) => ({ ...show, media_type: 'tv' as const })) || [];
  } catch (error) {
    console.error("Top Rated TV Shows Fetch Error:", error);
    return [];
  }
}

// --- Trending API Functions ---
export async function getTrending(
  timeWindow: 'day' | 'week',
  mediaType: 'movie' | 'tv'
): Promise<MediaItem[]> {
  try {
    const revalidateDuration = timeWindow === 'day' ? REVALIDATE_DAY : REVALIDATE_WEEK;
    const endpoint = `/trending/${mediaType}/${timeWindow}`;

    if (mediaType === 'movie') {
      const data = await fetchFromTMDB<MovieApiResponse>(endpoint, revalidateDuration);
      const movies = data.results.map((item) => ({
        ...item,
        media_type: 'movie' as const,
      })) || [];
      return filterBlacklistedContent(movies);
    } else {
      const data = await fetchFromTMDB<TvApiResponse>(endpoint, revalidateDuration);
      const tvShows = data.results.map((item) => ({
        ...item,
        media_type: 'tv' as const,
      })) || [];
      return filterBlacklistedContent(tvShows);
    }
  } catch (error) {
    console.error(`Trending ${mediaType}/${timeWindow} Fetch Error:`, error);
    return [];
  }
}

// --- Similar Movies Function ---
export async function getSimilarMovies(movieId: string | number, page = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTMDB<MovieApiResponse>(`/movie/${movieId}/similar?page=${page}`, REVALIDATE_STANDARD);
    const movies = data.results?.map((movie) => ({ ...movie, media_type: 'movie' as const })) || [];
    return filterBlacklistedContent(movies);
  } catch (error) {
    console.error(`Similar Movies Fetch Error for movieId ${movieId}:`, error);
    return [];
  }
}

// --- Similar TV Shows Function ---
export async function getSimilarTvShows(tvId: string | number, page = 1): Promise<TVShow[]> {
  try {
    const data = await fetchFromTMDB<TvApiResponse>(`/tv/${tvId}/similar?page=${page}`, REVALIDATE_STANDARD);
    const shows = data.results?.map((show) => ({ ...show, media_type: 'tv' as const })) || [];
    return filterBlacklistedContent(shows);
  } catch (error) {
    console.error(`Similar TV Fetch Error for tvId ${tvId}:`, error);
    return [];
  }
}

// --- Get movie details by ID ---
export async function getMovieDetails(movieId: number | string): Promise<Movie> {
  try {
    const data = await fetchFromTMDB<Movie>(`/movie/${movieId}`);
    return {
      ...data,
      media_type: 'movie' as const
    };
  } catch (error) {
    console.error(`Failed to fetch movie details for ID: ${movieId}`, error);
    throw error;
  }
}

// --- Get TV show details by ID ---
export async function getTvShowDetails(tvId: number | string): Promise<TVShow> {
  try {
    const data = await fetchFromTMDB<TVShow>(`/tv/${tvId}`);
    return {
      ...data,
      media_type: 'tv' as const
    };
  } catch (error) {
    console.error(`Failed to fetch TV show details for ID: ${tvId}`, error);
    throw error;
  }
}

// --- Additional Helper Functions ---
export async function getGenres(mediaType: 'movie' | 'tv') {
  try {
    const data = await fetchFromTMDB<GenreApiResponse>(`/genre/${mediaType}/list`, REVALIDATE_STATIC * 2);
    return data.genres || [];
  } catch (error) {
    console.error(`${mediaType.toUpperCase()} Genres Fetch Error:`, error);
    return [];
  }
}

// --- Logo Image Functions ---
interface TMDBImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

interface TMDBImagesResponse {
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

// Fetch logo image for a specific movie or TV show
export async function getMediaLogo(
  mediaType: 'movie' | 'tv', 
  mediaId: number
): Promise<string | null> {
  try {
    const endpoint = `/${mediaType}/${mediaId}/images`;
    const data = await fetchFromTMDB<TMDBImagesResponse>(endpoint, REVALIDATE_STATIC);
    
    // Find the best English logo, or fallback to any logo
    const englishLogos = data.logos.filter(logo => logo.iso_639_1 === 'en');
    const bestLogo = englishLogos.length > 0 
      ? englishLogos.sort((a, b) => b.vote_average - a.vote_average)[0]
      : data.logos.sort((a, b) => b.vote_average - a.vote_average)[0];
    
    return bestLogo ? bestLogo.file_path : null;
  } catch (error) {
    console.error(`Logo fetch error for ${mediaType} ${mediaId}:`, error);
    return null;
  }
}

// Enhance media items with logo paths (for hero carousel)
export async function enhanceMediaWithLogos(mediaItems: MediaItem[]): Promise<MediaItem[]> {
  try {
    const logoPromises = mediaItems.map(async (item) => {
      const logoPath = await getMediaLogo(item.media_type, item.id);
      return {
        ...item,
        logo_path: logoPath
      };
    });
    
    return await Promise.all(logoPromises);
  } catch (error) {
    console.error('Error enhancing media with logos:', error);
    return mediaItems; // Return original items if enhancement fails
  }
}