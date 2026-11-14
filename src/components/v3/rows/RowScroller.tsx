'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RowScrollerProps {
  title: React.ReactNode;
  /** "See all" link: the title gets a chevron and links there. */
  href?: string;
  /** Extra control on the right of the title (e.g. an edit button). */
  action?: React.ReactNode;
  gap?: string;
  children: React.ReactNode;
}

/** A titled row that scrolls sideways (snap, no scrollbar), with arrow buttons on hover (desktop). */
export default function RowScroller({ title, href, action, gap = 'gap-4 md:gap-5', children }: RowScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const heading = <h2 className="text-lg font-semibold tracking-tight text-white md:text-[22px]">{title}</h2>;

  return (
    <section className="group/row relative py-4 md:py-5">
      <div className="v3-gutter mb-3 flex items-center justify-between md:mb-4">
        {href ? (
          <Link href={href} className="flex items-center gap-1 transition-opacity hover:opacity-80">
            {heading}
            <ChevronRight className="h-5 w-5 text-white/60" />
          </Link>
        ) : (
          heading
        )}
        {action}
      </div>

      <div className="relative">
        <div ref={ref} onScroll={measure} className={`v3-scroller v3-gutter flex overflow-x-auto pb-6 pt-1 ${gap}`}>
          {children}
          <span aria-hidden className="w-px shrink-0" />
        </div>

        {!edges.start && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => page(-1)}
            className="absolute left-3 top-[calc(50%-12px)] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white opacity-0 backdrop-blur-xl transition group-hover/row:opacity-100 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {!edges.end && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => page(1)}
            className="absolute right-3 top-[calc(50%-12px)] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white opacity-0 backdrop-blur-xl transition group-hover/row:opacity-100 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
