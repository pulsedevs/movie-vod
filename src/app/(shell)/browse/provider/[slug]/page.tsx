import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProvider, PROVIDERS } from '@/config/providers';
import { discoverMedia } from '@/services/api';
import { buildCanonicalUrl } from '@/utils/siteUrl';
import ProviderV2View from '@/components/home/v2/browse/ProviderV2View';

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateStaticParams() {
  return PROVIDERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const provider = getProvider(slug);
  if (!provider) return { title: 'Not Found', robots: { index: false, follow: false } };

  // Self-canonical per tab. Without this the page inherited the root canonical, and
  // `?tab=movie` is byte-identical to the bare URL — two URLs, one page, no canonical.
  // `provider.slug` (not raw params) keeps the canonical on the normalized value.
  const tab = rawTab === 'tv' ? 'tv' : 'movie'; // must match the body below
  const path = `/browse/provider/${provider.slug}${tab === 'tv' ? '?tab=tv' : ''}`;
  const url = buildCanonicalUrl(path);

  return {
    // Distinct titles per tab — two indexable URLs with identical titles read as duplicates.
    title: `Watch ${provider.name} ${tab === 'tv' ? 'TV Shows' : 'Movies'} | BoredFlix`,
    description: `Browse ${tab === 'tv' ? 'TV shows' : 'movies'} available on ${provider.name}. Stream for free on BoredFlix.`,
    alternates: { canonical: url },
    openGraph: { url, type: 'website' },
  };
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;

  const provider = getProvider(slug);
  if (!provider) notFound();

  const tab = rawTab === 'tv' ? 'tv' : 'movie';

  const data = await discoverMedia(tab === 'tv' ? 'tv' : 'movie', {
    withProvider: provider.tmdbId,
    sortBy: 'popularity.desc',
    minVoteCount: 'auto',
  }).catch(() => ({ results: [], totalPages: 0, totalResults: 0 }));

  return (
    <ProviderV2View
      provider={provider}
      tab={tab}
      initialResults={data.results}
      initialTotalPages={data.totalPages}
      initialTotalResults={data.totalResults}
    />
  );
}
