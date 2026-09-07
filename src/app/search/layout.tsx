import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Results | BoredFlix',
  description: 'Search results for movies, TV shows and anime.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
