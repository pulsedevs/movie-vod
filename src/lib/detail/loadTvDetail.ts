import type { TvShowWithCredits } from '@/lib/detail/tvTypes';

export async function loadTvDetail(id: string): Promise<TvShowWithCredits | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('TV Page: TMDB_API_KEY is not defined.');
    throw new Error('API Key is missing');
  }

  const tvId = parseInt(id, 10);
  if (isNaN(tvId) || tvId <= 0) {
    console.log(`TV Page: Invalid TV ID format: ${id}`);
    return null;
  }

  const url = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}&language=en-US&append_to_response=genres,content_ratings,credits,videos,keywords,created_by`;

  try {
    console.log(`TV Page: Fetching show details for ID ${tvId}`);
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      console.log(`TV Page: Show ${tvId} not found (404)`);
      return null;
    }

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(
        `TV Page: API Error fetching show ${tvId}: ${res.status} ${res.statusText}`,
        errorBody
      );

      if (res.status >= 400 && res.status < 500) {
        return null;
      }

      throw new Error(`Failed to fetch show ${tvId}, TMDB API status: ${res.status}`);
    }

    const showData = await res.json();

    if (!showData || !showData.id || !showData.name) {
      console.log(`TV Page: Invalid show data received for ID ${tvId}`);
      return null;
    }

    console.log(`TV Page: Successfully fetched "${showData.name}" (${tvId})`);
    return showData;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`TV Page: Request timeout for show ${tvId}`);
      throw new Error(`Request timeout loading show ${tvId}. Please try again.`);
    }

    console.error(`TV Page: Network/Fetch error for show ${tvId}:`, error);
    throw new Error(`Unable to load show data for ${tvId}. Please try again later.`);
  }
}
