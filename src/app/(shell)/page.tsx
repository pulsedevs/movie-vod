import type { Metadata } from 'next';
import HomeRowsMain from '@/components/home/v2/HomeRowsMain';
import HomePageClassic from '@/components/home/HomePageClassic';
import { getHomeLayout } from '@/utils/homeLayout';
import { getCanonicalOrigin, buildCanonicalUrl } from '@/utils/siteUrl';

export const metadata: Metadata = {
  title: 'Watch Free Movies & TV Shows Online | BoredFlix',
  description:
    'Watch free movies and TV shows online on BoredFlix. Stream thousands of HD titles — movies, TV series, and anime — with no sign up and no subscription required.',
  alternates: {
    canonical: buildCanonicalUrl('/'),
  },
};

export default function HomePage() {
  const siteUrl = getCanonicalOrigin();

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BoredFlix',
    url: siteUrl,
    description:
      'Watch free movies and TV shows online. Stream thousands of HD titles with no sign up required.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?query={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BoredFlix',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/images/boredflix-logo.svg`,
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {getHomeLayout() === 'v2' ? <HomeRowsMain /> : <HomePageClassic />}
    </>
  );
}
