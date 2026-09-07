'use client';

import { useEffect, useState } from 'react';

const WATCHER_MIN = 7217;
const WATCHER_MAX = 10760;
const WATCHER_DEFAULT = Math.floor((WATCHER_MIN + WATCHER_MAX) / 2);

function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function nextWatcherCount(current: number): number {
  const roll = Math.random();
  let delta: number;

  if (roll < 0.2) {
    delta = randomBetween(-5, 5);
  } else if (roll < 0.85) {
    delta = randomBetween(-12, 12);
  } else {
    delta = randomBetween(-22, 22);
  }

  const nearTop = current >= WATCHER_MAX - 120;
  const nearBottom = current <= WATCHER_MIN + 120;

  if (nearTop && delta > 0) {
    delta = -Math.abs(delta || randomBetween(3, 10));
  } else if (nearBottom && delta < 0) {
    delta = Math.abs(delta || randomBetween(3, 10));
  } else if (nearTop && delta > 8) {
    delta = randomBetween(-15, -3);
  } else if (nearBottom && delta < -8) {
    delta = randomBetween(3, 15);
  }

  return Math.min(WATCHER_MAX, Math.max(WATCHER_MIN, current + delta));
}

function randomTickDelayMs() {
  return 2800 + Math.floor(Math.random() * 4200);
}

export function useLiveWatcherCount(enabled = true) {
  const [count, setCount] = useState(WATCHER_DEFAULT);

  useEffect(() => {
    if (!enabled) return;

    setCount(randomBetween(WATCHER_MIN, WATCHER_MAX));

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleTick = () => {
      timeoutId = setTimeout(() => {
        setCount((current) => nextWatcherCount(current));
        scheduleTick();
      }, randomTickDelayMs());
    };

    scheduleTick();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled]);

  return count;
}

export { WATCHER_MIN, WATCHER_MAX };
