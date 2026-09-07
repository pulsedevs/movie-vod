'use client';

import { useState } from 'react';
import { Gift, ArrowRight, X } from 'lucide-react';

// One rotating offers link (NEXT_PUBLIC_OFFERS_URL). The destination shows different offers per
// visitor/geo, so the copy stays deliberately general — it must stay accurate whatever is served.
const OFFERS_URL = process.env.NEXT_PUBLIC_OFFERS_URL;

const EYEBROW = 'Partner offers';
const HEADLINE = 'Today’s top deals';
const CTA = 'See offers';

interface OffersBannerProps {
  className?: string;
}

/**
 * In-content promo bar for a single rotating offers link (NEXT_PUBLIC_OFFERS_URL).
 * Drops into the same slots the native banner ad used (via NativeBannerAdWrapper).
 * Hidden when no URL is configured; dismissal is in-memory (returns on reload).
 */
export default function OffersBanner({ className = '' }: OffersBannerProps) {
  const [hidden, setHidden] = useState(false);
  if (!OFFERS_URL || hidden) return null;

  return (
    <div className="px-2 pt-3 pb-1 sm:px-5">
      <a
        href={OFFERS_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label="See today's offers"
        className={`group relative isolate flex items-center gap-2.5 overflow-hidden rounded-2xl border px-2.5 py-3 no-underline transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-px sm:gap-3 sm:px-3 ${className}`}
        style={{
          background:
            'linear-gradient(100deg, rgba(245,196,81,0.17) 0%, rgba(245,196,81,0.05) 26%, rgba(20,20,22,0) 52%), #141416',
          borderColor: 'rgba(245,196,81,0.34)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px -28px rgba(245,196,81,0.5)',
        }}
      >
        {/* light-shimmer sweep */}
        <span className="offersbar-sweep pointer-events-none absolute inset-0 z-[4]" aria-hidden="true" />

        {/* gift badge + "live" dot */}
        <span
          className="relative z-[2] grid h-11 w-11 flex-none place-items-center rounded-xl text-[#1a1408]"
          style={{
            background: 'radial-gradient(120% 120% at 30% 20%, #ffdd8a, #f5c451 55%, #d99a26)',
            boxShadow: '0 6px 18px -6px rgba(245,196,81,0.7), inset 0 0 0 1px rgba(255,255,255,0.25)',
          }}
        >
          <span
            className="offers-livedot absolute -right-1 -top-1 h-[11px] w-[11px] rounded-full"
            style={{ background: '#e50914', border: '2px solid #141416' }}
            aria-hidden="true"
          />
          <Gift className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>

        {/* copy */}
        <span className="relative z-[2] min-w-0 flex-1 text-left">
          {/* Eyebrow hidden on phones so the compact bar (badge + headline + CTA) never overflows */}
          <span className="mb-0.5 hidden items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f5c451] sm:flex">
            {EYEBROW}
            <span className="h-[3px] w-[3px] rounded-full bg-[#9a958c]" />
            Updated daily
          </span>
          <span className="block truncate text-[15px] font-extrabold tracking-tight text-[#f6f4ef]">
            {/* shorter headline on phones so it never truncates mid-word */}
            <span className="sm:hidden">Today’s deals</span>
            <span className="hidden sm:inline">{HEADLINE}</span>
          </span>
        </span>

        {/* CTA */}
        <span
          className="relative z-[2] inline-flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-extrabold text-[#1a1408] transition-[filter] duration-200 group-hover:brightness-105 sm:px-4"
          style={{
            background: 'linear-gradient(180deg, #ffdd8a, #f5c451 60%, #d99a26)',
            boxShadow: '0 6px 16px -8px rgba(245,196,81,0.8)',
          }}
        >
          <span className="hidden sm:inline">{CTA}</span>
          <span className="sm:hidden">Offers</span>
          <ArrowRight
            className="h-[15px] w-[15px] transition-transform duration-300 group-hover:translate-x-0.5"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        </span>

        {/* dismiss (desktop) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setHidden(true);
          }}
          aria-label="Dismiss offers"
          className="relative z-[2] hidden h-[30px] w-[30px] flex-none place-items-center rounded-lg text-[#7c7c84] transition-colors hover:bg-white/[0.07] hover:text-[#cfcfd6] sm:grid"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </a>
    </div>
  );
}
