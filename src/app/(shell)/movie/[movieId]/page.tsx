import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Movie } from '@/types';
import { createSlug } from '@/utils/movieLinks';
import { isMovieBlacklisted } from '@/config/blacklist';

// This route only redirects to /movie/{id}/{slug}. If a host ever streams the shell before the
// redirect resolves, the 200 must not be indexable — otherwise every bare-ID URL becomes a
// thin duplicate ("Duplicate without user-selected canonical").
export const metadata: Metadata = { robots: { index: false, follow: true } };

// Fetch movie details
async function getMovieDetails(id: string): Promise<Movie | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB_API_KEY is not defined.');
    throw new Error('API Key is missing');
  }

  // Check if movie is blacklisted (copyright issues, etc.)
  const movieId = parseInt(id, 10);
  if (!isNaN(movieId) && isMovieBlacklisted(movieId)) {
    console.log(`Movie redirect: Movie ${movieId} is blacklisted - returning null`);
    return null;
  }

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch movie ${id}, status: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Fetch Error (Movie Details):', error);
    throw error;
  }
}

export default async function MovieRedirect({ params }: { params: Promise<{ movieId: string }> }) {
  // Use Promise.resolve to safely handle both Promise and non-Promise params
  const paramsData = await Promise.resolve(params);
  const movieId = paramsData.movieId;

  const movie = await getMovieDetails(movieId);

  if (!movie) {
    notFound(); // real 404 — there is no /not-found route, so redirecting there was a 307 into a 404
  }

  const slug = createSlug(movie.title);
  redirect(`/movie/${movieId}/${slug}`);
}