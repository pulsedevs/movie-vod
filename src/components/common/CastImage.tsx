'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { TMDB_IMAGE_BASE_URL, OPTIMIZED_IMAGE_SIZES } from '@/utils/constants';

interface CastImageProps {
  profilePath: string | null;
  name: string;
  character?: string;
  size?: 'small' | 'medium';
  priority?: boolean;
  className?: string;
}

export default memo(function CastImage({
  profilePath,
  name,
  character,
  size = 'medium',
  priority = false,
  className = '',
}: CastImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '200px',
    skip: priority
  });

  const shouldLoad = inView || priority;
  
  // Set dimensions based on size
  const dimensions = {
    small: { width: 45, height: 68 },
    medium: { width: 185, height: 278 }
  };
  
  const { width, height } = dimensions[size];
  
  // Get the appropriate image size from TMDB
  const imageSize = OPTIMIZED_IMAGE_SIZES.profile[size];
  
  // Prepare the image source
  const src = profilePath 
    ? `${TMDB_IMAGE_BASE_URL}${imageSize}${profilePath}` 
    : '/images/placeholder-poster.png';
  
  // Calculate aspect ratio to prevent layout shift
  const aspectRatio = `${width} / ${height}`;
  
  const handleImageLoad = () => {
    setIsLoaded(true);
  };
  
  const handleImageError = () => {
    setHasError(true);
  };

  return (
    <div 
      ref={ref}
      className={`overflow-hidden relative rounded-md ${className}`}
      style={{ 
        aspectRatio,
        width: '100%',
        maxWidth: width
      }}
    >
      {shouldLoad && (
        <>
          <div 
            className={`absolute inset-0 bg-gray-800 transition-opacity duration-300 ${isLoaded && !hasError ? 'opacity-0' : 'opacity-100'}`}
          />
          <Image
            src={hasError ? '/images/placeholder-poster.png' : src}
            alt={`${name}${character ? ` as ${character}` : ''}`}
            fill
            sizes={`(max-width: 640px) ${dimensions.small.width}px, ${width}px`}
            style={{ 
              objectFit: 'cover',
              transition: 'opacity 0.3s ease-in-out',
              opacity: isLoaded ? 1 : 0
            }}
            priority={priority}
            onLoad={handleImageLoad}
            onError={handleImageError}
            fetchPriority={priority ? 'high' : 'auto'}
            loading={priority ? 'eager' : 'lazy'}
          />
        </>
      )}
    </div>
  );
});
