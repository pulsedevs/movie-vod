'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { MediaItem } from '@/types';
import { navThemes } from './navThemes';
import { v2Transition } from '@/utils/v2Transitions';
import {
  HERO_POSTER_FAN_BOX_CLASS,
  HERO_POSTER_FAN_SCALE_CLASS,
  HERO_POSTER_FAN_VISIBILITY_CLASS,
  HERO_POSTER_H,
  HERO_POSTER_W,
} from '@/utils/v2Layout';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';
const CENTER_SLOT = 1;
/** Paint side cards first, center last so straight poster always wins stacking */
const RENDER_ORDER = [0, 2, 1] as const;
const FLOAT_UP_PX = 6;
const FLOAT_DOWN_PX = 4;

type SlotPose = { x: number; y: number; rot: number; z: number };

const STACK_LAYOUT = {
  left: {
    slots: [
      { x: -50, y: 16, rot: -15, z: 10 },
      { x: -11, y: 5, rot: 0, z: 50 },
      { x: 18, y: 16, rot: 15, z: 10 },
    ] satisfies SlotPose[],
    justify: 'justify-end',
    entranceX: -24,
    theme: navThemes.movies,
  },
  right: {
    slots: [
      { x: -18, y: 16, rot: -15, z: 10 },
      { x: 11, y: 5, rot: 0, z: 50 },
      { x: 50, y: 16, rot: 15, z: 10 },
    ] satisfies SlotPose[],
    justify: 'justify-start',
    entranceX: 24,
    theme: navThemes.tv,
  },
} as const;

function itemKey(item: MediaItem): string {
  return `${item.media_type}-${item.id}`;
}

function pickStackPosters(pool: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  const picked: MediaItem[] = [];

  for (const item of pool) {
    if (!item.poster_path) continue;
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(item);
    if (picked.length === 3) break;
  }

  return picked;
}

function posterSrc(item: MediaItem): string {
  return `${TMDB_IMAGE_BASE}${item.poster_path}`;
}

function posterAlt(item: MediaItem): string {
  return item.media_type === 'movie' ? item.title || 'Poster' : item.name || 'Poster';
}

function PosterFrame({ item, priority }: { item: MediaItem; priority?: boolean }) {
  return (
    <div className="h-[204px] w-[136px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <Image
        src={posterSrc(item)}
        alt={posterAlt(item)}
        width={HERO_POSTER_W}
        height={HERO_POSTER_H}
        className="block h-full w-full object-cover"
        sizes="136px"
        priority={priority}
        loading={priority ? undefined : 'lazy'}
      />
    </div>
  );
}

interface HomePosterFanStackProps {
  pool: MediaItem[];
  side: 'left' | 'right';
  mediaHref: (item: MediaItem) => string;
  showOnMobile?: boolean;
}

export default function HomePosterFanStack({ pool, side, mediaHref, showOnMobile = false }: HomePosterFanStackProps) {
  const reducedMotion = useReducedMotion();
  const layout = STACK_LAYOUT[side];
  const [slots, setSlots] = useState<MediaItem[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setSlots(pickStackPosters(pool));
  }, [pool]);

  if (slots.length === 0) return null;

  return (
    <div
      className={`pointer-events-none relative z-[5] shrink-0 items-center ${HERO_POSTER_FAN_BOX_CLASS} ${HERO_POSTER_FAN_SCALE_CLASS} ${showOnMobile ? 'flex' : HERO_POSTER_FAN_VISIBILITY_CLASS} ${layout.justify}`}
    >
      {RENDER_ORDER.map((index) => {
        const item = slots[index];
        if (!item) return null;

        const pose = layout.slots[index] ?? layout.slots[CENTER_SLOT];
        const isCenter = index === CENTER_SLOT;
        const isHovered = !showOnMobile && hoveredIndex === index;
        const isAnyHovered = !showOnMobile && hoveredIndex !== null;

        let x = pose.x;
        let rotate = pose.rot;
        let yBase = pose.y;
        let scale = 1;
        let zIndex = pose.z;

        if (!showOnMobile) {
          if (isHovered) {
            rotate = isCenter ? 0 : pose.rot * 0.7;
            yBase -= 2;
            scale = isCenter ? 1.04 : 1.02;
            zIndex = 60;
          } else if (hoveredIndex === CENTER_SLOT && !isCenter) {
            x += index === 0 ? -6 : 6;
          }
        }

        return (
          <motion.div
            key={`${side}-slot-${index}-${itemKey(item)}`}
            className="pointer-events-auto absolute left-1/2"
            style={{ zIndex, transformOrigin: 'center bottom', marginLeft: -HERO_POSTER_W / 2 }}
            initial={
              reducedMotion
                ? { x: pose.x, y: yBase, rotate: pose.rot, scale: 1 }
                : {
                    opacity: 0,
                    x: pose.x + layout.entranceX,
                    y: yBase + 12,
                    rotate: pose.rot,
                    scale: 0.94,
                  }
            }
            animate={{
              opacity: 1,
              x,
              y: yBase,
              rotate,
              scale,
            }}
            transition={{
              opacity: v2Transition(0.42, 0.08 + index * 0.06, reducedMotion ?? false),
              x: { type: 'spring', stiffness: 220, damping: 22, mass: 0.8 },
              rotate: { type: 'spring', stiffness: 200, damping: 20, mass: 0.85 },
              scale: { type: 'spring', stiffness: 220, damping: 20, mass: 0.8 },
              y: { duration: 0 },
            }}
            onHoverStart={showOnMobile ? undefined : () => setHoveredIndex(index)}
            onHoverEnd={showOnMobile ? undefined : () => setHoveredIndex(null)}
          >
            {/* CSS float — runs on GPU compositor, zero JS cost */}
            <div
              className={
                reducedMotion || isAnyHovered
                  ? undefined
                  : `poster-float poster-float-delay-${index}`
              }
            >
              <Link
                href={mediaHref(item)}
                className="block transition-[filter] duration-300"
                style={{
                  filter: (!showOnMobile && isHovered) ? `drop-shadow(0 14px 28px ${layout.theme.icon}66)` : undefined,
                }}
              >
                <PosterFrame item={item} priority={isCenter} />
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
