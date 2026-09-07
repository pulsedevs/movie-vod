'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useAnimation, useReducedMotion, type TargetAndTransition } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  BOREDFLIX_WORDMARK,
  BoredFlixCouchGraphic,
  BoredFlixPlayGraphic,
  LOGO_TEXT_BORED,
  LOGO_TEXT_BORED_HOVER,
  LOGO_TEXT_FLIX,
  LOGO_TEXT_FLIX_HOVER,
  LOGO_VIEWBOX,
  LOGO_WORDMARK_X,
  LOGO_PLAY_CX,
  LOGO_PLAY_CY,
} from '@/components/branding/boredFlixLogoMarkup';
import { LOGO_FONT_FAMILY, boredFlixLogoFont } from '@/components/branding/boredFlixLogoFont';
import { toV2Href } from '@/utils/v2Shell';
import { HERO_LOGO_SIZE_CLASS } from '@/utils/v2Layout';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const FLIX_LETTER_START = 5;
const WORDMARK_INTRO_MS = 1400;
/** Slightly smaller than full lockup so wordmark still reads prominent */
const COUCH_SCALE = 0.95;

interface HomeHeroLogoProps {
  className?: string;
  svgClassName?: string;
}

export default function HomeHeroLogo({ className = '', svgClassName }: HomeHeroLogoProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const homeHref = toV2Href(pathname, '/');
  const playControls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const [couchSettled, setCouchSettled] = useState(false);
  const [wordmarkIntroDone, setWordmarkIntroDone] = useState(false);

  useEffect(() => {
    if (reducedMotion) { setWordmarkIntroDone(true); return; }
    const t = window.setTimeout(() => setWordmarkIntroDone(true), WORDMARK_INTRO_MS);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      playControls.set({ opacity: 1, scale: 1, rotate: 0 });
      return;
    }

    let alive = true;

    async function run() {
      try {
        await playControls.start({
          opacity: [0, 1],
          scale: [0.35, 1.14, 1],
          rotate: 0,
          transition: { duration: 0.55, delay: 0.48, ease: EASE_OUT, times: [0, 0.72, 1] },
        });
        if (!alive) return;

        playControls.start({
          rotate: [0, 1080],
          transition: {
            duration: 1.4,
            ease: [0.12, 0.8, 0.15, 1],
            repeat: Infinity,
            repeatType: 'loop',
            repeatDelay: 2.8,
          },
        });
      } catch { /* component unmounted before animation could start */ }
    }

    run();
    return () => {
      alive = false;
      playControls.stop();
    };
  }, [reducedMotion, playControls]);

  return (
    <Link
      href={homeHref}
      className={`inline-flex shrink-0 items-center pointer-events-auto ${className}`}
      aria-label="BoredFlix home"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={`relative isolate ${boredFlixLogoFont.className}`}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      >
        <motion.div
          className="pointer-events-none absolute -inset-x-6 -inset-y-3 rounded-[32px] blur-xl bg-[radial-gradient(circle_at_35%_50%,rgba(251,146,60,0.1),transparent_50%)]"
          animate={reducedMotion ? { opacity: 0.45 } : { opacity: [0.35, 0.5, 0.35] }}
          transition={reducedMotion ? { duration: 0.2 } : { duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
        />

        <svg
          viewBox={LOGO_VIEWBOX}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgClassName ?? HERO_LOGO_SIZE_CLASS}
          aria-hidden="true"
        >
          <motion.g
            initial={reducedMotion ? false : { opacity: 0, y: -12, scale: 0.92 }}
            animate={
              reducedMotion
                ? { opacity: 1, y: isHovered ? -2 : 0, scale: isHovered ? 1.01 : 1 }
                : isHovered
                  ? { opacity: 1, y: -2, scale: 1.01 }
                  : couchSettled
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 1, y: [-12, 4, -1, 0], scale: [0.92, 1.04, 0.98, 1] }
            }
            transition={
              reducedMotion
                ? { duration: 0.25 }
                : isHovered
                  ? { type: 'spring', stiffness: 260, damping: 22 }
                  : couchSettled
                    ? { duration: 0.2 }
                    : { duration: 0.95, ease: EASE_OUT, times: [0, 0.55, 0.78, 1], delay: 0.05 }
            }
            onAnimationComplete={() => {
              if (!couchSettled && !reducedMotion && !isHovered) setCouchSettled(true);
            }}
            style={{ transformOrigin: '55px 86px' }}
          >
            <g transform={`translate(55, 86) scale(${COUCH_SCALE}) translate(-55, -86)`}>
              <BoredFlixCouchGraphic />
              <motion.g
                initial={reducedMotion ? false : { opacity: 0, scale: 0.3 }}
                animate={playControls}
                style={
                  {
                    transformBox: 'fill-box',
                    transformOrigin: `${LOGO_PLAY_CX}px ${LOGO_PLAY_CY}px`,
                  } as React.CSSProperties
                }
              >
                <BoredFlixPlayGraphic highlight={isHovered} />
              </motion.g>
            </g>
          </motion.g>

          {/*
            motion.text handles the whole-text slide (x) + blur — both work on SVG <text>.
            motion.tspan handles per-letter opacity stagger + Flix idle pulse — opacity works on tspan.
          */}
          <motion.text
            x={LOGO_WORDMARK_X}
            y="72"
            fontFamily={LOGO_FONT_FAMILY}
            fontSize="56"
            fontWeight="700"
            initial={reducedMotion ? false : { x: 10, filter: 'blur(6px)' }}
            animate={
              reducedMotion
                ? { x: 0, filter: 'blur(0px)' }
                : isHovered
                  ? { x: 0, filter: 'blur(0px)', y: -4 }
                  : { x: 0, filter: 'blur(0px)', y: 0 }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : isHovered
                  ? { type: 'spring', stiffness: 320, damping: 20 }
                  : { duration: 0.6, delay: 0.3, ease: EASE_OUT }
            }
            style={
              {
                letterSpacing: '-1.5px',
                transformBox: 'fill-box',
                transformOrigin: 'center',
              } as React.CSSProperties
            }
            textRendering="optimizeLegibility"
          >
            {BOREDFLIX_WORDMARK.split('').map((letter, index) => {
              const isFlix = index >= FLIX_LETTER_START;
              const fill = isFlix
                ? (isHovered ? LOGO_TEXT_FLIX_HOVER : LOGO_TEXT_FLIX)
                : (isHovered ? LOGO_TEXT_BORED_HOVER : LOGO_TEXT_BORED);

              let tAnimate: TargetAndTransition;
              let tTransition: object;

              if (reducedMotion) {
                tAnimate = { opacity: 1 };
                tTransition = { duration: 0 };
              } else if (!wordmarkIntroDone) {
                tAnimate = { opacity: 1 };
                tTransition = { duration: 0.45, delay: 0.3 + index * 0.055, ease: EASE_OUT };
              } else if (isFlix) {
                tAnimate = { opacity: [1, 0.55, 1] };
                tTransition = {
                  duration: 2.2,
                  delay: (index - FLIX_LETTER_START) * 0.18,
                  repeat: Infinity,
                  ease: 'easeInOut',
                };
              } else {
                tAnimate = { opacity: 1 };
                tTransition = { duration: 0 };
              }

              return (
                <motion.tspan
                  key={`${letter}-${index}`}
                  fill={fill}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={tAnimate}
                  transition={tTransition}
                >
                  {letter}
                </motion.tspan>
              );
            })}
          </motion.text>
        </svg>
      </motion.div>
    </Link>
  );
}
