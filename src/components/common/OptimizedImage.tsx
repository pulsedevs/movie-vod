'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { useInView } from 'react-intersection-observer';
import { generateImageSizes, generateBlurPlaceholder } from '@/utils/imageOptimization';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  imageType?: 'poster' | 'backdrop' | 'profile';
  lazyBoundary?: string;
  lowQualityPlaceholder?: boolean;
  withBlur?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export default memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  imageType = 'poster',
  lazyBoundary = '200px',
  lowQualityPlaceholder = true,
  withBlur = true,
  priority = false,
  className,
  crossOrigin,
  ...rest
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [blurDataUrl, setBlurDataUrl] = useState<string | undefined>(undefined);
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: lazyBoundary,
    skip: priority // Skip IntersectionObserver if priority is true
  });

  // Only load the image when it's in view or if priority is true
  const shouldLoad = inView || priority;
  
  // Apply blur-up effect for image loading
  const imageStyles = {
    transition: isLoaded ? 'none' : 'filter 0.3s ease-in-out',
    filter: isLoaded ? 'blur(0)' : 'blur(20px)',
    ...rest.style
  };

  // Get appropriate sizes based on image type
  const sizes = rest.sizes || generateImageSizes(imageType);  // Handle the image load event
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle image loading error
  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  // Generate blur placeholder for better perceived performance
  useEffect(() => {
    if (withBlur && typeof src === 'string' && !blurDataUrl) {
      generateBlurPlaceholder(src)
        .then(dataUrl => setBlurDataUrl(dataUrl))
        .catch(() => console.log('Failed to generate blur placeholder'));
    }
  }, [src, withBlur, blurDataUrl]);

  // Use effect to preload high-priority images
  useEffect(() => {
    if (priority && typeof src === 'string') {
      const img = new window.Image();
      img.src = src;
    }
  }, [priority, src]);
  // Check if using fill prop
  const usingFill = rest.fill || (!width && !height);
  
  // Set aspect ratio if both width and height are provided and not using fill
  const aspectRatio = !usingFill && width && height ? `${width} / ${height}` : undefined;  // For fill images, render directly without wrapper to avoid positioning conflicts
  if (usingFill) {
    if (!shouldLoad) {
      // Create a placeholder div that mimics the fill behavior
      return (
        <div 
          ref={ref}
          className={className}
          style={{ 
            position: 'absolute',
            inset: 0,
            backgroundColor: '#1a1a1a',
            ...imageStyles
          }} 
        />
      );
    }

    return (
      <Image
        ref={ref}
        src={hasError ? '/images/placeholder-poster.png' : src}
        alt={alt}
        className={className}
        sizes={sizes}
        priority={priority}
        style={imageStyles}
        onLoad={handleImageLoad}
        onError={handleImageError}
        placeholder={withBlur && blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={withBlur ? blurDataUrl : undefined}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        crossOrigin={crossOrigin}
        {...rest}
      />
    );
  }

  // For non-fill images, use wrapper div
  return (
    <div 
      ref={ref} 
      className="overflow-hidden" 
      style={{ 
        position: 'relative',
        aspectRatio
      }}
    >
      {shouldLoad && (
        <Image
          src={hasError ? '/images/placeholder-poster.png' : src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          sizes={sizes}
          priority={priority}
          style={imageStyles}
          onLoad={handleImageLoad}
          onError={handleImageError}
          placeholder={withBlur && blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={withBlur ? blurDataUrl : undefined}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          crossOrigin={crossOrigin}
        />
      )}
      {!shouldLoad && (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#1a1a1a',
            position: 'absolute',
            top: 0,
            left: 0
          }} 
        />
      )}
    </div>
  );
});
