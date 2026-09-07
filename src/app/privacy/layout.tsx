import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | BoredFlix',
  description: 'BoredFlix privacy policy and data protection information.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
