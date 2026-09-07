// src/app/tv/[tvId]/page.tsx
// Redirect page for TV shows

import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TVShow } from '@/types';
import { createSlug } from '@/utils/movieLinks';

// This route only redirects to /tv/{id}/{slug}. If a host ever streams the shell before the
// redirect resolves, the 200 must not be indexable — otherwise every bare-ID URL becomes a
// thin duplicate ("Duplicate without user-selected canonical").
export const metadata: Metadata = { robots: { index: false, follow: true } };

// Fetch TV show details (simplified version for redirect)
async function getTvShowDetails(id: string): Promise<TVShow | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error("TV Redirect: TMDB_API_KEY is not defined.");
    throw new Error("API Key is missing");
  }
  
  const url = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US`;
  console.log(`TV Redirect: Fetching basic details from: ${url}`);
  
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch TV show ${id}, status: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error("TV Redirect: Fetch Error:", error);
    throw error;
  }
}

export default async function TvRedirect({ params }: { params: Promise<{ tvId: string }> }) {
  // Use Promise.resolve to safely handle both Promise and non-Promise params
  const paramsData = await Promise.resolve(params);
  const tvId = paramsData.tvId;

  const tvShow = await getTvShowDetails(tvId);

  if (!tvShow) {
    notFound(); // real 404 — there is no /not-found route, so redirecting there was a 307 into a 404
  }

  const slug = createSlug(tvShow.name);
  redirect(`/tv/${tvId}/${slug}`);
}