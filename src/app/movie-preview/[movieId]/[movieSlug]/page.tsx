import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSlug } from '@/utils/movieLinks';
import { loadMovieDetail } from '@/lib/detail/loadMovieDetail';

// Mirrors the canonical /movie route, so it must never be indexed. noindex (not a robots.txt
// Disallow) — Google has to be able to CRAWL the page to read this directive.
export const metadata: Metadata = { robots: { index: false, follow: false } };

type MoviePreviewRedirectProps = {
  params: Promise<{ movieId: string; movieSlug: string }>;
};

/** Legacy `/movie-preview` URLs → in-shell route for smooth transitions. */
export default async function MoviePreviewRedirectPage({ params }: MoviePreviewRedirectProps) {
  const { movieId, movieSlug } = await params;
  const movie = await loadMovieDetail(movieId);
  const slug = movie ? createSlug(movie.title) : movieSlug;
  redirect(`/home-preview/movie/${movieId}/${slug}`);
}
