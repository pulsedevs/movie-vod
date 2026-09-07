'use client';

import React from 'react';

interface SourceSelectorProps {
  sources: any[];
  selectedSourceIndex: number;
  onSourceSelect: (index: number) => void;
  mediaType: string;
  mediaId: string;
}

// Lightweight source selector component
const SourceSelector: React.FC<SourceSelectorProps> = ({
  sources,
  selectedSourceIndex,
  onSourceSelect,
  mediaType,
  mediaId
}) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Choose Server</h3>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const isPremium = source.premium || false;
          const displayName = source.name || `Server ${index + 1}`;
          
          return (
            <button
              key={index}
              onClick={() => onSourceSelect(index)}
              className={`
                flex-shrink-0 px-3 py-2 rounded transition-all duration-300 relative overflow-hidden
                ${selectedSourceIndex === index 
                  ? isPremium
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/50 ring-2 ring-yellow-300/50 scale-105 relative z-10' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 relative z-10'
                  : isPremium
                    ? 'bg-gradient-to-r from-amber-600/70 via-orange-600/70 to-yellow-600/70 backdrop-blur-sm border border-amber-400/40 hover:border-orange-400/60 text-amber-100 hover:text-white hover:from-amber-500/80 hover:via-orange-500/80 hover:to-yellow-500/80'
                    : 'bg-gray-800/70 backdrop-blur-sm border border-white/10 hover:border-blue-400/30 text-gray-300 hover:text-white hover:bg-gray-700/80'}
                ${process.env.NODE_ENV === 'development' && process.env[`NEXT_PUBLIC_STREAM_SOURCE_OVERRIDE_${mediaType.toUpperCase()}_${mediaId}`] === index.toString() 
                  ? 'ring-2 ring-yellow-500' : ''}
              `}
            >
              {/* Premium sparkle effect */}
              {isPremium && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
              )}
              
              <div className="flex items-center gap-1 whitespace-nowrap relative z-10">
                {isPremium ? (
                  // Crown icon for premium sources
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-yellow-300">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Play icon for regular sources
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                )}
                
                <span className="text-xs font-medium">
                  {displayName}
                  {isPremium && <span className="ml-0.5 text-[8px] font-bold px-0.5 py-0.5 bg-green-500 text-white rounded-full animate-pulse">⚡</span>}
                  {process.env.NODE_ENV === 'development' && 
                   process.env[`NEXT_PUBLIC_STREAM_SOURCE_OVERRIDE_${mediaType.toUpperCase()}_${mediaId}`] === index.toString() && 
                   <span className="ml-0.5 text-[6px] font-bold px-0.5 py-0.5 bg-yellow-500 text-black rounded-full">ENV</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SourceSelector;
