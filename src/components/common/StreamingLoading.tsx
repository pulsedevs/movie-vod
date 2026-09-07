'use client';

interface StreamingLoadingProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function StreamingLoading({ 
  title = "Loading Streaming Sources", 
  subtitle = "Preparing your viewing experience...",
  className = ""
}: StreamingLoadingProps) {
  return (
    <div className={`flex justify-center items-center min-h-[200px] ${className}`}>
      <div className="text-center space-y-4">
        {/* Modern spinner with film reel aesthetic */}
        <div className="relative mx-auto">
          <div className="w-12 h-12 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-1 w-10 h-10 border-4 border-transparent border-b-purple-500 border-l-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// Predefined variants for common use cases
export const StreamingSourcesLoading = () => (
  <StreamingLoading 
    title="Loading Streaming Sources" 
    subtitle="Preparing your viewing experience..." 
  />
);

export const MoviePlayerLoading = () => (
  <StreamingLoading 
    title="Loading Movie Player" 
    subtitle="Preparing streaming interface..." 
    className="player-aspect-shell"
  />
);

export const EpisodesLoading = () => (
  <StreamingLoading 
    title="Loading Episodes" 
    subtitle="Preparing season browser..." 
    className="player-aspect-shell"
  />
);

export const SearchLoading = () => (
  <StreamingLoading 
    title="Searching..." 
    subtitle="Finding your content..." 
  />
);
