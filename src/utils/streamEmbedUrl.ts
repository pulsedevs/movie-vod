import type { StreamSource } from '@/types';

const MOVIE_PLAYER_QUERY =
  '?color=B20710&colour=B20710&autoPlay=true&primarycolor=B20710&autoNext=true&nextButton=true&poster=true&autoplayNextEpisode=true&nextEpisode=true&adFree=true';

const PARTY_QUERY = '?colour=B20710&autoPlay=true&primarycolor=B20710';

function has(base: string | undefined, part: string): boolean {
  return Boolean(base?.includes(part));
}

/** Cinetaro: same prefix for movie/TV; id={tmdb}-movie or {tmdb}-{s}-{e} */
function isCinetaroSource(source: StreamSource): boolean {
  return (
    (has(source.baseUrls?.movie, 'cinetaro.tv') && has(source.baseUrls?.movie, 'sub.php?id=')) ||
    (has(source.baseUrls?.tv, 'cinetaro.tv') && has(source.baseUrls?.tv, 'sub.php?id='))
  );
}

function isBludclartSource(source: StreamSource): boolean {
  return has(source.baseUrls?.movie, 'bludclart.com') || has(source.baseUrls?.tv, 'bludclart.com');
}

const CINETARO_SUFFIX = '&server=maple&embed=true';

export function buildStreamEmbedUrlForPlayer(
  source: StreamSource,
  mediaType: 'movie' | 'tv',
  mediaId: string | number,
  seasonNumber?: number,
  episodeNumber?: number
): string {
  const id = String(mediaId);
  if (!id) return '';

  if (isCinetaroSource(source)) {
    const base = mediaType === 'movie' ? source.baseUrls?.movie : source.baseUrls?.tv;
    if (!base) return '';
    if (mediaType === 'movie') {
      return `${base}${id}-movie${CINETARO_SUFFIX}`;
    }
    if (seasonNumber != null && episodeNumber != null) {
      return `${base}${id}-${seasonNumber}-${episodeNumber}${CINETARO_SUFFIX}`;
    }
    return '';
  }

  if (isBludclartSource(source)) {
    if (mediaType === 'movie' && source.baseUrls?.movie) {
      return `${source.baseUrls.movie}${id}/watch${MOVIE_PLAYER_QUERY}`;
    }
    if (mediaType === 'tv' && source.baseUrls?.tv && seasonNumber && episodeNumber) {
      return `${source.baseUrls.tv}${id}/watch?season=${seasonNumber}&episode=${episodeNumber}${MOVIE_PLAYER_QUERY.replace('?', '&')}`;
    }
  }

  if (mediaType === 'movie' && source.baseUrls?.movie) {
    return `${source.baseUrls.movie}${id}${MOVIE_PLAYER_QUERY}`;
  }
  if (mediaType === 'tv' && source.baseUrls?.tv && seasonNumber && episodeNumber) {
    return `${source.baseUrls.tv}${id}/${seasonNumber}/${episodeNumber}${MOVIE_PLAYER_QUERY}`;
  }

  return '';
}

/** Shorter query string used on watch-party fallback URL generation */
export function buildStreamEmbedUrlForParty(
  source: StreamSource,
  mediaType: 'movie' | 'tv',
  mediaId: string | number,
  season: number,
  episode: number
): string {
  const id = String(mediaId);

  if (isCinetaroSource(source)) {
    const base = mediaType === 'movie' ? source.baseUrls?.movie : source.baseUrls?.tv;
    if (!base) return '';
    if (mediaType === 'movie') {
      return `${base}${id}-movie${CINETARO_SUFFIX}`;
    }
    return `${base}${id}-${season}-${episode}${CINETARO_SUFFIX}`;
  }

  if (isBludclartSource(source)) {
    if (mediaType === 'movie' && source.baseUrls?.movie) {
      return `${source.baseUrls.movie}${id}/watch${PARTY_QUERY}`;
    }
    if (mediaType === 'tv' && source.baseUrls?.tv) {
      return `${source.baseUrls.tv}${id}/watch?season=${season}&episode=${episode}${PARTY_QUERY.replace('?', '&')}`;
    }
  }

  if (mediaType === 'movie' && source.baseUrls?.movie) {
    return `${source.baseUrls.movie}${id}${PARTY_QUERY}`;
  }
  if (mediaType === 'tv' && source.baseUrls?.tv) {
    return `${source.baseUrls.tv}${id}/${season}/${episode}${PARTY_QUERY}`;
  }

  return '';
}
