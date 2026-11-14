import HeroCarouselV3 from './HeroCarouselV3';

const TITLES = { movie: 'Movies', tv: 'TV Series', anime: 'Anime' } as const;

/** v3 browse page: short featured hero, a big page title, then the existing filters + grid. */
export default function BrowseV3({
  mediaType,
  children,
}: {
  mediaType: 'movie' | 'tv' | 'anime';
  children: React.ReactNode;
}) {
  return (
    <div>
      {mediaType !== 'anime' ? <HeroCarouselV3 mediaType={mediaType} short /> : <div className="h-28" />}
      <div className={mediaType !== 'anime' ? 'relative -mt-16' : ''}>
        <h1 className="v3-gutter v3-display mb-2 text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          {TITLES[mediaType]}
        </h1>
        <div className="v3-browse">{children}</div>
      </div>
    </div>
  );
}
