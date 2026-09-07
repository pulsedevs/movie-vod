import type { Metadata } from 'next';
import LibraryV2View from '@/components/home/v2/library/LibraryV2View';

export const metadata: Metadata = {
  title: 'My Library | BoredFlix',
  description: 'Your personal watchlist and saved movies and TV shows on BoredFlix.',
  robots: { index: false, follow: false },
};

export default function HomePreviewLibraryPage() {
  return <LibraryV2View />;
}
