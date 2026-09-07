'use client';

import { useCallback, useMemo } from 'react';
import { X, Calendar, Clock, Info, Play } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the trailer player
const PlyrTrailer = dynamic(() => import('../movie/PlyrTrailerLazy').catch(() => import('../movie/PlyrTrailer')), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full bg-gray-800 rounded-lg" style={{ paddingBottom: '56.25%', position: 'relative' }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="text-white mt-2 font-medium text-xs">Loading...</p>
      </div>
    </div>
  )
});

interface ReleaseStatusDialogProps {
  title: string;
  releaseDate: string;
  isMovie?: boolean;
  posterUrl?: string;
  overview?: string;
  trailerId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReleaseStatusDialog({
  title,
  releaseDate,
  isMovie = true,
  posterUrl,
  overview,
  trailerId,
  isOpen,
  onClose
}: ReleaseStatusDialogProps) {
  const formatReleaseDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  const timeUntilRelease = useMemo(() => {
    try {
      const release = new Date(releaseDate);
      const now = new Date();
      const diffTime = release.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Recently released';
      if (diffDays === 0) return 'Releases today';
      if (diffDays === 1) return 'Releases tomorrow';
      if (diffDays < 30) return `Releases in ${diffDays} days`;
      if (diffDays < 365) {
        const months = Math.ceil(diffDays / 30);
        return `Releases in ${months} month${months > 1 ? 's' : ''}`;
      }
      const years = Math.ceil(diffDays / 365);
      return `Releases in ${years} year${years > 1 ? 's' : ''}`;
    } catch {
      return 'Release date pending';
    }
  }, [releaseDate]);

  const formattedDate = useMemo(() => formatReleaseDate(releaseDate), [releaseDate, formatReleaseDate]);

  if (!isOpen) return null;  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md sm:max-w-lg bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden max-h-[95vh] sm:max-h-[85vh] mx-auto">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} className="text-white" />
          </button>

          {/* Compact header with release info */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 border-b border-gray-700">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base sm:text-lg font-bold text-white mb-2 leading-tight line-clamp-2 max-w-full">
                {title}
              </h2>
              
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                  <Clock size={12} className="text-yellow-400 mr-1" />
                  <span className="text-yellow-400 font-medium">Coming Soon</span>
                </div>
                
                <div className="flex items-center text-gray-300">
                  <Calendar size={12} className="mr-1" />
                  <span>{formattedDate}</span>
                </div>
                
                <span className="text-blue-400 font-medium">
                  {timeUntilRelease}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">          {/* Compact Trailer Section */}
          {trailerId ? (
            <div className="mb-3">
              <div className="rounded-lg overflow-hidden bg-black">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
                  <div className="absolute inset-0">
                    <PlyrTrailer 
                      trailerKey={trailerId} 
                      trailerName={`${title} - Official Trailer`} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback to compact overview if no trailer */
            overview && (
              <div className="mb-3">
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3 text-center">
                  {overview}
                </p>
              </div>
            )          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors text-xs sm:text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
