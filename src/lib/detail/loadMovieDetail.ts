import { isMovieBlacklisted } from '@/config/blacklist';
import type { MovieWithCredits } from '@/lib/detail/movieTypes';

export async function loadMovieDetail(id: string): Promise<MovieWithCredits | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('Movie Page: TMDB_API_KEY is not defined.');
    throw new Error('API Key is missing');
  }

  const movieId = parseInt(id, 10);
  if (isNaN(movieId) || movieId <= 0) {
    console.log(`Movie Page: Invalid movie ID format: ${id}`);
    return null;
  }

  if (isMovieBlacklisted(movieId)) {
    console.log(`Movie Page: Movie ${movieId} is blacklisted - returning 404`);
    return null;
  }

  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=credits,genres,release_dates,keywords,videos,external_ids`;

  try {
    console.log(`Movie Page: Fetching movie details for ID ${movieId}`);
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      console.log(`Movie Page: Movie ${movieId} not found (404) - will return proper 404`);
      return null;
    }

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(
        `Movie Page: API Error fetching movie ${movieId}: ${res.status} ${res.statusText}`,
        errorBody
      );

      if (res.status >= 400 && res.status < 500) {
        console.log(`Movie Page: Client error ${res.status} for movie ${movieId} - will return 404`);
        return null;
      }

      throw new Error(`Failed to fetch movie ${movieId}, TMDB API status: ${res.status}`);
    }

    const movieData = await res.json();

    if (!movieData || !movieData.id || !movieData.title) {
      console.log(`Movie Page: Invalid movie data received for ID ${movieId}`);
      return null;
    }

    console.log(`Movie Page: Successfully fetched movie "${movieData.title}" (${movieId})`);
    return movieData;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`Movie Page: Request timeout for movie ${movieId}`);
      throw new Error(`Request timeout loading movie ${movieId}. Please try again.`);
    }

    console.error(`Movie Page: Network/Fetch error for movie ${movieId}:`, error);
    throw new Error(`Unable to load movie data for ${movieId}. Please try again later.`);
  }
}
