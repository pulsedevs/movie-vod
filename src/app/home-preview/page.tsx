import type { Metadata } from 'next';
import HomeMainContent from '@/components/home/v2/HomeMainContent';
import { buildCanonicalUrl } from '@/utils/siteUrl';

export const metadata: Metadata = {
  title: 'Watch Free Movies & TV Shows Online | BoredFlix',
  description:
    'Watch free movies and TV shows online on BoredFlix. Stream thousands of HD titles — movies, TV series, and anime — with no sign up and no subscription required.',
  alternates: {
    canonical: buildCanonicalUrl('/'),
  },
};

export default function HomePreviewPage() {
  return <HomeMainContent />;
}
