// Creating a mobile optimization utility
import { ImageLoaderProps } from 'next/image';

// Optimized image loader for TMDB images
export const tmdbImageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  // Handle placeholder images or already formed URLs
  if (src.startsWith('/') || src.startsWith('http') && !src.includes('image.tmdb.org')) {
    return src;
  }
  
  // Extract the base path and size from the src
  const [basePath, sizePath, imagePath] = src.split('/').filter(Boolean);
  
  // Map the requested width to an appropriate TMDb size
  // Use the smallest possible size that is still larger than what we need
  let optimalSize: string;
  if (width <= 154) optimalSize = 'w154';
  else if (width <= 185) optimalSize = 'w185';
  else if (width <= 300) optimalSize = 'w300';
  else if (width <= 500) optimalSize = 'w500';
  else if (width <= 780) optimalSize = 'w780';
  else optimalSize = 'w1280';
  
  // Return the optimized URL
  return `https://image.tmdb.org/t/p/${optimalSize}/${imagePath}?q=${quality || 75}`;
};

// Load critical CSS with low priority for non-critical paths
export const lazyLoadCSS = (href: string): void => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('media', 'print');
    link.setAttribute('onload', "this.media='all'");
    document.head.appendChild(link);
  }
};

// Generate responsive srcSet for images
export const generateSrcSet = (basePath: string, imagePath: string | null, sizes: string[]): string => {
  if (!imagePath) return '';
  
  return sizes.map(size => 
    `${basePath}${size}${imagePath} ${size.replace('w', '')}w`
  ).join(', ');
};

// Create optimized picture element (server component helper)
export const generateImageSizes = (screenType: 'poster' | 'backdrop' | 'profile'): string => {
  switch (screenType) {
    case 'poster':
      return '(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 192px, 240px';
    case 'backdrop':
      return '(max-width: 640px) 300px, (max-width: 768px) 500px, (max-width: 1024px) 780px, 1280px';
    case 'profile':
      return '(max-width: 640px) 45px, 185px';
    default:
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
};

// Generate a blurred placeholder data URL for images
export const generateBlurPlaceholder = async (imageUrl: string): Promise<string> => {
  // Early return for placeholder images
  if (imageUrl.includes('placeholder') || !imageUrl) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+';
  }
  
  if (typeof window === 'undefined') {
    // Server-side: return a simple placeholder
    return `data:image/svg+xml;base64,${Buffer.from('<svg width="100" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a1a"/></svg>').toString('base64')}`;
  }
  
  // Client-side: create a simple blur
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+';
};
