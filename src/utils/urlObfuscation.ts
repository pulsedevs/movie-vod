// src/utils/urlObfuscation.ts
// XOR cipher for simple obfuscation (not cryptographically secure, just for obscurity)

function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += charCode.toString(16).padStart(2, '0');
  }
  return result;
}

function xorDecipher(encodedHex: string, key: string): string {
  let result = '';
  for (let i = 0; i < encodedHex.length; i += 2) {
    const hexByte = encodedHex.substr(i, 2);
    const charCode = parseInt(hexByte, 16);
    const originalChar = String.fromCharCode(charCode ^ key.charCodeAt((i / 2) % key.length));
    result += originalChar;
  }
  return result;
}

export function getObfuscatedSources(): Array<{name: string, movieUrl: string, tvUrl: string}> {
  const key = process.env.NEXT_PUBLIC_URL_KEY || 'default-key';
  const sources: Array<{name: string, movieUrl: string, tvUrl: string}> = [];
  
  // Look for encrypted source pairs (MOVIE_01/TV_01, MOVIE_02/TV_02, etc.)
  for (let i = 1; i <= 10; i++) {
    const movieKey = `NEXT_PUBLIC_MOVIE_${i.toString().padStart(2, '0')}`;
    const tvKey = `NEXT_PUBLIC_TV_${i.toString().padStart(2, '0')}`;
    
    const encryptedMovieUrl = process.env[movieKey];
    const encryptedTvUrl = process.env[tvKey];
    
    if (encryptedMovieUrl && encryptedTvUrl) {
      try {
        const movieUrl = xorDecipher(encryptedMovieUrl, key);
        const tvUrl = xorDecipher(encryptedTvUrl, key);
        
        sources.push({
          name: `Source ${i}`,
          movieUrl,
          tvUrl
        });
      } catch (error) {
        console.warn(`Failed to decrypt source ${i}:`, error);
      }
    }
  }
  
  return sources;
}

export function buildStreamingUrl(
  sourceIndex: number,
  mediaType: 'movie' | 'tv',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number
): string {
  const sources = getObfuscatedSources();
  const source = sources[sourceIndex];
  
  if (!source) {
    console.warn(`Source index ${sourceIndex} not found`);
    return '';
  }
  
  const baseUrl = mediaType === 'movie' ? source.movieUrl : source.tvUrl;
  if (!baseUrl) {
    console.warn(`No ${mediaType} URL for source ${sourceIndex}`);
    return '';
  }
  
  const queryParams = '?color=B20710&colour=B20710&autoPlay=true&primarycolor=B20710&autoNext=true&nextButton=true&poster=true&autoplayNextEpisode=true&nextEpisode=true';
  
  if (mediaType === 'movie') {
    return `${baseUrl}${mediaId}${queryParams}`;
  } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
    return `${baseUrl}${mediaId}/${seasonNumber}/${episodeNumber}${queryParams}`;
  }
  
  return '';
}
