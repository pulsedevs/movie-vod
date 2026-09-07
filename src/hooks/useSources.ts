import { useState, useEffect } from 'react';
import { StreamSource } from '@/types';

// Client-side sources hook
export function useSources() {
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch sources from our API endpoint
        const response = await fetch('/api/sources');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setSources(data.sources || []);
      } catch (err) {
        console.error('Error fetching sources:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sources');
        // Fallback: create a basic source structure
        setSources([
          {
            name: 'Source 1',
            baseUrls: {
              movie: process.env.NEXT_PUBLIC_FALLBACK_MOVIE_BASE || '',
              tv: process.env.NEXT_PUBLIC_FALLBACK_TV_BASE || ''
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  return { sources, loading, error };
}
