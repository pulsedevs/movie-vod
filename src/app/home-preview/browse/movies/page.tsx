import { Metadata } from 'next';
import BrowseV2View from '@/components/home/v2/browse/BrowseV2View';
import { loadBrowsePage } from '@/lib/browse/loadBrowsePage';

export const metadata: Metadata = {
  title: 'Browse Movies | BoredFlix',
  description: 'Browse our collection of movies with advanced filtering and sorting options.',
};

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePreviewBrowseMoviesPage({ searchParams }: PageProps) {
  const data = await loadBrowsePage('movie', searchParams);

  return (
    <BrowseV2View
      mediaType="movie"
      genres={data.genres}
      initialResults={data.results}
      initialTotalPages={data.totalPages}
      initialTotalResults={data.totalResults}
      initialPage={data.currentPage}
      initialFilters={data.initialFilters}
    />
  );
}
