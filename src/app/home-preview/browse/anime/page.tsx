import { Metadata } from 'next';
import BrowseV2View from '@/components/home/v2/browse/BrowseV2View';
import { loadBrowsePage } from '@/lib/browse/loadBrowsePage';

export const metadata: Metadata = {
  title: 'Browse Anime | BoredFlix',
  description:
    'Browse our collection of anime with advanced filtering and sorting options. Stream your favorite anime series online.',
  keywords:
    'anime, japanese animation, manga adaptation, anime series, watch anime online, anime streaming',
};

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePreviewBrowseAnimePage({ searchParams }: PageProps) {
  const data = await loadBrowsePage('anime', searchParams);

  return (
    <BrowseV2View
      mediaType="anime"
      genres={data.genres}
      initialResults={data.results}
      initialTotalPages={data.totalPages}
      initialTotalResults={data.totalResults}
      initialPage={data.currentPage}
      initialFilters={data.initialFilters}
    />
  );
}
