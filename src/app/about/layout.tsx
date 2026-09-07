import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | BoredFlix',
  description: 'Learn about BoredFlix and our mission to provide the best streaming experience.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
