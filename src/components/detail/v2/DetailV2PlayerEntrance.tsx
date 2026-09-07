'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { V2_DURATION, v2Transition } from '@/utils/v2Transitions';

interface DetailV2PlayerEntranceProps {
  children: React.ReactNode;
}

/** Staggered reveal for the player block when entering a detail page in the v2 shell. */
export default function DetailV2PlayerEntrance({ children }: DetailV2PlayerEntranceProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={v2Transition(V2_DURATION.player, 0.12, reducedMotion ?? false)}
      className="relative w-full origin-top"
    >
      {children}
    </motion.div>
  );
}
