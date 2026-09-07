import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | BoredFlix',
  description: 'BoredFlix terms of service and usage guidelines.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
