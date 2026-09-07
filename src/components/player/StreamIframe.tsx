'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface StreamIframeProps {
  src: string;
  title: string;
  className?: string;
}

const IFRAME_ALLOW =
  'accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture; gyroscope; web-share';

/** Minimum time the loading overlay stays visible so switches feel intentional */
const MIN_VEIL_MS = 700;
/** Max wait before forcing the swap (embed onLoad is unreliable cross-origin) */
const TRANSITION_FALLBACK_MS = 8000;
const FADE_MS = 400;

/** Plain embed iframe — remounts when src changes. */
export function StreamIframe({ src, title, className }: StreamIframeProps) {
  const trimmed = src?.trim();
  if (!trimmed) return null;

  return (
    <iframe
      key={trimmed}
      src={trimmed}
      title={title}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      allow={IFRAME_ALLOW}
    />
  );
}

/**
 * Crossfades between stream URLs with a loading veil — used for server / episode switches in the v2 shell.
 */
export function TransitionStreamIframe({ src, title, className }: StreamIframeProps) {
  const trimmed = src?.trim() ?? '';
  const [slots, setSlots] = useState<[string, string]>(['', '']);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [pendingSlot, setPendingSlot] = useState<0 | 1 | null>(null);
  const [showVeil, setShowVeil] = useState(false);
  const initializedRef = useRef(false);
  const slotsRef = useRef<[string, string]>(['', '']);
  const activeSlotRef = useRef<0 | 1>(0);
  const pendingSlotRef = useRef<0 | 1 | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionStartRef = useRef(0);

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const finishTransition = useCallback(
    (slot: 0 | 1) => {
      const other: 0 | 1 = slot === 0 ? 1 : 0;
      pendingSlotRef.current = null;
      setPendingSlot(null);
      activeSlotRef.current = slot;
      setActiveSlot(slot);
      // Clear the other slot so its iframe is removed from the DOM (stops audio)
      setSlots((prev) => {
        if (!prev[other]) return prev;
        const copy: [string, string] = [...prev];
        copy[other] = '';
        slotsRef.current = copy;
        return copy;
      });
      completeTimerRef.current = setTimeout(() => setShowVeil(false), FADE_MS);
    },
    []
  );

  const completeTransition = useCallback(
    (slot: 0 | 1) => {
      if (pendingSlotRef.current !== slot) return;
      clearFallback();

      const elapsed = Date.now() - transitionStartRef.current;
      const wait = Math.max(0, MIN_VEIL_MS - elapsed);

      clearCompleteTimer();
      completeTimerRef.current = setTimeout(() => finishTransition(slot), wait);
    },
    [clearFallback, clearCompleteTimer, finishTransition]
  );

  const scheduleFallback = useCallback(
    (slot: 0 | 1) => {
      clearFallback();
      fallbackTimerRef.current = setTimeout(() => {
        completeTransition(slot);
      }, TRANSITION_FALLBACK_MS);
    },
    [clearFallback, completeTransition]
  );

  const beginTransition = useCallback(
    (nextSlot: 0 | 1, nextSrc: string) => {
      transitionStartRef.current = Date.now();
      pendingSlotRef.current = nextSlot;
      setPendingSlot(nextSlot);
      setShowVeil(true);
      // Blank the old slot immediately — removes its iframe from the DOM, stopping audio
      setSlots((_prev) => {
        const copy: [string, string] = ['', ''];
        copy[nextSlot] = nextSrc;
        slotsRef.current = copy;
        return copy;
      });
      scheduleFallback(nextSlot);
    },
    [scheduleFallback]
  );

  useEffect(() => {
    return () => {
      clearFallback();
      clearCompleteTimer();
    };
  }, [clearFallback, clearCompleteTimer]);

  useEffect(() => {
    if (!trimmed) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const initial: [string, string] = [trimmed, ''];
      slotsRef.current = initial;
      setSlots(initial);
      return;
    }

    const current =
      activeSlotRef.current === 0 ? slotsRef.current[0] : slotsRef.current[1];
    if (trimmed === current) return;

    const nextSlot: 0 | 1 = activeSlotRef.current === 0 ? 1 : 0;

    if (slotsRef.current[nextSlot] === trimmed) {
      clearFallback();
      clearCompleteTimer();
      transitionStartRef.current = Date.now();
      pendingSlotRef.current = nextSlot;
      setPendingSlot(nextSlot);
      setShowVeil(true);
      // Blank the current active slot to stop its audio immediately
      setSlots((prev) => {
        const copy: [string, string] = [...prev];
        copy[activeSlotRef.current] = '';
        slotsRef.current = copy;
        return copy;
      });
      completeTimerRef.current = setTimeout(() => finishTransition(nextSlot), MIN_VEIL_MS);
      return;
    }

    beginTransition(nextSlot, trimmed);
  }, [trimmed, beginTransition, clearFallback, clearCompleteTimer, finishTransition]);

  const frameClass =
    className ?? 'absolute top-0 left-0 h-full w-full md:rounded-lg shadow-xl';

  if (!slots[0] && !slots[1] && !trimmed) return null;

  const isSwitching = showVeil && pendingSlot !== null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a] md:rounded-lg">
      {([0, 1] as const).map((index) => {
        const slotSrc = slots[index];
        if (!slotSrc) return null;

        const isActive = activeSlot === index;
        const isIncoming = pendingSlot === index;
        const isOutgoing = isSwitching && isActive && !isIncoming;

        let opacity = 'opacity-0';
        if (isSwitching) {
          if (isIncoming) opacity = 'opacity-0';
          else if (isOutgoing) opacity = 'opacity-30';
          else if (isActive) opacity = 'opacity-100';
        } else if (isActive) {
          opacity = 'opacity-100';
        }

        return (
          <iframe
            key={`stream-slot-${index}-${slotSrc}`}
            src={slotSrc}
            title={title}
            onLoad={() => completeTransition(index)}
            className={`${frameClass} transition-opacity duration-[400ms] ease-out ${
              isActive && !isSwitching ? 'z-10' : isIncoming ? 'z-0' : isOutgoing ? 'z-[5]' : 'z-0'
            } ${opacity} ${!isActive || isOutgoing ? 'pointer-events-none' : ''}`}
            loading={index === 0 && !slots[1] ? 'lazy' : 'eager'}
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            allow={IFRAME_ALLOW}
          />
        );
      })}

      <div
        className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-[2px] transition-opacity duration-300 ${
          showVeil ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showVeil}
        aria-live="polite"
      >
        {showVeil && (
          <>
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-white/90" />
            <p className="text-xs font-medium tracking-wide text-white/70">Switching source…</p>
          </>
        )}
      </div>
    </div>
  );
}
