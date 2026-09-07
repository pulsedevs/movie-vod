'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { V2_DURATION, v2Transition } from '@/utils/v2Transitions';

interface DetailV2MetadataEntranceProps {
  children: React.ReactNode;
}

export default function DetailV2MetadataEntrance({ children }: DetailV2MetadataEntranceProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={v2Transition(V2_DURATION.main, 0.22, reducedMotion ?? false)}
    >
      {children}
    </motion.div>
  );
}
