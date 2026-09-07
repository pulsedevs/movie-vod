'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MediaItem } from '@/types';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import { useDetailHref } from '@/hooks/useDetailHref';
import { Play, Star, Sparkles, Clock, Check, List, X, MoreVertical } from 'lucide-react';
import { useToast } from '@/components/ui/toast';


interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  toastMessage?: string;
}

interface MediaCardProps {
  item: MediaItem;
  priority?: boolean;
  onClick?: () => void;
  customActions?: ActionItem[];
  compact?: boolean;
  /** Smaller than compact — for detail sidebar similar grid */
  mini?: boolean;
  /** Lightweight thumbnail for search dropdowns (all viewports). */
  searchResult?: boolean;
  /** Render compact/mini styling on mobile too (e.g. search dropdown). */
  alwaysDense?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({ 
  item, 
  priority = false, 
  onClick,
  customActions,
  compact = false,
  mini = false,
  searchResult = false,
  alwaysDense = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const { mediaHref } = useDetailHref();
  const { showToast } = useToast();

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth < 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Ensure item is not a Promise
  if (!item || item instanceof Promise) {
    console.error("MediaCard received a Promise or undefined instead of MediaItem");
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm aspect-[2/3] w-full animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm font-medium">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const title = item.media_type === 'movie' ? item.title : item.name;
  const releaseDate = item.media_type === 'movie' ? item.release_date : item.first_air_date;
  
  const linkUrl = mediaHref(item);
    
  const year = releaseDate ? releaseDate.substring(0, 4) : 'N/A';
  
  const imageUrl = item.poster_path && !imageError
    ? `${TMDB_IMAGE_BASE_URL}${mini ? 'w92' : searchResult || compact ? 'w185' : 'w342'}${item.poster_path}`
    : '/images/placeholder-poster.png';
    
  // Enhanced rating calculation and visualization
  const rating = item.vote_average ? Math.round(item.vote_average * 10) : null;
  const getRatingColor = () => {
    if (!rating) return 'from-gray-600 to-gray-700';
    if (rating >= 75) return 'from-emerald-500 to-green-600';
    if (rating >= 60) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  // Calculate if this is a new release (within the last 60 days for more visibility)
  const isNew = releaseDate && new Date(releaseDate) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 60);

  const handleActionsToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };
  
  const handleActionClick = (e: React.MouseEvent, action: ActionItem) => {
    e.preventDefault();
    e.stopPropagation();
    action.onClick();
    setShowActions(false);
    if (action.toastMessage) showToast(action.toastMessage, 'success');
  };

  // Compact / mini / search cards for dense v2 grids and search dropdowns.
  if ((compact || mini || searchResult) && (!isMobileViewport || searchResult || alwaysDense)) {
    return (
      <div className="relative group cursor-pointer" onClick={onClick}>
        <Link
          href={linkUrl}
          className={`block relative overflow-hidden bg-gray-900 shadow-sm transition-transform ${
            mini ? 'rounded-md hover:scale-[1.02]' : 'rounded-lg hover:scale-[1.03]'
          }`}
          aria-label={`View details for ${title || 'Untitled'}`}
        >
          {rating && (
            <div
              className={`absolute z-20 bg-gradient-to-r ${getRatingColor()} text-white font-bold rounded ${
                mini
                  ? 'top-0.5 right-0.5 px-0.5 py-px text-[7px]'
                  : searchResult
                    ? 'top-1 right-1 px-1 py-0.5 text-[9px]'
                    : 'top-1 right-1 px-1 py-0.5 text-[8px]'
              }`}
            >
              {rating}%
            </div>
          )}
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={title ? `${title} poster` : 'Poster'}
              fill
              sizes={mini ? '80px' : searchResult ? '128px' : '120px'}
              className="object-cover"
              priority={priority}
              quality={mini ? 50 : searchResult ? 62 : 60}
              onError={() => setImageError(true)}
              loading={priority ? 'eager' : 'lazy'}
            />
          </div>
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent ${
              mini ? 'px-0.5 py-0.5' : searchResult ? 'px-1.5 py-1' : 'px-1 py-1'
            }`}
          >
            <p
              className={`text-white/90 font-medium truncate leading-tight ${
                mini ? 'text-[7px]' : searchResult ? 'text-[10px]' : 'text-[9px]'
              }`}
            >
              {title}
            </p>
            {!mini && <p className={searchResult ? 'text-[9px] text-white/50' : 'text-[8px] text-white/50'}>{year}</p>}
          </div>
        </Link>

        {customActions && customActions.length > 0 && !mini && !searchResult && (
          <div className="absolute top-1 right-1 z-20">
            <button
              onClick={handleActionsToggle}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-black/70"
              aria-label="Toggle actions"
            >
              <MoreVertical className="w-3.5 h-3.5 text-white" />
            </button>
            {showActions && (
              <div className="absolute top-full right-0 mt-1 w-[148px] rounded-xl border border-white/[0.10] bg-[#161616]/95 backdrop-blur-md shadow-2xl overflow-hidden z-30">
                {customActions.map((action, index) => (
                  <button
                    key={`action-${index}`}
                    onClick={(e) => handleActionClick(e, action)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] font-medium text-left text-white/90 hover:bg-white/[0.07] transition-colors"
                  >
                    {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Lightweight mobile render to reduce initial DOM/style calculation cost.
  if (isMobileViewport) {
    return (
      <div className="relative group cursor-pointer" onClick={onClick}>
        <Link
          href={linkUrl}
          className="block relative overflow-hidden rounded-xl bg-gray-900 shadow-sm active:scale-[0.99] transition-transform"
          aria-label={`View details for ${title || 'Untitled'} (${item.media_type === 'movie' ? 'Movie' : 'TV Show'})`}
        >
          {rating && (
            <div className={`absolute top-1 right-1 z-20 px-1.5 py-0.5 bg-gradient-to-r ${getRatingColor()} text-white text-[9px] font-bold rounded`}>
              {rating}%
            </div>
          )}

          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={title ? `${title} poster` : `${item.media_type} poster`}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 768px) 30vw, 22vw"
              className="object-cover"
              priority={priority}
              quality={65}
              onError={() => setImageError(true)}
              loading={priority ? 'eager' : 'lazy'}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-1">
            <div className="flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold bg-black/70 px-1 py-0.5 rounded">{year}</span>
                <span className="text-white font-semibold bg-black/70 px-1 py-0.5 rounded">
                  {item.media_type === 'movie' ? 'Movie' : 'TV'}
                </span>
              </div>
              {rating && (
                <span className="text-white font-semibold">{(item.vote_average || 0).toFixed(1)}</span>
              )}
            </div>
          </div>
        </Link>

        {customActions && customActions.length > 0 && (
          <div className="absolute top-1 right-1 z-20">
            <button
              onClick={handleActionsToggle}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-black/70"
              aria-label="Toggle actions"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            {showActions && (
              <div className="absolute top-full right-0 mt-1 bg-gray-900/95 border border-gray-700/50 rounded-lg shadow-xl overflow-hidden z-30">
                {customActions.map((action, index) => (
                  <button
                    key={`action-${index}`}
                    onClick={(e) => handleActionClick(e, action)}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-white hover:bg-blue-600/20 transition-colors"
                  >
                    {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <Link 
        href={linkUrl}
        className="block relative overflow-hidden rounded-xl transition-all duration-500 ease-out bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-blue-500/20 group transform hover:md:-translate-y-1 hover:md:scale-102 active:scale-98"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
        aria-label={`View details for ${title || 'Untitled'} (${item.media_type === 'movie' ? 'Movie' : 'TV Show'})`}
      >
        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
            {/* Enhanced rating badge */}
        {rating && (          <div className={`absolute top-1 right-1 md:top-2 md:right-2 z-20 flex items-center gap-0.5 px-1 py-0.5 md:px-2 md:py-1 bg-gradient-to-r ${getRatingColor()} rounded-full shadow-lg backdrop-blur-sm border border-white/20`}>            <Star className="w-2.5 h-2.5 md:w-2.5 md:h-2.5 text-white fill-current" />
            <span className="text-white font-bold text-[9px] md:text-xs">{rating}%</span>
          </div>
        )}
        
        {/* Main poster container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900">
          {/* Hover overlay - simplified to only contain play button area */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-10 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Poster image */}
          <Image
            src={imageUrl}
            alt={title ? `${title} poster` : `${item.media_type} poster`}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, (max-width: 1280px) 18vw, 15vw"
            className={`object-cover transition-all duration-700 ease-out ${
              isHovered 
                ? 'scale-110 brightness-110 contrast-110 saturate-110' 
                : 'scale-100 brightness-100 contrast-100 saturate-100'
            }`}
            priority={priority}
            quality={65}
            onError={() => setImageError(true)}
            loading={priority ? "eager" : "lazy"}
          />
          
          {/* Subtle gradient overlay always present */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        
        {/* Enhanced play button with pulsing animation - ONLY THING IN HOVER STATE */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}>
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
            
            {/* Main play button - responsive sizing */}            <div className="relative w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl border-2 border-blue-400/50 backdrop-blur-sm transform transition-transform duration-300 hover:scale-110 active:scale-95">
              <Play className="h-3 w-3 md:h-5 md:w-5 text-white ml-0.5 fill-current" />
            </div>
          </div>
        </div>
        
        {/* Bottom info - always visible with media type and rating */}
        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
          isHovered ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}>
          {/* Gradient overlay */}          <div className="bg-gradient-to-t from-black/90 via-black/70 to-black/20 p-1 md:p-1.5">
            <div className="flex items-center justify-between text-[9px] md:text-xs">
              <div className="flex items-center gap-1 md:gap-1.5">
                <span className="text-white font-semibold bg-black/70 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                  {year}
                </span>
                <span className="text-white font-semibold bg-black/70 backdrop-blur-sm px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-xs">
                  {item.media_type === 'movie' ? 'Movie' : 'TV'}
                </span>
              </div>
              {rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 md:w-2.5 md:h-2.5 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold text-[9px] md:text-xs">{(item.vote_average || 0).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      
        {/* Toggle button for actions - only show when custom actions are available */}
      {customActions && customActions.length > 0 && (
        <div className="absolute top-1 right-1 md:top-2 md:right-2 z-20">
          <button
            onClick={handleActionsToggle}
            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 ease-in-out bg-black/60 hover:bg-black/70 active:bg-black/80 shadow-md"
            aria-label="Toggle actions"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
          
          {/* Custom Actions Dropdown */}
          {showActions && (
            <div className="absolute top-full right-0 mt-1 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-xl overflow-hidden z-30">
              {customActions.map((action, index) => (
                <button
                  key={`action-${index}`}
                  onClick={(e) => handleActionClick(e, action)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-white hover:bg-blue-600/20 transition-colors"
                >
                  {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaCard;