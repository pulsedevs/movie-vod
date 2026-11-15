// src/app/search/page.tsx

import MediaList from '@/components/media/MediaList';
import { MediaItem } from '@/types';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import V2ProductionShellLayout from '@/components/home/V2ProductionShellLayout';
import SearchV3 from '@/components/v3/search/SearchV3';
import { isV3 } from '@/utils/uiSkin';
import { getTrendingAll } from '@/services/api';
import { filterBlacklistedContent } from '@/config/blacklist';

// Define props including searchParams
type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Updated types in searchMedia function
async function searchMedia(query: string, page = 1): Promise<MediaItem[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || !query) {
    console.error("Search: API Key or Query is missing");
    return [];
  }

  const encodedQuery = encodeURIComponent(query);
  const pageNumber = typeof page === 'string' ? parseInt(page, 10) : 1;

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=en-US&query=${encodedQuery}&page=${pageNumber}&include_adult=false`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[searchMedia] Search API Error: ${res.status} ${res.statusText}`, errorBody);
      return [];
    }
    const data = await res.json();

    // Replace 'any' with specific types
    const filteredResults = (data.results || [])
      .filter((item: MediaItem) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
      .map((item: MediaItem) => {
        if (item.media_type === 'movie') return { ...item, name: item.title, first_air_date: item.release_date, media_type: 'movie' };
        if (item.media_type === 'tv') return { ...item, title: item.name, release_date: item.first_air_date, media_type: 'tv' };
        return item;
      });
    return filteredResults;

  } catch (error) {
    console.error("[searchMedia] Search Fetch Error:", error);
    return [];
  }
}

/** v3: the first page of results with the page count (the page loads more as you scroll). */
async function searchFirstPage(query: string): Promise<{ items: MediaItem[]; total: number }> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !query) return { items: [], total: 0 };
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query.slice(0, 100))}&page=1&include_adult=false`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json();
    const items = (data.results || [])
      .filter((item: MediaItem) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
      .map((item: MediaItem) =>
        item.media_type === 'movie'
          ? { ...item, name: item.title, first_air_date: item.release_date }
          : { ...item, title: item.name, release_date: item.first_air_date },
      );
    return { items: filterBlacklistedContent(items), total: data.total_pages ?? 1 };
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const currSearchParams = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  // v3: its own page inside the v3 shell (?q=, and the old ?query= links).
  if (isV3()) {
    const q = (pick(currSearchParams.q) ?? pick(currSearchParams.query) ?? '').trim();
    const [first, trending] = await Promise.all([searchFirstPage(q), getTrendingAll('day', 2)]);
    return (
      <V2ProductionShellLayout>
        <SearchV3 initialQuery={q} initialResults={first.items} initialTotalPages={first.total} trending={trending} />
      </V2ProductionShellLayout>
    );
  }

  const query = Array.isArray(currSearchParams.query)
    ? currSearchParams.query[0]
    : currSearchParams.query;

  const results: MediaItem[] = query ? await searchMedia(query) : [];

  return (
    <main className="p-4 md:p-6 mt-2">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Search Results {query ? `for "${query}"` : ''}
      </h1>

      {/* Native Banner Ad */}
      <div className="mb-8">
        <NativeBannerAdWrapper className="text-center" />
      </div>

      {query ? (
        results.length > 0 ? (
          <MediaList items={results} listTitle={`Search results for ${query}`} />
        ) : (
          <p className="text-gray-400">No results found for "{query}". Please try a different search term.</p>
        )
      ) : (
        <p className="text-gray-400">Please enter a search term in the header.</p>
      )}
    </main>
  );
}