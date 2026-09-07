// src/components/tv/SeasonTabs.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Season } from '@/types';

interface SeasonTabsProps {
  seasons: Season[];
  selectedSeasonNumber: number | null;
  onSeasonSelect: (seasonNumber: number) => void;
  episodesPerSeason: { [seasonNumber: number]: number }; // New prop for episode counts
  onEpisodeSelect: (episodeNumber: number) => void; // Callback for episode selection
}

const SeasonTabs: React.FC<SeasonTabsProps> = ({
  seasons = [],
  selectedSeasonNumber,
  onSeasonSelect,
  episodesPerSeason,
  onEpisodeSelect,
}) => {
  const displaySeasons = seasons.filter((s) => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);

  const [episodeNumbers, setEpisodeNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (selectedSeasonNumber && episodesPerSeason[selectedSeasonNumber]) {
      setEpisodeNumbers(Array.from({ length: episodesPerSeason[selectedSeasonNumber] }, (_, i) => i + 1));
    } else {
      setEpisodeNumbers([]);
    }
  }, [selectedSeasonNumber, episodesPerSeason]);

  if (displaySeasons.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Season Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-4 overflow-x-auto pb-px" aria-label="Tabs">
          {displaySeasons.map((season) => (
            <button
              key={season.id || season.season_number}
              onClick={() => onSeasonSelect(season.season_number)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium transition-colors ${
                selectedSeasonNumber === season.season_number
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
              }`}
              aria-current={selectedSeasonNumber === season.season_number ? 'page' : undefined}
            >
              {`Season ${season.season_number}`}
            </button>
          ))}
        </nav>
      </div>

      {/* Episode Buttons */}
      {episodeNumbers.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {episodeNumbers.map((episodeNumber) => (
            <button
              key={episodeNumber}
              onClick={() => onEpisodeSelect(episodeNumber)}
              className="px-3 py-1 bg-gray-700 text-xs rounded-full text-white hover:bg-blue-600 transition-colors"
            >
              {episodeNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeasonTabs;