'use client';

import { useEffect, useState } from 'react';
import { X, Smartphone, Monitor, Tv, type LucideIcon } from 'lucide-react';

// One env-configured destination for every platform (your main site / apps page).
// Falls back to the legacy Android var so existing deploys keep working.
const APP_URL =
  process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || process.env.NEXT_PUBLIC_ANDROID_APP_URL;

type Platform = {
  key: string;
  Icon: LucideIcon;
  title: string;
  cta: string;
  accent: string; // hex — drives the tint + button colour
};

const PLATFORMS: Platform[] = [
  {
    key: 'android',
    Icon: Smartphone,
    title: 'BoredFlix Android app is here!',
    cta: 'Get the app',
    accent: '#f59e0b',
  },
  {
    key: 'windows',
    Icon: Monitor,
    title: 'BoredFlix for Windows',
    cta: 'Download',
    accent: '#38bdf8',
  },
  {
    key: 'androidtv',
    Icon: Tv,
    title: 'BoredFlix on Android TV',
    cta: 'Get it on TV',
    accent: '#a78bfa',
  },
];

const ROTATE_MS = 4500;

/** Site-wide promo bar for the BoredFlix apps (Android / Windows / Android TV).
 *  Rotates through the platforms; every button points to the one configured
 *  download URL. Dismissal is in-memory only — the banner returns on reload. */
export default function AndroidAppBanner() {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (APP_URL) setVisible(true);
  }, []);

  useEffect(() => {
    if (PLATFORMS.length < 2) return; // nothing to rotate through
    let fadeTimer: ReturnType<typeof setTimeout>;
    const rotate = setInterval(() => {
      setShow(false); // fade out
      fadeTimer = setTimeout(() => {
        setIdx((i) => (i + 1) % PLATFORMS.length);
        setShow(true); // fade the next one in
      }, 300);
    }, ROTATE_MS);
    return () => {
      clearInterval(rotate);
      clearTimeout(fadeTimer);
    };
  }, []);

  if (!visible || !APP_URL) return null;

  const p = PLATFORMS[idx];
  const Icon = p.Icon;
  const fade = `transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`;

  return (
    <div className="relative z-30 mx-3 mt-2 sm:mx-5 md:mt-3">
      <div
        className="flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors duration-500 sm:gap-3 sm:px-4"
        style={{
          background: `linear-gradient(120deg, ${p.accent}24 0%, rgba(20,20,22,0.9) 45%, rgba(20,20,22,0.9) 100%)`,
          borderColor: `${p.accent}47`,
        }}
      >
        <div className={`flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 ${fade}`}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-500"
            style={{ backgroundColor: `${p.accent}2e` }}
          >
            <Icon className="h-4 w-4" style={{ color: p.accent }} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white sm:text-sm">{p.title}</p>
          </div>
        </div>

        {PLATFORMS.length > 1 && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {PLATFORMS.map((pl, i) => (
              <button
                key={pl.key}
                type="button"
                aria-label={`Show ${pl.key} download`}
                onClick={() => {
                  setShow(true);
                  setIdx(i);
                }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 14 : 6,
                  backgroundColor: i === idx ? p.accent : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>
        )}

        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-black transition-[colors,opacity,transform] duration-300 hover:brightness-110 sm:px-4 sm:text-xs ${fade}`}
          style={{ backgroundColor: p.accent }}
        >
          {p.cta}
        </a>

        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss app banner"
          className="shrink-0 rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
