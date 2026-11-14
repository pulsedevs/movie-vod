import {
  getPopularMovies,
  getPopularTvShows,
  getTopRatedMovies,
  getTopRatedTvShows,
  getTrending,
} from '@/services/api';
import type { MediaItem } from '@/types';
import HeroCarouselV3 from './HeroCarouselV3';
import { ContinueRow, PosterRow, ProvidersRow, Top10Row, WideRow } from './rows/Rows';

/** Two lists merged by TMDB popularity (for the mixed movie + series rows). */
function mixed(a: MediaItem[], b: MediaItem[]): MediaItem[] {
  const pop = (i: MediaItem) => (i as MediaItem & { popularity?: number }).popularity ?? 0;
  return [...a, ...b].sort((x, y) => pop(y) - pop(x));
}

/** v3 home: featured hero, then rows. All TMDB calls are revalidate-cached (see services/api). */
export default async function HomeV3() {
  const [moviesDay, tvDay, moviesWeek, tvWeek, topMovies, topTv, popMovies, popTv] = await Promise.all([
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
    <div className="pb-6">
      <HeroCarouselV3 mediaType="movie" />
      <div className="relative -mt-[12vh] md:-mt-[14vh]">
        <ContinueRow />
        <ProvidersRow />
        <Top10Row title="Top 10 today" items={mixed(moviesDay, tvDay)} />
        <PosterRow title="Trending Movies" items={moviesWeek} href="/browse/movies" />
        <PosterRow title="Trending Series" items={tvWeek} href="/browse/tv" />
        <WideRow title="Popular this week" items={mixed(moviesWeek.slice(0, 10), tvWeek.slice(0, 10))} />
        <PosterRow title="Top Rated Movies" items={topMovies} href="/browse/movies?sortBy=vote_average.desc" />
        <PosterRow title="Top Rated Series" items={topTv} href="/browse/tv?sortBy=vote_average.desc" />
        <PosterRow title="Popular Movies" items={popMovies} />
        <PosterRow title="Popular Series" items={popTv} />
      </div>
    </div>
  );
}
