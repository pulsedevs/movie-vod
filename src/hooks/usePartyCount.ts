'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchParty } from '@/hooks/useWatchParty';

export const usePartyCount = () => {
  const { user } = useAuth();
  const { getUserParties } = useWatchParty();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) {
        setCount(0);
        return;
      }

      try {
        setLoading(true);
        const parties = await getUserParties();
        setCount(parties.length);
      } catch (error) {
        console.error('Error fetching party count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [user, getUserParties]);

  return { count, loading };
};
