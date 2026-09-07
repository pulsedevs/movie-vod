import {
  getTrending,
  getTopRatedMovies,
  getTopRatedTvShows,
  getPopularMovies,
  getPopularTvShows,
} from '@/services/api';
import { Suspense } from 'react';
import type { Movie, TVShow } from '@/types';
import HomeRowsContent from './HomeRowsContent';
import HomeNewEpisodesRow from './HomeNewEpisodesRow';

/**
 * Server component for the new rows-based home middle column.
 * Fetches trending / top-rated / popular for movies + TV in parallel
 * (all TMDB calls are revalidate-cached) and hands them to the client view.
 */
export default async function HomeRowsMain() {
  const [
    trendingMoviesDay,
    trendingTvDay,
    trendingMoviesWeek,
    trendingTvWeek,
    topRatedMovies,
    topRatedTv,
    popularMovies,
    popularTv,
  ] = await Promise.all([
    getTrending('day', 'movie'),
    getTrending('day', 'tv'),
    getTrending('week', 'movie'),
    getTrending('week', 'tv'),
    getTopRatedMovies(),
    getTopRatedTvShows(),
    getPopularMovies(),
    getPopularTvShows(),
  ]);

  return (
    <HomeRowsContent
      // Server component passed as a slot: <Suspense> lets it stream in so its TMDB calls
      // never delay the homepage, which is the highest-traffic page on the site.
      newEpisodesSlot={
        <Suspense fallback={null}>
          <HomeNewEpisodesRow />
        </Suspense>
      }
      trendingMoviesDay={trendingMoviesDay as Movie[]}
      trendingTvDay={trendingTvDay as TVShow[]}
      trendingMoviesWeek={trendingMoviesWeek as Movie[]}
      trendingTvWeek={trendingTvWeek as TVShow[]}
      topRatedMovies={topRatedMovies}
      topRatedTv={topRatedTv}
      popularMovies={popularMovies}
      popularTv={popularTv}
    />
  );
}
