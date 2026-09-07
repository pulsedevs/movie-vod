// src/utils/sourceHelper.ts
import { StreamSource } from '@/types'; // Make sure StreamSource is defined in src/types/index.ts

// Export the function so it can be imported into page components
export function discoverStreamSources(): StreamSource[] {
  const sources: StreamSource[] = [];
  // Ensure process.env is available (this runs server-side when called from page.tsx)
  const envVars = process.env || {};
  const envKeys = Object.keys(envVars);

  // Use a pattern to find numbered sources based on either _MOVIE or _TV key existing
  const sourcePattern = /^STREAM_BASE_(\d+)_(MOVIE|TV)$/;
  const sourceNumbers = new Set<string>();

  // First pass: identify all unique source numbers defined in environment variables
  envKeys.forEach(key => {
    const match = key.match(sourcePattern);
    if (match) {
      sourceNumbers.add(match[1]); // Add the number part (e.g., "01", "02")
    }
  });

  // Second pass: build source objects for each discovered number
  // Sort the numbers numerically before iterating to ensure consistent order
  Array.from(sourceNumbers).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).forEach(sourceNum => {
    // Construct the expected environment variable keys for this number
    const movieBaseKey = `STREAM_BASE_${sourceNum}_MOVIE`;
    const tvBaseKey = `STREAM_BASE_${sourceNum}_TV`;

    // Access environment variables using bracket notation (safer if keys might be missing)
    const movieBaseUrl = envVars[movieBaseKey] || '';
    const tvBaseUrl = envVars[tvBaseKey] || '';

    // Only add the source if at least one base URL (movie or tv) is defined for this number
    if (movieBaseUrl || tvBaseUrl) {
      const adsKey = `NEXT_PUBLIC_SOURCE_${sourceNum}_ADS`;
      const hasAds = envVars[adsKey] === 'true';
      sources.push({
        name: `Source ${parseInt(sourceNum, 10)}`,
        baseUrls: { movie: movieBaseUrl, tv: tvBaseUrl },
        hasAds,
      });
    }
  });

  // Log how many sources were found (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Discovered ${sources.length} streaming sources from environment variables.`);
  }
  return sources;
}