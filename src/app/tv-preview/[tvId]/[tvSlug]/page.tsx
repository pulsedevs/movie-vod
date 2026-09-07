import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSlug } from '@/utils/movieLinks';
import { loadTvDetail } from '@/lib/detail/loadTvDetail';

// Mirrors the canonical /tv route, so it must never be indexed. noindex (not a robots.txt
// Disallow) — Google has to be able to CRAWL the page to read this directive.
export const metadata: Metadata = { robots: { index: false, follow: false } };

type TvPreviewRedirectProps = {
  params: Promise<{ tvId: string; tvSlug: string }>;
};

/** Legacy `/tv-preview` URLs → in-shell route for smooth transitions. */
export default async function TvPreviewRedirectPage({ params }: TvPreviewRedirectProps) {
  const { tvId, tvSlug } = await params;
  const show = await loadTvDetail(tvId);
  const slug = show ? createSlug(show.name) : tvSlug;
  redirect(`/home-preview/tv/${tvId}/${slug}`);
}
