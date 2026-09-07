import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Library | BoredFlix',
  description: 'Your personal watchlist and saved movies and TV shows.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
