'use client';

import { useEffect } from 'react';

export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  useEffect(() => {
    if (!ref.current) return;

    const target = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [ref, callback, options]);
};