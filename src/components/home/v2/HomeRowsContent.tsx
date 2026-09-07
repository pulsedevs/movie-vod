'use client';

import dynamic from 'next/dynamic';
import type { Movie, TVShow } from '@/types';
import { navThemes } from './navThemes';
import HomeRowsSearchHeader from './HomeRowsSearchHeader';
import HomeRow from './HomeRow';
import HomeTrendingRows from './HomeTrendingRows';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';

// Hero fetches its own data + uses framer-motion — load client-side only.
const HomeHeroCarousel = dynamic(() => import('@/components/home/HomeHeroCarousel'), {
  ssr: false,
  loading: () => <div className="hero-shell-compact w-full animate-pulse rounded-lg bg-white/[0.04]" />,
});

export interface HomeRowsData {
  trendingMoviesDay: Movie[];
  trendingTvDay: TVShow[];
  trendingMoviesWeek: Movie[];
  trendingTvWeek: TVShow[];
  topRatedMovies: Movie[];
  topRatedTv: TVShow[];
  popularMovies: Movie[];
  popularTv: TVShow[];
  /** Server-rendered "New Episodes" row (see HomeRowsMain). */
  newEpisodesSlot?: React.ReactNode;
}

/** New rows-based home middle column — search header, sliding hero, trending rows. */
export default function HomeRowsContent({ newEpisodesSlot, ...data }: HomeRowsData) {
  return (
    <div className="w-full min-w-0 pb-10">
      {/* Desktop: transparent search/logo bar overlaid on the hero.
          Mobile: search lives in the mobile header nav, so the hero sits at the top. */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-40 hidden md:block">
          <HomeRowsSearchHeader />
        </div>
        <div className="px-3 pt-1 sm:px-5 md:pt-0">
          <HomeHeroCarousel compact edgeToEdge fadeBottom fadeColor="#080808" className="rounded-2xl overflow-hidden" />
        </div>
      </div>

      <div className="px-4 pt-3 sm:px-5">
        <NativeBannerAdWrapper className="text-center" />
      </div>

      {/* Continue Watching — the real production mobile row (poster cards + menu).
          Already md:hidden internally, so desktop relies on the right library panel. */}
      <HomeTrendingRows />

      <HomeRow
        title="Trending Today"
        accent={navThemes.home.icon}
        movieItems={data.trendingMoviesDay}
        tvItems={data.trendingTvDay}
      />
      <HomeRow
        title="Trending This Week"
        accent={navThemes.movies.icon}
        movieItems={data.trendingMoviesWeek}
        tvItems={data.trendingTvWeek}
      />
      {newEpisodesSlot}

      <HomeRow
        title="Top Rated"
        accent={navThemes.tv.icon}
        movieItems={data.topRatedMovies}
        tvItems={data.topRatedTv}
      />
      <HomeRow
        title="Popular"
        accent={navThemes.parties.icon}
        movieItems={data.popularMovies}
        tvItems={data.popularTv}
      />
    </div>
  );
}
