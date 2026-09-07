'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '@/types';
import MediaCard from './MediaCard';
import { MediaListSkeleton } from './MediaCardSkeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaListProps {
  items: MediaItem[];
  listTitle?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  layout?: 'grid' | 'carousel';
}

const MediaList: React.FC<MediaListProps> = ({ 
  items, 
  listTitle, 
  isLoading = false,
  error = null,
  onRetry,
  layout = 'grid' 
}) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Ensure items is not a Promise
  const [processedItems, setProcessedItems] = useState<MediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Handle the case where items might be a Promise
    const processItems = async () => {
      if (!items) return;
      
      setIsProcessing(true);
      try {
        if (items instanceof Promise) {
          console.warn("MediaList received a Promise instead of MediaItem array, resolving...");
          const resolvedItems = await items;
          setProcessedItems(resolvedItems);
        } else {
          setProcessedItems(items);
        }
      } catch (error) {
        console.error("Error processing MediaList items:", error);
        setProcessedItems([]);
      } finally {
        setIsProcessing(false);
      }
    };
    
    processItems();
  }, [items]);

  // Check if we need to show scroll arrows
  useEffect(() => {
    if (layout === 'carousel' && carouselRef.current) {
      const carouselElement = carouselRef.current;
      const checkScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = carouselElement;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      };
      // Defer initial read to avoid forced reflow after items render
      const raf = requestAnimationFrame(checkScroll);
      carouselElement.addEventListener('scroll', checkScroll, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        carouselElement.removeEventListener('scroll', checkScroll);
      };
    }
  }, [layout, processedItems]);

  // Handle arrow click for carousel scroll
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const scrollAmount = carouselRef.current.clientWidth * 0.75;
    const scrollTo = direction === 'left' 
      ? carouselRef.current.scrollLeft - scrollAmount
      : carouselRef.current.scrollLeft + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    });
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900/50 rounded-lg">
        <p className="text-red-400 mb-4">Failed to load content</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  // Loading state
  if (isLoading || isProcessing) {
    return <MediaListSkeleton count={layout === 'grid' ? 12 : 8} layout={layout} />;
  }

  // Empty state
  if (!processedItems || processedItems.length === 0) {
    return <p className="text-gray-400 p-4">No items to display.</p>;
  }

  // Grid layout
  if (layout === 'grid') {
    return (
      <div 
        aria-label={listTitle}
        className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      >
        {processedItems.map((item, index) => (
          item && item.id && item.media_type ? (
            <MediaCard 
              key={`${item.media_type}-${item.id}`} 
              item={item} 
              priority={index < 2} // Keep eager loading minimal to protect LCP and bandwidth
            />
          ) : null
        ))}
      </div>
    );
  }

  // Carousel layout
  return (    <div className="relative group">      <div
        ref={carouselRef}
        aria-label={listTitle}
        className="flex overflow-x-auto pb-4 space-x-3 scrollbar-hide scroll-smooth pr-10 sm:pr-20 md:pr-24"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x proximity' }}
      >{processedItems.map((item, index) => (          item && item.id && item.media_type ? (            <div
              key={`${item.media_type}-${item.id}`}
              className="flex-none w-[142px] sm:w-[200px] transition-all duration-300"
              style={{ scrollSnapAlign: 'start' }}
            >
              <MediaCard item={item} priority={index < 1} />
            </div>
          ) : null
        ))}
      </div>

      {/* Carousel navigation arrows */}
      {showLeftArrow && (
        <button 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full hover:bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scrollCarousel('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
      )}
      
      {showRightArrow && (
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full hover:bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scrollCarousel('right')}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      )}
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute right-0 top-0 bottom-4 w-16 sm:w-20 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none z-10 opacity-70 transition-opacity duration-300" />
    </div>
  );
};

export default MediaList;