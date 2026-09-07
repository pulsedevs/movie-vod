'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Gift, ArrowRight, X } from 'lucide-react';

// Our own full-screen interstitial ("vignette") — replaces the third-party dd133 vignette
// that served adult ads. Points at the one rotating offers link (NEXT_PUBLIC_OFFERS_URL).
// Shown at natural page transitions, frequency-capped.
const OFFERS_URL = process.env.NEXT_PUBLIC_OFFERS_URL;
const COOLDOWN_MS = 10 * 60 * 1000; // at most once per 10 min
const INITIAL_DELAY_MS = 8000; // first appearance this long after load
const LS_KEY = 'bf_offers_vignette_last';

export default function OffersVignette() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef(true);

  const canShow = () => {
    if (!OFFERS_URL) return false;
    try {
      return Date.now() - Number(localStorage.getItem(LS_KEY) || 0) > COOLDOWN_MS;
    } catch {
      return true;
    }
  };
  const show = () => {
    if (!canShow()) return;
    try {
      localStorage.setItem(LS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setOpen(true);
  };

  // First load: appear after a short idle delay (kept off the critical path).
  useEffect(() => {
    if (!OFFERS_URL) return;
    const t = setTimeout(show, INITIAL_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subsequent client navigations — the classic "between pages" vignette moment.
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // While open: lock body scroll + close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!OFFERS_URL || !open) return null;

  return (
    <div
      className="offers-fade-in fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Featured offers"
    >
      <div
        className="offers-pop-in relative w-full max-w-[360px] overflow-hidden rounded-3xl border p-6 text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, rgba(245,196,81,0.16), rgba(20,20,22,0) 55%), #141416',
          borderColor: 'rgba(245,196,81,0.30)',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,0.8), 0 0 60px -30px rgba(245,196,81,0.5)',
        }}
      >
        <span className="offersbar-sweep pointer-events-none absolute inset-0" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-[2] grid h-8 w-8 place-items-center rounded-full text-[#8a8a90] transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <span
          className="relative z-[2] mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-[#1a1408]"
          style={{
            background: 'radial-gradient(120% 120% at 30% 20%, #ffdd8a, #f5c451 55%, #d99a26)',
            boxShadow: '0 10px 26px -8px rgba(245,196,81,0.75), inset 0 0 0 1px rgba(255,255,255,0.25)',
          }}
        >
          <Gift className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </span>

        <div className="relative z-[2] mb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f5c451]">
          Partner offers
        </div>
        <h2 className="relative z-[2] mb-5 text-[22px] font-extrabold tracking-tight text-white">
          Today’s top deals
        </h2>

        <a
          href={OFFERS_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => setOpen(false)}
          className="relative z-[2] mb-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-extrabold text-[#1a1408] no-underline transition-[filter] duration-200 hover:brightness-105"
          style={{
            background: 'linear-gradient(180deg, #ffdd8a, #f5c451 60%, #d99a26)',
            boxShadow: '0 10px 24px -10px rgba(245,196,81,0.8)',
          }}
        >
          See offers
          <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="relative z-[2] text-[12.5px] font-semibold text-[#7c7c84] transition-colors hover:text-[#b3b0a9]"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
