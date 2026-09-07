"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Play } from "lucide-react"; 

// Lazy load both PlyrTrailer and Plyr to reduce initial bundle size
const PlyrTrailer = dynamic(() => import("./PlyrTrailerLazy").catch(() => import("./PlyrTrailer")), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-t-red-600 border-r-transparent border-b-red-600 border-l-transparent rounded-full animate-spin"></div>
        <p className="text-white mt-4 font-medium">Loading trailer...</p>
      </div>
    </div>
  )
});

interface TrailerButtonProps {
  trailerKey: string;
  trailerName?: string;
}

const TrailerButton: React.FC<TrailerButtonProps> = ({ trailerKey, trailerName }) => {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowTrailer(!showTrailer)}
        className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-gradient-to-r from-red-600 to-red-700 text-white font-medium shadow-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
        aria-label="Watch Trailer"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        <Play size={16} className="relative z-10 fill-white" />
        <span className="relative z-10 text-sm font-semibold tracking-wide">Watch Trailer</span>
      </button>      
      {showTrailer && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 md:p-8" onClick={() => setShowTrailer(false)}>
          <div 
            className="relative w-full max-w-5xl" 
            onClick={e => e.stopPropagation()} 
            style={{
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.2)'
            }}
          >
            {/* Custom shaped close button */}
            <button 
              onClick={() => setShowTrailer(false)}
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors z-30 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full w-8 h-8"
              aria-label="Close trailer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <PlyrTrailer trailerKey={trailerKey} trailerName={trailerName || 'Movie Trailer'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailerButton;
