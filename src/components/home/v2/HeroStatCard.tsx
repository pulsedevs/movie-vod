'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { NavTheme } from './navThemes';
import { v2Transition } from '@/utils/v2Transitions';
import {
  HERO_STAT_CARD_CLASS,
  HERO_STAT_LABEL_CLASS,
  HERO_STAT_VALUE_CLASS,
} from '@/utils/v2Layout';

export type HeroStatVariant = 'count' | 'shimmer';

export interface HeroStatConfig {
  numericValue?: number;
  displayValue: string;
  label: string;
  theme: NavTheme;
  variant: HeroStatVariant;
}

interface HeroStatCardProps extends HeroStatConfig {
  index: number;
  reducedMotion: boolean;
}

function useCountUp(end: number, durationMs: number, enabled: boolean) {
  const [value, setValue] = useState(enabled ? 0 : end);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [end, durationMs, enabled]);

  return value.toLocaleString();
}

export default function HeroStatCard({
  numericValue,
  displayValue,
  label,
  theme,
  variant,
  index,
  reducedMotion,
}: HeroStatCardProps) {
  const countEnabled = variant === 'count' && typeof numericValue === 'number';
  const counted = useCountUp(numericValue ?? 0, 1800 + index * 200, countEnabled && !reducedMotion);
  const glowDelay = `${index * 0.9}s`;

  return (
    <motion.div
      className={[
        HERO_STAT_CARD_CLASS,
        'group relative overflow-hidden transition-[transform,box-shadow,border-color] duration-300',
        'hover:-translate-y-0.5',
        reducedMotion ? '' : 'md:animate-[hero-stat-glow_4.2s_ease-in-out_infinite]',
      ].join(' ')}
      style={{
        borderColor: `${theme.icon}44`,
        background: `linear-gradient(145deg, ${theme.bgRest}, rgba(255,255,255,0.02))`,
        animationDelay: reducedMotion ? undefined : glowDelay,
        ['--stat-glow' as string]: `${theme.icon}33`,
        ['--stat-glow-strong' as string]: `${theme.icon}55`,
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={v2Transition(0.45, 0.12 + index * 0.1, reducedMotion)}
      whileHover={reducedMotion ? undefined : { y: -2 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${theme.icon}22, transparent 68%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full blur-xl opacity-40 transition-opacity duration-300 group-hover:opacity-70"
        style={{ backgroundColor: theme.icon }}
      />

      <p className={`${HERO_STAT_VALUE_CLASS} relative z-[1]`}>
        {variant === 'count' ? (
          <span style={{ color: theme.label }}>{counted}</span>
        ) : (
          <span
            className={reducedMotion ? '' : 'hero-stat-shimmer-text'}
            style={
              reducedMotion
                ? { color: theme.label }
                : ({
                    ['--stat-shimmer-from' as string]: theme.label,
                    ['--stat-shimmer-mid' as string]: '#FFF9F3',
                    ['--stat-shimmer-to' as string]: theme.iconActive,
                  } as CSSProperties)
            }
          >
            {displayValue}
          </span>
        )}
      </p>
      <p
        className={`${HERO_STAT_LABEL_CLASS} relative z-[1] transition-colors duration-300 group-hover:text-zinc-400`}
        style={{ color: `${theme.label}99` }}
      >
        {label}
      </p>
    </motion.div>
  );
}
