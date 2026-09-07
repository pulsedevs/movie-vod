import type { MediaItem } from '@/types';
import { getMovieUrl, getTvShowUrl } from '@/utils/movieLinks';
import type { BrowseMediaType } from '@/lib/browse/loadBrowsePage';

const LIST_NAMES: Record<BrowseMediaType, string> = {
  movie: 'Browse Movies',
  tv: 'Browse TV Shows',
  anime: 'Browse Anime',
};

interface BrowseItemListJsonLdProps {
  mediaType: BrowseMediaType;
  results: MediaItem[];
  limit?: number;
}

export default function BrowseItemListJsonLd({
  mediaType,
  results,
  limit = 24,
}: BrowseItemListJsonLdProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv';

  const listSlice = results.slice(0, limit);
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: LIST_NAMES[mediaType],
    numberOfItems: listSlice.length,
    itemListElement: listSlice.map((item, index) => {
      const itemTitle = ('title' in item ? item.title : item.name) || 'Untitled';
      const itemUrl =
        item.media_type === 'movie'
          ? getMovieUrl(item.id, itemTitle)
          : getTvShowUrl(item.id, itemTitle);

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${itemUrl}`,
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
  );
}
