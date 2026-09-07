'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { V2_DURATION, V2_EASE, isDetailShellPath, v2Transition, V2_NAV_ORDER } from '@/utils/v2Transitions';
import { usePathname } from 'next/navigation';
import AndroidAppBanner from '@/components/promo/AndroidAppBanner';

interface V2MainColumnProps {
  children: React.ReactNode;
  columnKey: string;
}

const columnShellClass = [
  'v2-main-surface flex-1 min-w-0 h-full overflow-hidden relative',
  '[&_main]:max-w-none [&_main]:mx-0 [&_main]:mt-0 [&_main]:w-full',
  '[&_.min-h-screen]:min-h-0 [&_.bg-gray-900]:bg-transparent',
  '[&_.detail-v2-in-shell_.player-aspect-shell]:min-h-0',
  '[&_.detail-v2-in-shell_.player-aspect-shell]:aspect-video',
  '[&_.detail-v2-in-shell_.player-aspect-shell]:md:aspect-video',
  '[&_.detail-v2-in-shell_.player-aspect-shell]:md:h-auto',
  '[&_.detail-v2-in-shell_.player-aspect-shell]:md:max-h-[min(80vh,1000px)]',
].join(' ');

const arrowBase =
  'hidden md:flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-md active:scale-90';

const X_SLIDE = 32;

export default function V2MainColumn({ children, columnKey }: V2MainColumnProps) {
  const pathname = usePathname() ?? '';
  const reducedMotion = useReducedMotion();
  const enteringDetail = columnKey === 'v2-detail' || isDetailShellPath(pathname);

  // Track slide direction for horizontal tab transitions
  const prevKeyRef = useRef(columnKey);
  const directionRef = useRef<1 | -1>(1);
  if (prevKeyRef.current !== columnKey) {
    const prevIdx = V2_NAV_ORDER.indexOf(prevKeyRef.current);
    const nextIdx = V2_NAV_ORDER.indexOf(columnKey);
    if (prevIdx !== -1 && nextIdx !== -1) {
      directionRef.current = nextIdx >= prevIdx ? 1 : -1;
    }
    prevKeyRef.current = columnKey;
  }
  const isTabSwitch = !enteringDetail && V2_NAV_ORDER.includes(columnKey);
  const dir = directionRef.current;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 40);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 40);
  }, []);

  // Stable scroll listener — attached once to the stable outer div, never re-attached
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect(); };
  }, [updateArrows]);

  // Reset scroll position and arrow state when navigating to a new page
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // Defer the read until the next frame — reading layout props immediately after
    // writing scrollTop causes a forced synchronous reflow.
    const raf = requestAnimationFrame(updateArrows);
    return () => cancelAnimationFrame(raf);
  }, [columnKey, updateArrows]);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ top: dir * 380, behavior: 'smooth' });
  };

  const scrollClass = `h-full overflow-y-auto overflow-x-hidden scrollbar-hide ${
    enteringDetail ? 'pt-0' : 'pt-[66px]'
  } md:pt-0 pb-20 md:pb-0 [&_.detail-v2-in-shell]:min-h-0`;

  const mainTransition = v2Transition(V2_DURATION.main, 0, reducedMotion ?? false);

  const arrowTransition = { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const };

  return (
    <div className={columnShellClass}>
      {/* Stable scroll container — lives outside AnimatePresence so the scroll
          listener is never torn down and re-attached on navigation */}
      <div ref={scrollRef} className={scrollClass}>
        {/* Mobile only — on desktop the shell renders it above the content area
            so the floating Discord/Ads buttons never cover it */}
        <div className="md:hidden">
          <AndroidAppBanner />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={columnKey}
            initial={reducedMotion ? false : {
              opacity: 0,
              x: isTabSwitch ? X_SLIDE * dir : 0,
              y: isTabSwitch ? 0 : enteringDetail ? 20 : 6,
              scale: enteringDetail ? 0.97 : 1,
            }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 1 } : {
              opacity: 0,
              x: isTabSwitch ? -X_SLIDE * dir : 0,
              y: isTabSwitch ? 0 : enteringDetail ? -12 : -6,
              scale: 0.99,
            }}
            transition={mainTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Up arrow — top-right */}
      <AnimatePresence>
        {canScrollUp && (
          <motion.button
            key="up"
            className={`${arrowBase} absolute top-3 right-3 z-30`}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll up"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileHover={{
              scale: 1.12,
              boxShadow: '0 0 20px rgba(251,191,36,0.45), 0 0 8px rgba(251,191,36,0.25)',
              borderColor: 'rgba(251,191,36,0.7)',
            }}
            whileTap={{ scale: 0.88 }}
            transition={arrowTransition}
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.12) 100%)',
              border: '1px solid rgba(251,191,36,0.35)',
              boxShadow: '0 0 12px rgba(251,191,36,0.2), 0 2px 8px rgba(0,0,0,0.4)',
              color: 'rgba(253,230,138,0.9)',
            }}
          >
            <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Down arrow — bottom-right */}
      <AnimatePresence>
        {canScrollDown && (
          <motion.button
            key="down"
            className={`${arrowBase} absolute bottom-16 right-3 z-30`}
            onClick={() => scrollBy(1)}
            aria-label="Scroll down"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            whileHover={{
              scale: 1.12,
              boxShadow: '0 0 20px rgba(251,191,36,0.45), 0 0 8px rgba(251,191,36,0.25)',
              borderColor: 'rgba(251,191,36,0.7)',
            }}
            whileTap={{ scale: 0.88 }}
            transition={arrowTransition}
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.12) 100%)',
              border: '1px solid rgba(251,191,36,0.35)',
              boxShadow: '0 0 12px rgba(251,191,36,0.2), 0 2px 8px rgba(0,0,0,0.4)',
              color: 'rgba(253,230,138,0.9)',
            }}
          >
            <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
