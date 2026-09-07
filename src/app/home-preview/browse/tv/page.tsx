import { Metadata } from 'next';
import BrowseV2View from '@/components/home/v2/browse/BrowseV2View';
import { loadBrowsePage } from '@/lib/browse/loadBrowsePage';

export const metadata: Metadata = {
  title: 'Browse TV Shows | BoredFlix',
  description: 'Browse our collection of TV shows with advanced filtering and sorting options.',
};

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePreviewBrowseTvPage({ searchParams }: PageProps) {
  const data = await loadBrowsePage('tv', searchParams);

  return (
    <BrowseV2View
      mediaType="tv"
      genres={data.genres}
      initialResults={data.results}
      initialTotalPages={data.totalPages}
      initialTotalResults={data.totalResults}
      initialPage={data.currentPage}
      initialFilters={data.initialFilters}
    />
  );
}
