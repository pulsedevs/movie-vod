// src/components/common/ImageWithFallback.tsx
'use client'; // <-- Make this wrapper a Client Component

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

// Define props, extending NextImage props and adding fallbackSrc
interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string | null | undefined; // Accept potentially null src
  fallbackSrc: string;
  alt: string; // Make alt explicitly required
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  ...props // Pass rest of the props (like fill, sizes, className, priority)
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  // Update internal src if the prop changes
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      alt={alt} // Use required alt prop
      {...props} // Spread other props like fill, sizes, className, priority
      src={imgSrc || fallbackSrc} // Use state variable or fallback if initial src is null/undefined
      onError={() => {
        // If an error occurs loading imgSrc, switch to fallbackSrc
        setImgSrc(fallbackSrc);
      }}
    />
  );
};

export default ImageWithFallback;