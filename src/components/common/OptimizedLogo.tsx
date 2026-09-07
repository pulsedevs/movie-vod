'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

interface OptimizedLogoProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onError?: () => void;
  fallbackComponent?: React.ReactNode;
  maxHeight?: number;
  maxWidth?: number;
}

export default memo(function OptimizedLogo({
  src,
  alt,
  className = '',
  priority = false,
  onError,
  fallbackComponent,
  maxHeight = 96, // Default to 6rem (lg:h-24)
  maxWidth = 384  // Default to max-w-sm
}: OptimizedLogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '100px',
    skip: priority
  });

  const shouldLoad = inView || priority;

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // If there's an error and we have a fallback, show it
  if (hasError && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // If there's an error and no fallback, don't render anything
  if (hasError) {
    return null;
  }

  // Show loading placeholder if not in view yet
  if (!shouldLoad) {
    return (
      <div 
        ref={ref}
        className={`bg-transparent animate-pulse ${className}`}
        style={{ 
          height: maxHeight,
          maxWidth: maxWidth,
          aspectRatio: 'auto'
        }}
      />
    );
  }

  return (
    <div 
      ref={ref}
      className={`relative ${className}`}
      style={{ 
        maxHeight: maxHeight,
        maxWidth: maxWidth
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={maxWidth}
        height={maxHeight}
        sizes="(max-width: 640px) 240px, (max-width: 768px) 320px, (max-width: 1024px) 400px, 500px"
        className={`object-contain transition-all duration-500 drop-shadow-2xl filter brightness-110 contrast-110 ${
          isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
        }`}
        style={{ 
          filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8)) brightness(1.1) contrast(1.1)',
          width: 'auto',
          height: 'auto',
          maxHeight: maxHeight,
          maxWidth: maxWidth
        }}
        priority={priority}
        quality={90}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});
