// src/components/tv/EpisodeList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Episode, TvSeasonDetailsResponse } from '@/types';
import EpisodeItem from './EpisodeItem'; // We'll create this

interface EpisodeListProps {
  tvId: string | number;
  seasonNumber: number;
  onPlayEpisode: (seasonNum: number, episodeNum: number) => void; // Callback to parent
}

// Fetch function specific to season details using server-side API
async function getSeasonData(tvId: string | number, seasonNumber: number): Promise<TvSeasonDetailsResponse | null> {
    const url = `/api/tv/season?tvId=${tvId}&seasonNumber=${seasonNumber}`;
    try {
        console.log(`Fetching season details from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`API Error fetching season ${seasonNumber}: ${res.status} ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error(`Workspace Error for season ${seasonNumber}:`, error);
        return null;
    }
}


const EpisodeList: React.FC<EpisodeListProps> = ({ tvId, seasonNumber, onPlayEpisode }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch episodes when tvId or seasonNumber changes
    const fetchEpisodes = async () => {
      if (!tvId || seasonNumber === null) return;

      setIsLoading(true);
      setError(null);
      setEpisodes([]); // Clear previous episodes

      const seasonData = await getSeasonData(tvId, seasonNumber);

      if (seasonData && seasonData.episodes) {
        setEpisodes(seasonData.episodes);
      } else {
        setError('Could not load episodes for this season.');
      }
      setIsLoading(false);
    };

    fetchEpisodes();
  }, [tvId, seasonNumber]); // Dependency array

  if (isLoading) {
    return <div className="text-center p-4">Loading episodes...</div>; // Simple loader
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (episodes.length === 0) {
     return <div className="text-center p-4 text-gray-500">No episodes found for this season.</div>;
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
      <h3 className="text-lg font-semibold mb-3 md:col-span-2">Episodes</h3>
      {episodes.map((episode) => (
        <EpisodeItem
          key={episode.id}
          episode={episode}
          // Pass necessary info for playing this specific episode
          onPlayClick={() => onPlayEpisode(seasonNumber, episode.episode_number)}
        />
      ))}
    </div>
  );
};

export default EpisodeList;