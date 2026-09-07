import { getPopularMovies, getPopularTvShows } from '@/services/api';
import type { MediaItem } from '@/types';
import NativeBannerAdWrapper from '@/components/ads/NativeBannerAdWrapper';
import HomeLandingHero from './HomeLandingHero';
import HomeTrendingRows from './HomeTrendingRows';

export default async function HomeMainContent() {
  const [popularMovies, popularTv] = await Promise.all([
    getPopularMovies(),
    getPopularTvShows(),
  ]);

  const withPosters = (items: MediaItem[]) => items.filter((item) => !!item.poster_path);

  return (
    <div className="min-w-0 w-full">
      <HomeLandingHero
        initialPopularMovies={withPosters(popularMovies as MediaItem[])}
        initialPopularTv={withPosters(popularTv as MediaItem[])}
      />
      <NativeBannerAdWrapper className="text-center" />
      <HomeTrendingRows />
    </div>
  );
}
