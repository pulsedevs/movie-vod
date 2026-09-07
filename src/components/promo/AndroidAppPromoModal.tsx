'use client';

import { useEffect, useState } from 'react';
import { X, Smartphone, Zap, BookmarkCheck, ShieldCheck, Download } from 'lucide-react';

const LAST_SEEN_KEY = 'android-app-promo-last-seen';
const SHOW_DELAY_MS = 15000;

/** Delayed promo popup for the BoredFlix Android app — shows once per day. */
export default function AndroidAppPromoModal() {
  const appUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!appUrl) return;

    try {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      if (lastSeen === new Date().toDateString()) return;
    } catch {}

    const timer = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 50);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [appUrl]);

  const dismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      try {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toDateString());
      } catch {}
    }, 300);
  };

  const handleDownload = () => {
    window.open(appUrl, '_blank', 'noopener,noreferrer');
    dismiss();
  };

  if (!isVisible || !appUrl) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

      <div
        className={`relative w-full max-w-xs sm:max-w-sm transform transition-all duration-300 ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div className="relative rounded-2xl border border-amber-400/25 bg-[#101012] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Amber glow accent */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.18),transparent_55%)]" />

          <div className="relative p-5 sm:p-6">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-zinc-300"
              aria-label="Close app promotion"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15">
                <Smartphone className="h-7 w-7 text-amber-300" />
              </div>
              <h2 className="text-lg font-bold text-white">Get the BoredFlix App</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Your movies &amp; shows, right on your Android phone
              </p>
            </div>

            {/* Features */}
            <div className="mb-4 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>Faster, smoother streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>Your library &amp; continue watching on the go</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>Free — no sign-up required</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-black transition-all hover:bg-amber-300 hover:scale-[1.02] active:scale-95"
              aria-label="Download the BoredFlix Android app"
            >
              <Download className="h-4 w-4" />
              Download for Android
            </button>

            <p className="mt-2 text-center text-[10px] leading-tight text-zinc-600">
              Android only · iPhone users — tell a friend 😉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
