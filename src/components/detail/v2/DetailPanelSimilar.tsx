'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MediaItem } from '@/types';
import MediaCard from '@/components/media/MediaCard';
import { DETAIL_PANEL_GRID_CLASS } from '@/components/home/v2/browse/browseV2Grid';
import { V2_DURATION, v2Transition } from '@/utils/v2Transitions';

interface DetailPanelSimilarProps {
  mediaType: 'movie' | 'tv';
  mediaId: string;
}

const SIMILAR_LIMIT = 12;

function SimilarGridSkeleton() {
  return (
    <div className={DETAIL_PANEL_GRID_CLASS}>
      {Array.from({ length: SIMILAR_LIMIT }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full animate-pulse rounded-md bg-white/[0.06]"
        />
      ))}
    </div>
  );
}

export default function DetailPanelSimilar({ mediaType, mediaId }: DetailPanelSimilarProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/similar?mediaType=${mediaType}&id=${mediaId}&limit=${SIMILAR_LIMIT}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setItems(data.results || []);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mediaType, mediaId]);

  if (!loading && items.length === 0) return null;

  const label = mediaType === 'movie' ? 'Similar movies' : 'Similar shows';

  return (
    <motion.section
      className="mt-2.5 border-t border-white/[0.06] pt-2.5"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={v2Transition(V2_DURATION.panel, 0.28, reducedMotion ?? false)}
    >
      <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </h3>

      {loading ? (
        <SimilarGridSkeleton />
      ) : (
        <div className={DETAIL_PANEL_GRID_CLASS}>
          {items.map((item, index) => (
            <motion.div
              key={`${item.media_type}-${item.id}`}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={v2Transition(0.28, 0.32 + index * 0.03, reducedMotion ?? false)}
            >
              <MediaCard item={item} mini />
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
