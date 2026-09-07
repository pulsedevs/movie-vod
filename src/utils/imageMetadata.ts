/**
 * Image metadata utilities for better SEO and social sharing
 */

import { TMDB_IMAGE_BASE_URL } from './constants';

export interface OptimizedImageSet {
  standard: string;
  large: string;
  googleOptimized: string;
  thumbnail: string;
}

/**
 * Generate a complete set of optimized images for a poster
 * @param posterPath TMDB poster path
 * @param domain Base domain for fallback images
 * @returns Object with different image sizes and their URLs
 */
export function generateOptimizedImageSet(
  posterPath: string | null, 
  domain: string =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv'
): OptimizedImageSet {
  const fallbackImage = `${domain}/images/placeholder-poster.png`;
  
  if (!posterPath) {
    return {
      standard: fallbackImage,
      large: fallbackImage,
      googleOptimized: fallbackImage,
      thumbnail: fallbackImage,
    };
  }

  return {
    // Standard size for basic display (500x750 - 2:3 ratio)
    standard: `${TMDB_IMAGE_BASE_URL}w500${posterPath}`,
    
    // Large size for social sharing (780x1170 - 2:3 ratio)
    large: `${TMDB_IMAGE_BASE_URL}w780${posterPath}`,
    
    // Google-optimized size for better structured data compliance
    // w1280 is closer to 6:9 ratio that Google prefers for movie thumbnails
    googleOptimized: `${TMDB_IMAGE_BASE_URL}w1280${posterPath}`,
    
    // Thumbnail for quick loading (300x450 - 2:3 ratio)
    thumbnail: `${TMDB_IMAGE_BASE_URL}w300${posterPath}`,
  };
}

/**
 * Generate Open Graph image metadata with proper types and dimensions
 * @param images OptimizedImageSet
 * @param alt Alt text for the images
 * @returns Array of Open Graph image objects
 */
export function generateOpenGraphImages(images: OptimizedImageSet, alt: string) {
  return [
    {
      url: images.googleOptimized,
      width: 1280,
      height: 1920,
      alt,
      type: 'image/jpeg',
    },
    {
      url: images.large,
      width: 780,
      height: 1170,
      alt,
      type: 'image/jpeg',
    },
    {
      url: images.standard,
      width: 500,
      height: 750,
      alt,
      type: 'image/jpeg',
    },
  ];
}

/**
 * Generate structured data image array for Schema.org
 * @param images OptimizedImageSet
 * @returns Array of image URLs prioritized for Google structured data
 */
export function generateStructuredDataImages(images: OptimizedImageSet): string[] {
  return [
    images.googleOptimized, // Primary image - high quality for Google
    images.large, // Secondary image for social sharing
    images.standard, // Fallback standard size
  ];
}

/**
 * Generate preload link elements for critical images
 * @param images OptimizedImageSet
 * @param priority Which image to prioritize for preloading
 * @returns HTML link elements for preloading
 */
export function generateImagePreloads(
  images: OptimizedImageSet,
  priority: 'google' | 'social' | 'standard' = 'google'
): string {
  const priorityImage = priority === 'google' ? images.googleOptimized :
                       priority === 'social' ? images.large :
                       images.standard;

  return `<link rel="preload" as="image" href="${priorityImage}" fetchpriority="high">`;
}

/**
 * Generate responsive image sizes attribute
 * @param imageType Type of image for size calculation
 * @returns Sizes attribute string for responsive images
 */
export function generateImageSizes(imageType: 'poster' | 'backdrop' | 'thumbnail'): string {
  switch (imageType) {
    case 'poster':
      return '(max-width: 640px) 180px, (max-width: 768px) 240px, (max-width: 1024px) 300px, 400px';
    case 'backdrop':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px';
    case 'thumbnail':
      return '(max-width: 640px) 120px, (max-width: 768px) 150px, 180px';
    default:
      return '100vw';
  }
}
