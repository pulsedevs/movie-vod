'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent, ReactNode } from 'react';
import Hls from 'hls.js';
import { markWatched } from '@/components/v3/watch/watched';

interface Props {
  /** TMDB id of the film, or of the show when `season` + `episode` are given. */
  tmdbId: number | string;
  title?: string;
  /** Film's original language (TMDB ISO-639-1); the backend accepts original OR English audio. */
  origLang?: string;
  poster?: string;
  className?: string;
  /** TV: play this episode of the show `tmdbId` (TMDB numbering). */
  season?: number;
  episode?: number;
  /** TV: the panel has no such show/episode (backend 404) — the caller shows its other sources. */
  onMissing?: () => void;
  /** Replaces the title in the top bar (e.g. Back + title on the watch page). It hides with the
   *  controls while playing, and stays up while loading so the viewer can always leave. */
  header?: ReactNode;
  /** The loading / unavailable screens fill the player's box instead of keeping 16:9. */
  fill?: boolean;
  /** TV: the next episode. A "Next Episode" button shows over the last stretch, and the episode
   *  rolls on to it when it ends. */
  next?: { label?: string; go: () => void };
  /** TV: the episode list, shown in a wide panel from the Episodes button. */
  episodes?: ReactNode;
}

/** One selectable copy of the film — audio language × quality — plus its packaging state. */
export interface Version {
  sid: string; lang: string; label: string; quality: string; name: string;
  state: 'ready' | 'streaming' | 'packaging' | 'bad' | 'none'; reason?: string; current?: boolean;
}

type PlayState =
  | { s: 'loading' }
  | { s: 'preparing'; versions?: Version[] }
  | { s: 'ready'; url: string; sid?: string; versions?: Version[]; duration?: number }
  | { s: 'unavailable'; versions?: Version[]; reason?: string }
  | { s: 'error'; msg: string };

interface IOSVideo extends HTMLVideoElement { webkitEnterFullscreen?: () => void }

/** An audio or subtitle track inside the stream (switching one is instant — no reload). */
interface Track { id: number; label: string; lang: string }
/** Safari's native HLS exposes the stream's audio tracks here (not in the TS DOM lib). */
interface NativeAudioTrack { enabled: boolean; label: string; language: string }
type NativeAudioList = ArrayLike<NativeAudioTrack> & EventTarget;
const nativeAudio = (v: HTMLVideoElement): NativeAudioList | null =>
  (v as unknown as { audioTracks?: NativeAudioList }).audioTracks ?? null;
const subTextTracks = (v: HTMLVideoElement): TextTrack[] =>
  Array.from(v.textTracks).filter(t => t.kind === 'subtitles' || t.kind === 'captions');

const AUDIO_KEY = 'lp:audio';          // audio language the viewer picked in the audio menu
const SUBS_KEY = 'lp:subs';            // subtitle language the viewer picked, or 'off'
const SUBS_LAST_KEY = 'lp:subs:last';  // the last subtitle language used ('c' turns it back on)
const lang2 = (s?: string) => (s || '').toLowerCase().slice(0, 2);
const readKey = (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const writeKey = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const langName = (code?: string) => {
  if (!code || code === 'und') return '';
  try { return new Intl.DisplayNames([navigator.language || 'en'], { type: 'language' }).of(code) || ''; } catch { return ''; }
};
/** Menu labels: the playlist's NAME (e.g. "Français"), "· 5.1" for surround, "(2)" on a repeat. */
const toTracks = (src: { name?: string; lang?: string; ch?: string }[]): Track[] => {
  const seen = new Map<string, number>();
  return src.map((t, i) => {
    let label = t.name || langName(t.lang) || `Track ${i + 1}`;
    const ch = parseInt(t.ch || '', 10);
    if (ch >= 8) label += ' · 7.1'; else if (ch >= 6) label += ' · 5.1';
    const n = (seen.get(label) || 0) + 1; seen.set(label, n);
    return { id: i, label: n > 1 ? `${label} (${n})` : label, lang: lang2(t.lang) };
  });
};
/** A WebVTT cue as plain text: tags (<i>, <c.x>, <00:01.000>) dropped, entities decoded. */
const cueText = (c: TextTrackCue) => ((c as VTTCue).text || '')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const LANG_KEY = 'lp:lang';
/** Preferred audio language: what the viewer last picked, else the browser's language. */
const prefLang = (): string => {
  try { const s = localStorage.getItem(LANG_KEY); if (s) return s; } catch { /* ignore */ }
  try { return (navigator.language || 'en').slice(0, 2).toLowerCase(); } catch { return 'en'; }
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
/** The settings panel: its first page (tiles), or one of its lists. */
type Panel = '' | 'main' | 'quality' | 'audio' | 'subs' | 'speed' | 'subStyle' | 'episodes';

/** How subtitles look and when they show; kept in this browser. */
interface SubStyle {
  delay: number;        // seconds; + shows them later, - earlier
  font: 'default' | 'classic' | 'montserrat';
  size: number;         // % of the normal size
  raise: number;        // % of the player's height to lift them by
  bg: boolean;          // the dark box behind the text (else an outline)
  color: string;
}
const SUB_STYLE_KEY = 'lp:subStyle';
const SUB_STYLE_DEFAULT: SubStyle = { delay: 0, font: 'default', size: 100, raise: 0, bg: true, color: '#ffffff' };
const SUB_COLORS = ['#ffffff', '#80b1fa', '#e2e535', '#22c55e'];
const SUB_FONTS: { id: SubStyle['font']; label: string; css?: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'classic', label: 'Classic', css: 'Arial, Helvetica, sans-serif' },
  { id: 'montserrat', label: 'Montserrat', css: "'Montserrat', sans-serif" },
];
const readSubStyle = (): SubStyle => {
  try {
    const v = JSON.parse(localStorage.getItem(SUB_STYLE_KEY) || '{}');
    return { ...SUB_STYLE_DEFAULT, ...(v && typeof v === 'object' ? v : {}) };
  } catch { return SUB_STYLE_DEFAULT; }
};
const SKIP = 10;                       // seconds per ←/→ and the skip buttons
const HIDE_AFTER = 2600;               // ms of stillness before controls fade (while playing)
/** `movie:{tmdb}` or `tv:{tmdb}:{season}:{episode}` — where "resume where you left off" is kept. */
const posKey = (id: string) => `lp:pos:${id}`;

const fmt = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  return (h ? `${h}:` : '') + (h ? String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
};

// Remembered position for "resume where you left off" (ignored for the first 30s / last minute).
const readSaved = (id: string): number => {
  try { const n = parseFloat(localStorage.getItem(posKey(id)) || '0'); return isFinite(n) && n > 30 ? n : 0; } catch { return 0; }
};

// ── icons (24×24, currentColor) ──────────────────────────────────────────────────────────────────
const I = {
  play: <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" />,
  pause: <path d="M7 4.5h2.5A1.5 1.5 0 0 1 11 6v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5zm7.5 0H17A1.5 1.5 0 0 1 18.5 6v12a1.5 1.5 0 0 1-1.5 1.5h-2.5A1.5 1.5 0 0 1 13 18V6a1.5 1.5 0 0 1 1.5-1.5z" />,
  replay: <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />,
  // ±10 s: a round arrow in the upper corner, the "10" big and readable below it.
  back: <>
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(6.5 0.5) scale(0.72)">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </g>
    <text x="0" y="23.5" fontSize="10" fontWeight="800" fill="currentColor" stroke="none">10</text>
  </>,
  fwd: <>
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(17.5 0.5) scale(-0.72 0.72)">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </g>
    <text x="12.6" y="23.5" fontSize="10" fontWeight="800" fill="currentColor" stroke="none">10</text>
  </>,
  volume: <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />,
  muted: <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.5 2.5v-.7zM19 12a7 7 0 0 1-1.3 4.1l1.5 1.5A9 9 0 0 0 21 12a9 9 0 0 0-7-8.8v2.1A7 7 0 0 1 19 12zM4.3 3 3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3a7 7 0 0 1-2.3 1.2v2.1a9 9 0 0 0 3.7-1.8l2 2 1.3-1.3L4.3 3zM12 4 9.9 6.1 12 8.2V4z" />,
  fs: <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />,
  fsExit: <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />,
  pip: <path d="M19 11h-8v6h8v-6zm4 8V5c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 0H3V5h18v14z" />,
  audio: <path d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2v-8H5v-1a7 7 0 0 1 14 0v1h-2v8h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z" />,
  subs: <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z" />,
  gear: <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />,
  cloud: <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A6 6 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />,
  hd: <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm2-6h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4V9zm1.5 4.5h2v-3h-2v3z" />,
  speed: <path d="m20.38 8.57-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />,
  check: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />,
  chevL: <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />,
  chevR: <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />,
  textSize: <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z" />,
  episodes: <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />,
  skipNext: <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />,
};

/** A small icon inside menus and tiles. */
const Ico = ({ d, size = 18, className }: { d: ReactNode; size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>{d}</svg>
);

/** A settings tile: small caps label over the current value; opens that setting's list. */
function Tile({ icon, label, value, disabled, onClick }: {
  icon: ReactNode; label: string; value: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" className="lp-tile" onClick={onClick} disabled={disabled}>
      <span className="lp-tlab"><Ico d={icon} size={14} />{label}</span>
      <span className="lp-tval">{value}</span>
    </button>
  );
}

function Btn({ onClick, label, children, active, expanded }: {
  onClick: () => void; label: string; children: ReactNode; active?: boolean; expanded?: boolean;
}) {
  return (
    <button
      type="button" className={`lp-btn${active ? ' on' : ''}`} onClick={onClick} aria-label={label} title={label}
      aria-haspopup={expanded === undefined ? undefined : 'menu'} aria-expanded={expanded}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">{children}</svg>
    </button>
  );
}

const CSS = `
.lp-player{--lp:#fff;color:#fff;font-size:14px;line-height:1}
.lp-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1}
.lp-big{pointer-events:auto;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:999px;width:80px;height:80px;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transition:transform .15s,background .15s}
.lp-big:hover{transform:scale(1.06);background:rgba(255,255,255,.2)}
.lp-spin{width:52px;height:52px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#fff;animation:lpspin .8s linear infinite}
@keyframes lpspin{to{transform:rotate(360deg)}}
.lp-shade{position:absolute;inset:0;background:rgba(0,0,0,.35);opacity:0;transition:opacity .3s;pointer-events:none}
.lp-shade.on{opacity:1}
.lp-top,.lp-bottom{position:absolute;left:0;right:0;opacity:0;transition:opacity .3s;pointer-events:none;z-index:3}
.lp-top{top:0;padding:24px 24px 48px;background:linear-gradient(rgba(0,0,0,.55),transparent)}
.lp-bottom{bottom:0;padding:56px 32px 12px;background:linear-gradient(transparent,rgba(0,0,0,.7))}
.lp-show{opacity:1;pointer-events:auto}
.lp-title{font-weight:500;font-size:16px;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-bar{position:relative;height:18px;display:flex;align-items:center;cursor:pointer;touch-action:none;margin-bottom:4px}
.lp-track{position:relative;width:100%;height:4px;background:rgba(255,255,255,.3);border-radius:999px;overflow:hidden;transition:height .1s}
.lp-bar:hover .lp-track,.lp-bar.scrub .lp-track{height:6px}
.lp-avail{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.12)}
.lp-buf{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.4)}
.lp-played{position:absolute;left:0;top:0;bottom:0;background:var(--lp);border-radius:999px}
.lp-knob{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;background:#fff;transform:translate(-50%,-50%) scale(0);transition:transform .12s;box-shadow:0 1px 6px rgba(0,0,0,.4)}
.lp-bar:hover .lp-knob,.lp-bar.scrub .lp-knob{transform:translate(-50%,-50%) scale(1)}
.lp-tip{position:absolute;bottom:22px;transform:translateX(-50%);background:rgba(0,0,0,.5);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.1);padding:7px 12px;border-radius:999px;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;pointer-events:none;white-space:nowrap}
.lp-row{display:flex;align-items:center;justify-content:space-between;gap:12px;height:40px}
.lp-grp{display:flex;align-items:center;gap:12px;min-width:0}
.lp-btn{background:none;border:0;color:#fff;width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,transform .1s;padding:0;flex:none}
.lp-btn:hover{background:rgba(255,255,255,.1)}
.lp-btn.on{background:rgba(255,255,255,.16)}
.lp-btn:active{transform:scale(.92)}
.lp-btn:focus-visible,.lp-time:focus-visible,.lp-tile:focus-visible,.lp-item:focus-visible{outline:2px solid #fff;outline-offset:2px}
.lp-time{background:none;border:0;color:#fff;font:inherit;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;height:36px;padding:0 8px;border-radius:999px;cursor:pointer;white-space:nowrap}
.lp-time:hover{background:rgba(255,255,255,.1)}
.lp-vol{display:flex;align-items:center}
.lp-range{-webkit-appearance:none;appearance:none;width:0;opacity:0;height:4px;margin:0;border-radius:999px;cursor:pointer;background:linear-gradient(#fff,#fff) 0 0/var(--v,100%) 100% no-repeat,rgba(255,255,255,.3);transition:width .2s,opacity .2s,margin .2s}
.lp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;border:0}
.lp-range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;border:0}
.lp-vol:hover .lp-range,.lp-range:focus-visible{width:72px;opacity:1;margin:0 10px 0 4px}
.lp-shield{position:absolute;inset:0;z-index:2}
.lp-eppanel{position:absolute;left:32px;right:32px;bottom:76px;z-index:4;max-height:calc(100% - 140px);overflow:hidden;display:flex;flex-direction:column;background:rgba(18,18,18,.55);backdrop-filter:blur(28px) saturate(1.8);-webkit-backdrop-filter:blur(28px) saturate(1.8);border:1px solid rgba(255,255,255,.1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);line-height:1.2}
.lp-next{position:absolute;right:32px;bottom:40px;z-index:3;display:flex;align-items:center;gap:10px;height:48px;padding:0 18px 0 24px;border:0;border-radius:999px;background:rgba(255,255,255,.92);color:#000;font:inherit;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:bottom .3s ease-out,transform .15s,background .15s;animation:lpnext .35s ease-out}
.lp-next:hover{background:#fff;transform:scale(1.03)}
.lp-next.up{bottom:96px}
@keyframes lpnext{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.lp-panel{position:absolute;right:32px;bottom:76px;z-index:4;width:343px;max-width:calc(100% - 32px);max-height:calc(100% - 140px);overflow:auto;overscroll-behavior:contain;scrollbar-width:none;background:rgba(15,15,15,.72);backdrop-filter:blur(28px) saturate(1.8);-webkit-backdrop-filter:blur(28px) saturate(1.8);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.5);line-height:1.2}
.lp-tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
/* Panels open with a quick fade; their rows (and the tiles) cascade in, 25 ms apart. */
.lp-panel,.lp-eppanel{animation:lppop .18s ease-out backwards}
.lp-panel>*,.lp-tiles>*{animation:lpcas .3s cubic-bezier(.2,.7,.2,1) backwards}
.lp-panel>:nth-child(2),.lp-tiles>:nth-child(2){animation-delay:25ms}.lp-panel>:nth-child(3),.lp-tiles>:nth-child(3){animation-delay:50ms}.lp-panel>:nth-child(4),.lp-tiles>:nth-child(4){animation-delay:75ms}.lp-panel>:nth-child(5),.lp-tiles>:nth-child(5){animation-delay:100ms}.lp-panel>:nth-child(6),.lp-tiles>:nth-child(6){animation-delay:125ms}.lp-panel>:nth-child(7),.lp-tiles>:nth-child(7){animation-delay:150ms}.lp-panel>:nth-child(8),.lp-tiles>:nth-child(8){animation-delay:175ms}.lp-panel>:nth-child(9),.lp-tiles>:nth-child(9){animation-delay:200ms}.lp-panel>:nth-child(10),.lp-tiles>:nth-child(10){animation-delay:225ms}.lp-panel>:nth-child(11),.lp-tiles>:nth-child(11){animation-delay:250ms}.lp-panel>:nth-child(12),.lp-tiles>:nth-child(12){animation-delay:275ms}
.lp-panel>:nth-child(n+13){animation-delay:300ms}
@keyframes lppop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
@keyframes lpcas{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.lp-tile{display:flex;flex-direction:column;justify-content:center;gap:7px;min-height:80px;min-width:0;padding:14px;text-align:left;color:#fff;font:inherit;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;cursor:pointer;transition:background .15s}
.lp-tile:hover{background:rgba(255,255,255,.1)}
.lp-tile:disabled{opacity:.4;cursor:default}
.lp-tile:disabled:hover{background:rgba(255,255,255,.05)}
.lp-tlab{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.lp-tval{font-size:17px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-sep{height:1px;background:rgba(255,255,255,.1);margin:16px 0 8px}
.lp-item{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:0 6px;color:#fff;font:inherit;font-size:16px;font-weight:600;text-align:left;background:none;border:0;border-radius:8px;cursor:pointer}
.lp-item:hover{background:rgba(255,255,255,.07)}
.lp-item:disabled{opacity:.4;cursor:not-allowed}
.lp-item:disabled:hover{background:none}
.lp-item.lp-flat{padding:0}
.lp-item.lp-flat:hover{background:none}
.lp-grow{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lp-sub{color:rgba(255,255,255,.5);font-size:13px;font-weight:500;white-space:nowrap}
.lp-ico{color:rgba(255,255,255,.75);flex:none}
.lp-check{color:#fff;flex:none}
.lp-phead{display:flex;align-items:center;gap:6px;margin:-6px 0 8px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.1);font-size:16px;font-weight:700}
.lp-phead button{display:flex;align-items:center;justify-content:center;width:32px;height:32px;margin-left:-8px;color:#fff;background:none;border:0;border-radius:999px;cursor:pointer}
.lp-phead button:hover{background:rgba(255,255,255,.1)}
.lp-switch{position:relative;width:44px;height:24px;border-radius:999px;background:rgba(255,255,255,.2);transition:background .2s;flex:none}
.lp-switch::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}
.lp-switch.on{background:var(--lp)}
.lp-switch.on::after{transform:translateX(20px);background:#111}
.lp-menu{position:absolute;bottom:46px;right:0;background:rgba(15,15,15,.72);backdrop-filter:blur(28px) saturate(1.8);-webkit-backdrop-filter:blur(28px) saturate(1.8);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:6px;display:flex;flex-direction:column;min-width:96px;box-shadow:0 20px 50px rgba(0,0,0,.5)}
.lp-menu button{background:none;border:0;color:#fff;text-align:left;padding:10px 12px;border-radius:8px;cursor:pointer;font-size:14px}
.lp-menu button:hover{background:rgba(255,255,255,.1)}
.lp-menu button.on{color:var(--lp);font-weight:700}
.lp-menu button:disabled{opacity:.45;cursor:not-allowed}
.lp-menu button:disabled:hover{background:none}
.lp-vermenu{min-width:220px;max-height:260px;overflow:auto;scrollbar-width:none}
.lp-panel::-webkit-scrollbar,.lp-vermenu::-webkit-scrollbar{display:none}
.lp-ok{color:var(--lp);font-weight:700}
.lp-dim{opacity:.6}
.lp-speed{position:relative}
.lp-txt{width:auto;padding:0 12px;font-size:14px;font-weight:600}
.lp-verbtn{max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;border:1px solid rgba(255,255,255,.2)}
.lp-toast{position:absolute;top:96px;left:50%;transform:translateX(-50%);z-index:3;background:rgba(0,0,0,.5);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.1);padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;pointer-events:none;white-space:nowrap}
.lp-cues{position:absolute;left:0;right:0;bottom:calc(7% + var(--raise,0%));display:flex;justify-content:center;padding:0 6%;pointer-events:none;transition:bottom .3s ease-out;z-index:1}
.lp-cues.up{bottom:calc(112px + var(--raise,0%))}
.lp-cues span.lp-nobg{background:none;backdrop-filter:none;-webkit-backdrop-filter:none;text-shadow:0 0 3px #000,0 0 3px #000,0 1px 2px #000,0 0 6px rgba(0,0,0,.8)}
.lp-phead .lp-plink{width:auto;height:auto;margin:0 0 0 auto;padding:6px 10px;font-size:14px;font-weight:600;color:rgba(255,255,255,.6)}
.lp-phead .lp-plink:hover{color:#fff}
.lp-field{margin:14px 0}
.lp-flabel{display:flex;justify-content:space-between;align-items:center;font-size:16px;font-weight:600;margin-bottom:12px}
.lp-fval{font-size:14px;font-weight:600;color:rgba(255,255,255,.8)}
.lp-slider{-webkit-appearance:none;appearance:none;display:block;width:100%;height:4px;margin:8px 0;border-radius:999px;cursor:pointer;background:linear-gradient(#fff,#fff) 0 0/var(--v,0%) 100% no-repeat,rgba(255,255,255,.2)}
.lp-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:4px solid #1a1a1a;box-shadow:0 0 0 1px #fff}
.lp-slider::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:#fff;border:4px solid #1a1a1a;box-shadow:0 0 0 1px #fff}
.lp-delay{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px}
.lp-dbtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:48px;border:0;border-radius:8px;background:rgba(255,255,255,.07);color:#fff;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.lp-dbtn:hover{background:rgba(255,255,255,.13)}
.lp-dnum{display:flex;align-items:center;justify-content:center;gap:2px;height:48px;border-radius:8px;background:rgba(255,255,255,.07);font-size:16px;font-weight:700;cursor:text}
.lp-dnum input{width:52px;background:none;border:0;color:#fff;font:inherit;text-align:center;outline:none;-moz-appearance:textfield;appearance:textfield}
.lp-dnum input::-webkit-inner-spin-button,.lp-dnum input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.lp-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:10px;background:rgba(255,255,255,.07)}
.lp-seg button{height:34px;border:0;border-radius:7px;background:none;color:rgba(255,255,255,.6);font-size:14px;font-weight:600;cursor:pointer}
.lp-seg button.on{background:rgba(255,255,255,.16);color:#fff}
.lp-colors{display:flex;align-items:center;justify-content:space-between}
.lp-swatches{display:flex;align-items:center;gap:4px}
.lp-sw{position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:0;border-radius:8px;background:none;color:#fff;cursor:pointer}
.lp-sw.on{background:rgba(255,255,255,.14)}
.lp-sw > span{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;color:#111}
.lp-swc > span{color:#fff}
.lp-sw input[type=color]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0}
.lp-reset{display:block;margin:6px auto 0;background:none;border:0;color:rgba(255,255,255,.55);font:inherit;font-size:13px;font-weight:600;cursor:pointer;padding:6px 10px;border-radius:8px}
.lp-reset:hover{color:#fff;background:rgba(255,255,255,.07)}
.lp-cues span{background:rgba(0,0,0,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;font-size:clamp(15px,2.2vw,32px);font-weight:500;line-height:1.35;padding:.3em .75em;border-radius:8px;text-align:center;white-space:pre-line;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.lp-wait{width:100%;aspect-ratio:16/9;background:#0b0d10;color:#eef1f5;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;text-align:center;padding:20px}
@media (max-width:640px){
  .lp-top{padding:12px 12px 36px}.lp-bottom{padding:40px 12px 6px}
  .lp-grp{gap:2px}.lp-btn{width:36px;height:36px}.lp-btn svg{width:22px;height:22px}
  .lp-time{font-size:12px;padding:0 6px}.lp-vol .lp-range{display:none}.lp-big{width:68px;height:68px}
  .lp-panel{left:8px;right:8px;width:auto;max-width:none;bottom:60px;padding:16px}
  .lp-eppanel{left:8px;right:8px;bottom:60px}
  .lp-next{right:12px;bottom:24px;height:44px;font-size:15px}.lp-next.up{bottom:72px}
  .lp-cues.up{bottom:88px}
}
@media (prefers-reduced-motion:reduce){.lp-top,.lp-bottom,.lp-track,.lp-knob,.lp-big,.lp-shade,.lp-range,.lp-switch,.lp-switch::after,.lp-next,.lp-panel,.lp-eppanel,.lp-panel>*,.lp-tiles>*{transition:none;animation:none}}
`;

/**
 * LemurPlay's movie player. Resolves a playable HLS URL from the backend (polling while a title
 * packages on first play), streams it with hls.js, and wraps it in proper movie-player chrome:
 * auto-hiding controls, seek bar with buffer + hover time, ±10s, volume, speed, PiP, fullscreen,
 * keyboard shortcuts, and resume-where-you-left-off.
 */
export default function LemurVodPlayer({ tmdbId, title, origLang, poster, className, season, episode, onMissing, header, fill, next, episodes }: Props) {
  const isTv = season != null && episode != null;
  const posId = isTv ? `tv:${tmdbId}:${season}:${episode}` : `movie:${tmdbId}`;
  const onMissingRef = useRef(onMissing);
  useEffect(() => { onMissingRef.current = onMissing; }, [onMissing]);
  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; }, [next]);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);
  const scrubRef = useRef(false);
  const uiRef = useRef(true);
  const touchRef = useRef(false);

  const [state, setState] = useState<PlayState>({ s: 'loading' });
  const [repoll, setRepoll] = useState(0);        // bumps to re-ask the backend after a vanished playlist
  const repolled = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fs, setFs] = useState(false);
  const [ui, setUi] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [scrub, setScrub] = useState(false);
  const [panel, setPanel] = useState<Panel>('');
  const panelRef = useRef<Panel>('');
  const [remain, setRemain] = useState(false);          // the clock shows time left instead
  const [subStyle, setSubStyleState] = useState<SubStyle>(SUB_STYLE_DEFAULT);
  useEffect(() => { setSubStyleState(readSubStyle()); }, []);
  const setSubStyle = useCallback((patch: Partial<SubStyle>) => {
    setSubStyleState(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(SUB_STYLE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);
  const subDelay = subStyle.delay;
  const [pipOk, setPipOk] = useState(false);
  const [resumed, setResumed] = useState<number | null>(null);
  const [pickSid, setPickSid] = useState<string>('');  // viewer-picked copy (stream id); '' = by language
  const [verOpen, setVerOpen] = useState(false);
  const verOpenRef = useRef(false);
  const switchPos = useRef<number | null>(null);        // keep the timeline position across a version switch
  // Audio / subtitle tracks INSIDE the current stream (hls.js, or Safari's native HLS).
  const hlsRef = useRef<Hls | null>(null);
  const [audioTracks, setAudioTracks] = useState<Track[]>([]);
  const [audioSel, setAudioSel] = useState(-1);
  const [subTracks, setSubTracks] = useState<Track[]>([]);
  const [subSel, setSubSel] = useState(-1);               // -1 = subtitles off
  const [cue, setCue] = useState('');                     // subtitle text on screen now

  useEffect(() => { uiRef.current = ui; }, [ui]);
  useEffect(() => { panelRef.current = panel; }, [panel]);
  useEffect(() => { verOpenRef.current = verOpen; }, [verOpen]);
  useEffect(() => { setPipOk(typeof document !== 'undefined' && !!document.pictureInPictureEnabled); }, []);

  // ── 1. Resolve a playable URL (poll while the backend packages the title on first play) ───────
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async (attempt = 0) => {
      try {
        // lang = preferred audio language (viewer's last pick, else browser language); v = a
        // specific copy the viewer chose from the version menu.
        const qs = new URLSearchParams({ lang: prefLang() });
        if (pickSid) qs.set('v', pickSid);
        if (origLang) qs.set('orig', origLang);
        const path = isTv ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`;
        const r = await fetch(`/api/vod/play/${path}?${qs}`, { cache: 'no-store' });
        const d = await r.json();
        if (!alive) return;
        // TV: the panel doesn't have this show/episode — let the page fall back to its other sources.
        if (isTv && r.status === 404) { onMissingRef.current?.(); setState({ s: 'unavailable' }); return; }
        // 404 = not in the catalog; disabled = VOD switched off; unavailable = no copy in this
        // language is browser-decodable (HEVC/10-bit) — offer the other versions instead.
        if (r.status === 404 || d.status === 'disabled' || d.status === 'unavailable') {
          setState({ s: 'unavailable', versions: d.versions, reason: d.reason }); return;
        }
        if (d.status === 'ready' && d.url) { setState({ s: 'ready', url: d.url, sid: d.sid, versions: d.versions, duration: Number(d.duration) || 0 }); return; }
        if (d.status === 'preparing') {
          setState({ s: 'preparing', versions: d.versions });
          // The backend long-polls ~8s for the first segment, so re-ask promptly while a title is fresh;
          // back off only once it's clearly queued behind other pulls.
          timer = setTimeout(() => poll(attempt + 1), attempt < 15 ? 1000 : Math.min(6000, 2000 + attempt * 500));
          return;
        }
        setState({ s: 'error', msg: d.error || 'could not start playback' });
      } catch {
        if (alive) setState({ s: 'error', msg: 'backend unreachable' });
      }
    };
    poll();
    return () => { alive = false; clearTimeout(timer); };
  }, [tmdbId, isTv, season, episode, pickSid, origLang, repoll]);

  // ── 2. Attach the stream. hls.js (MSE) FIRST — never trust canPlayType for HLS: Chromium on
  //       Windows answers "maybe" yet can't play an m3u8 natively. Native HLS only where there is
  //       no MSE at all (iOS Safari), where it genuinely works. ────────────────────────────────────
  useEffect(() => {
    if (state.s !== 'ready' || !videoRef.current) return;
    const video = videoRef.current;
    const sw = switchPos.current; switchPos.current = null;      // a version switch keeps the position
    const saved = sw != null ? sw : readSaved(posId);
    const start = () => {
      if (saved && sw == null) { setResumed(saved); setTimeout(() => setResumed(null), 3500); }
      video.play().catch(() => { video.muted = true; setMuted(true); video.play().catch(() => {}); });
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true, lowLatencyMode: false, maxBufferLength: 30, backBufferLength: 60,
        startPosition: saved || -1,          // resume where they left off, else from the top
        enableCEA708Captions: false,         // only the stream's own subtitle tracks, drawn by us
      });
      hlsRef.current = hls;
      // Subtitles are drawn by the player (above the controls), not by the browser: hls.js keeps the
      // chosen track's cues coming with the text track 'hidden', and we render its active cues.
      hls.subtitleDisplay = false;
      let recovered = false;
      hls.loadSource(state.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, start);
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        setAudioTracks(toTracks(hls.audioTracks.map(t => ({ name: t.name, lang: t.lang, ch: t.attrs?.CHANNELS }))));
        const want = readKey(AUDIO_KEY);                // the language the viewer picked last time
        const i = want ? hls.audioTracks.findIndex(t => lang2(t.lang) === want) : -1;
        if (i >= 0 && i !== hls.audioTrack) hls.audioTrack = i;
        setAudioSel(hls.audioTrack);
      });
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHING, (_e, d) => setAudioSel(d.id));
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_e, d) => setAudioSel(d.id));
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        setSubTracks(toTracks(hls.subtitleTracks.map(t => ({ name: t.name, lang: t.lang }))));
        // Off unless the viewer turned subtitles on in this language before.
        const want = readKey(SUBS_KEY);
        const i = want && want !== 'off' ? hls.subtitleTracks.findIndex(t => lang2(t.lang) === want) : -1;
        hls.subtitleTrack = i;
        setSubSel(i);
      });
      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_e, d) => setSubSel(d.id));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        // Playlist vanished (e.g. the R2 cache was wiped after the backend cached it as ready):
        // ask the backend once more — it forgets the stale entry and re-packages.
        if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR && !repolled.current) {
          repolled.current = true; hls.destroy(); setState({ s: 'loading' }); setRepoll(r => r + 1); return;
        }
        // Standard hls.js recovery: one network retry / one media nudge before giving up.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !recovered) { recovered = true; hls.startLoad(); return; }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return; }
        hls.destroy();
        setState({ s: 'error', msg: `playback error (${data.type})` });
      });
      return () => {
        hls.destroy(); hlsRef.current = null;
        setAudioTracks([]); setSubTracks([]); setAudioSel(-1); setSubSel(-1); setCue('');
      };
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari's own HLS: the stream's tracks show up as video.audioTracks / video.textTracks.
      video.src = state.url;
      const al = nativeAudio(video);
      const syncAudio = () => {
        if (!al) return;
        const arr = Array.from({ length: al.length }, (_, i) => al[i]);
        setAudioTracks(toTracks(arr.map(t => ({ name: t.label, lang: t.language }))));
        setAudioSel(arr.findIndex(t => t.enabled));
      };
      const syncSubs = () => {
        const arr = subTextTracks(video);
        setSubTracks(toTracks(arr.map(t => ({ name: t.label, lang: t.language }))));
        const want = readKey(SUBS_KEY);
        const pick = want && want !== 'off' ? arr.findIndex(t => lang2(t.language) === want) : -1;
        arr.forEach((t, j) => { t.mode = j === pick ? 'hidden' : 'disabled'; });   // we draw the cues
        setSubSel(pick);
      };
      const onMeta = () => {
        if (saved) video.currentTime = saved;
        const want = readKey(AUDIO_KEY);
        if (al && want) {
          const arr = Array.from({ length: al.length }, (_, i) => al[i]);
          const i = arr.findIndex(t => lang2(t.language) === want);
          if (i >= 0) arr.forEach((t, j) => { t.enabled = j === i; });
        }
        syncAudio(); syncSubs(); start();
      };
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      al?.addEventListener('change', syncAudio);
      video.textTracks.addEventListener('addtrack', syncSubs);
      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
        al?.removeEventListener('change', syncAudio);
        video.textTracks.removeEventListener('addtrack', syncSubs);
        setAudioTracks([]); setSubTracks([]); setAudioSel(-1); setSubSel(-1); setCue('');
      };
    }
    setState({ s: 'error', msg: 'HLS not supported in this browser' });
  }, [state, posId]);

  // ── 3. Mirror <video> state into the UI ──────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.s !== 'ready') return;
    // TV: the episode counts as watched once 92 % is behind (end credits) or it ends.
    let marked = false;
    const seen = () => {
      if (marked || !isTv) return;
      marked = true;
      markWatched(Number(tmdbId), season!, episode!);
    };
    const updBuf = () => {
      const b = v.buffered; let end = 0;
      for (let i = 0; i < b.length; i++) if (b.start(i) <= v.currentTime + 0.5 && b.end(i) > end) end = b.end(i);
      setBuf(end);
    };
    const onTime = () => {
      if (!scrubRef.current) setCur(v.currentTime);
      updBuf();
      if (v.duration > 0 && v.currentTime / v.duration >= 0.92) seen();
      const now = Date.now();
      if (now - lastSave.current > 5000 && v.currentTime > 5) {
        lastSave.current = now;
        try { localStorage.setItem(posKey(posId), String(v.currentTime)); } catch { /* private mode */ }
      }
    };
    const onDur = () => setDur(v.duration);
    const onPlay = () => { setPlaying(true); setEnded(false); };
    const onPause = () => setPlaying(false);
    const onWait = () => setBuffering(true);
    const onGo = () => setBuffering(false);
    const onVol = () => { setVol(v.volume); setMuted(v.muted); };
    const onRate = () => setSpeed(v.playbackRate);
    const onEnd = () => {
      setEnded(true); setPlaying(false);
      try { localStorage.removeItem(posKey(posId)); } catch { /* ignore */ }
      seen();
      nextRef.current?.go();                    // TV: on to the next episode
    };
    const pairs: [string, EventListener][] = [
      ['timeupdate', onTime], ['progress', updBuf], ['durationchange', onDur], ['loadedmetadata', onDur],
      ['play', onPlay], ['pause', onPause], ['waiting', onWait], ['playing', onGo], ['canplay', onGo],
      ['volumechange', onVol], ['ratechange', onRate], ['ended', onEnd],
    ];
    pairs.forEach(([e, f]) => v.addEventListener(e, f));
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => { pairs.forEach(([e, f]) => v.removeEventListener(e, f)); document.removeEventListener('fullscreenchange', onFs); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tmdbId/season/episode are what posId is made of
  }, [state.s, posId]);

  // ── 4. Subtitles on screen: the chosen text track is 'hidden' (cues load, the browser draws
  //       nothing); its active cues become our caption line, which moves up over the controls. ─────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.s !== 'ready') return;
    const tl = v.textTracks;
    let bound: TextTrack | null = null;
    const onCue = () => {
      if (subDelay) {
        // Shifted: the cues active at (now - delay). The track holds cues well ahead of playback.
        const t = v.currentTime - subDelay;
        const all = bound?.cues;
        const on: TextTrackCue[] = [];
        if (all) for (let i = 0; i < all.length; i++) { const c = all[i]; if (c.startTime <= t && c.endTime > t) on.push(c); }
        setCue(on.map(cueText).filter(Boolean).join('\n'));
        return;
      }
      const cues = bound?.activeCues;
      setCue(cues && cues.length ? Array.from(cues).map(cueText).filter(Boolean).join('\n') : '');
    };
    // cuechange only fires on the track's own timing, so a delay needs its own clock.
    const tick = subDelay ? setInterval(onCue, 100) : null;
    const bind = () => {
      const t = subSel >= 0 ? subTextTracks(v).find(x => x.mode === 'hidden') || null : null;
      if (t === bound) return;
      bound?.removeEventListener('cuechange', onCue);
      bound = t;
      bound?.addEventListener('cuechange', onCue);
      onCue();
    };
    bind();
    tl.addEventListener('change', bind);
    tl.addEventListener('addtrack', bind);
    return () => {
      if (tick) clearInterval(tick);
      bound?.removeEventListener('cuechange', onCue);
      tl.removeEventListener('change', bind);
      tl.removeEventListener('addtrack', bind);
      setCue('');
    };
  }, [state.s, subSel, subDelay]);

  // ── controls visibility ───────────────────────────────────────────────────────────────────────
  const wake = useCallback(() => {
    setUi(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended && !panelRef.current && !verOpenRef.current && !scrubRef.current) setUi(false);
    }, HIDE_AFTER);
  }, []);
  useEffect(() => { if (!playing) setUi(true); else wake(); }, [playing, wake]);
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // ── actions ───────────────────────────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    if (v.ended) v.currentTime = 0;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  }, []);
  const seekBy = useCallback((d: number) => {
    const v = videoRef.current; if (!v) return;
    const max = isFinite(v.duration) ? v.duration : Infinity;
    v.currentTime = Math.min(Math.max(0, v.currentTime + d), max);
    setCur(v.currentTime);
  }, []);
  const setVolume = useCallback((n: number) => {
    const v = videoRef.current; if (!v) return;
    v.volume = Math.min(1, Math.max(0, n)); v.muted = v.volume === 0;
  }, []);
  const toggleMute = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; if (!v.muted && v.volume === 0) v.volume = 0.5;
  }, []);
  const toggleFs = useCallback(() => {
    const root = rootRef.current; const v = videoRef.current as IOSVideo | null;
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (root?.requestFullscreen) root.requestFullscreen().catch(() => {});
    else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen();   // iOS: only the video can go fullscreen
  }, []);
  const togglePip = useCallback(async () => {
    const v = videoRef.current; if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { /* not allowed / not supported */ }
  }, []);

  // ── audio / subtitle tracks of the current stream (instant, no reload) ────────────────────────
  const chooseAudio = useCallback((t: Track) => {
    setPanel('');
    if (t.lang) writeKey(AUDIO_KEY, t.lang);
    const hls = hlsRef.current; const v = videoRef.current;
    // Marked at once: hls.js only reports SWITCHED after the new track's first segment is buffered.
    if (hls) { hls.audioTrack = t.id; setAudioSel(t.id); return; }
    const al = v ? nativeAudio(v) : null;
    if (al) { for (let j = 0; j < al.length; j++) al[j].enabled = j === t.id; setAudioSel(t.id); }
  }, []);
  const chooseSub = useCallback((id: number, keepOpen = false) => {   // -1 = off
    if (!keepOpen) setPanel('');
    const t = subTracks.find(x => x.id === id);
    writeKey(SUBS_KEY, id < 0 ? 'off' : (t?.lang || 'off'));
    if (t?.lang) writeKey(SUBS_LAST_KEY, t.lang);
    const hls = hlsRef.current; const v = videoRef.current;
    if (hls) { hls.subtitleTrack = id; setSubSel(id); return; }
    if (v) subTextTracks(v).forEach((x, j) => { x.mode = j === id ? 'hidden' : 'disabled'; });
    setSubSel(id);
  }, [subTracks]);
  const toggleSubs = useCallback(() => {           // 'c': off <-> the remembered language (else the first)
    if (!subTracks.length) return;
    if (subSel >= 0) { chooseSub(-1, true); return; }
    const want = readKey(SUBS_LAST_KEY);
    const t = subTracks.find(x => x.lang === want) || subTracks[0];
    chooseSub(t.id, true);
  }, [subTracks, subSel, chooseSub]);
  const openPanel = (p: Panel) => {
    setPanel(cur => (cur === p ? '' : p)); setVerOpen(false); wake();
  };

  // ── versions: the same film in other audio languages / qualities ──────────────────────────────
  const chooseVersion = useCallback((ver: Version) => {
    setVerOpen(false); setPanel('');
    if (ver.current) return;
    const vid = videoRef.current;
    switchPos.current = vid && vid.currentTime > 5 ? vid.currentTime : null;   // carry the position over
    try { if (ver.lang) localStorage.setItem(LANG_KEY, ver.lang); } catch { /* ignore */ }
    setState({ s: 'loading' });
    setPickSid(ver.sid);
  }, []);
  const versions: Version[] = (state.s === 'ready' || state.s === 'preparing' || state.s === 'unavailable') ? (state.versions || []) : [];
  const currentVer = versions.find(x => x.current);
  const verLabel = currentVer ? `${currentVer.label} · ${currentVer.quality}` : 'Version';
  const renderVersionMenu = () => (
    <div className="lp-menu lp-vermenu" role="menu">
      {versions.map(ver => (
        <button
          type="button" key={ver.sid} role="menuitem" className={ver.current ? 'on' : ''}
          disabled={ver.state === 'bad'} onClick={() => chooseVersion(ver)} title={ver.name}
        >
          <span>{ver.label}</span><span className="lp-dim"> · {ver.quality}</span>
          {ver.state === 'ready' && <span className="lp-ok"> ✓</span>}
          {ver.state === 'bad' && <span className="lp-dim"> · not playable</span>}
        </button>
      ))}
    </div>
  );

  // ── settings panel: tiles (quality / audio / subtitles / speed), each opening its list ──────
  const audioName = audioTracks.find(t => t.id === audioSel)?.label || currentVer?.label || 'Default';
  const subName = subSel >= 0 ? (subTracks.find(t => t.id === subSel)?.label || 'On') : 'Off';
  const speedName = (x: number) => (x === 1 ? 'Normal' : `${x}×`);
  const head = (label: string, extra?: ReactNode, back: Panel = 'main') => (
    <div className="lp-phead">
      <button type="button" onClick={() => setPanel(back)} aria-label="Back"><Ico d={I.chevL} size={22} /></button>
      {label}
      {extra}
    </div>
  );
  const sliderFill = (val: number, min: number, max: number) => ({ '--v': `${((val - min) / (max - min)) * 100}%` }) as CSSProperties;
  const nudgeDelay = (d: number) => setSubStyle({ delay: Math.round(Math.min(20, Math.max(-20, subDelay + d)) * 10) / 10 });
  const item = (key: string | number, label: ReactNode, on: boolean, onClick: () => void, extra?: ReactNode, disabled?: boolean) => (
    <button type="button" key={key} aria-pressed={on} className="lp-item" onClick={onClick} disabled={disabled}>
      <span className="lp-grow">{label}</span>
      {extra}
      {on && <Ico d={I.check} size={20} className="lp-check" />}
    </button>
  );
  const renderPanel = () => {
    if (panel === 'quality') return <>
      {head('Quality & language')}
      {versions.map(ver => item(
        ver.sid, <>{ver.label}<span className="lp-sub"> · {ver.quality}</span></>, !!ver.current, () => chooseVersion(ver),
        ver.state === 'bad' ? <span className="lp-sub">not playable</span> : null, ver.state === 'bad',
      ))}
    </>;
    if (panel === 'audio') return <>
      {head('Audio')}
      {audioTracks.map(t => item(t.id, t.label, t.id === audioSel, () => chooseAudio(t)))}
    </>;
    if (panel === 'subs') return <>
      {head('Subtitles', <button type="button" className="lp-plink" onClick={() => setPanel('subStyle')}>Customize</button>)}
      {item('off', 'Off', subSel < 0, () => chooseSub(-1))}
      {subTracks.map(t => item(t.id, t.label, t.id === subSel, () => chooseSub(t.id)))}
    </>;
    if (panel === 'subStyle') return <>
      {head('Subtitle settings')}
      <div className="lp-field">
        <div className="lp-flabel">Subtitle delay</div>
        <input
          type="range" min={-20} max={20} step={0.1} value={subDelay} aria-label="Subtitle delay (seconds)"
          className="lp-slider" style={sliderFill(subDelay, -20, 20)}
          onChange={(e) => setSubStyle({ delay: Math.round(parseFloat(e.target.value) * 10) / 10 })}
        />
        <div className="lp-delay">
          <button type="button" className="lp-dbtn" onClick={() => nudgeDelay(-0.1)} title="Subtitles come too late: show them earlier">
            <Ico d={I.chevL} size={14} />Heard audio
          </button>
          <label className="lp-dnum">
            <input
              type="number" min={-20} max={20} step={0.1} value={subDelay} aria-label="Subtitle delay in seconds"
              onChange={(e) => { const n = parseFloat(e.target.value); if (isFinite(n)) setSubStyle({ delay: Math.min(20, Math.max(-20, n)) }); }}
            />
            <span className="lp-sub">s</span>
          </label>
          <button type="button" className="lp-dbtn" onClick={() => nudgeDelay(0.1)} title="Subtitles come too early: show them later">
            <Ico d={I.chevR} size={14} />Saw caption
          </button>
        </div>
      </div>
      <div className="lp-sep" />
      <div className="lp-field">
        <div className="lp-flabel">Font</div>
        <div className="lp-seg" role="radiogroup" aria-label="Subtitle font">
          {SUB_FONTS.map(f => (
            <button
              type="button" key={f.id} role="radio" aria-checked={subStyle.font === f.id}
              className={subStyle.font === f.id ? 'on' : ''} style={f.css ? { fontFamily: f.css } : undefined}
              onClick={() => setSubStyle({ font: f.id })}
            >{f.label}</button>
          ))}
        </div>
      </div>
      <div className="lp-field">
        <div className="lp-flabel">Text size<span className="lp-fval">{subStyle.size}%</span></div>
        <input
          type="range" min={50} max={200} step={5} value={subStyle.size} aria-label="Subtitle size"
          className="lp-slider" style={sliderFill(subStyle.size, 50, 200)}
          onChange={(e) => setSubStyle({ size: parseInt(e.target.value, 10) })}
        />
      </div>
      <div className="lp-field">
        <div className="lp-flabel">Position<span className="lp-fval">{subStyle.raise ? `+${subStyle.raise}%` : 'Default'}</span></div>
        <input
          type="range" min={0} max={50} step={1} value={subStyle.raise} aria-label="Raise subtitles"
          className="lp-slider" style={sliderFill(subStyle.raise, 0, 50)}
          onChange={(e) => setSubStyle({ raise: parseInt(e.target.value, 10) })}
        />
      </div>
      <button type="button" role="switch" aria-checked={subStyle.bg} className="lp-item lp-flat" onClick={() => setSubStyle({ bg: !subStyle.bg })}>
        <span className="lp-grow">Background</span>
        <span className={`lp-switch ${subStyle.bg ? 'on' : ''}`} aria-hidden="true" />
      </button>
      <div className="lp-field lp-colors">
        <div className="lp-flabel" style={{ marginBottom: 0 }}>Color</div>
        <div className="lp-swatches">
          {SUB_COLORS.map(c => (
            <button
              type="button" key={c} className={`lp-sw ${subStyle.color.toLowerCase() === c ? 'on' : ''}`}
              aria-label={`Subtitle colour ${c}`} aria-pressed={subStyle.color.toLowerCase() === c}
              onClick={() => setSubStyle({ color: c })}
            >
              <span style={{ background: c }}>{subStyle.color.toLowerCase() === c && <Ico d={I.check} size={16} />}</span>
            </button>
          ))}
          <label className={`lp-sw lp-swc ${SUB_COLORS.includes(subStyle.color.toLowerCase()) ? '' : 'on'}`} title="Custom colour">
            <span style={SUB_COLORS.includes(subStyle.color.toLowerCase()) ? undefined : { background: subStyle.color }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.71 5.63 18.37 3.3a1 1 0 0 0-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12a1 1 0 0 0 .01-1.42zM6.92 19 5 17.08l8.06-8.06 1.92 1.92L6.92 19z" /></svg>
            </span>
            <input type="color" value={subStyle.color} aria-label="Custom subtitle colour" onChange={(e) => setSubStyle({ color: e.target.value })} />
          </label>
        </div>
      </div>
      <button type="button" className="lp-reset" onClick={() => setSubStyle(SUB_STYLE_DEFAULT)}>Reset to default</button>
    </>;
    if (panel === 'speed') return <>
      {head('Playback speed')}
      {SPEEDS.map(x => item(x, speedName(x), x === speed, () => {
        if (videoRef.current) videoRef.current.playbackRate = x;
        setPanel(''); wake();
      }))}
    </>;
    return <>
      <div className="lp-tiles">
        <Tile icon={I.hd} label="Quality" value={currentVer?.quality || 'Auto'} disabled={versions.length < 2} onClick={() => setPanel('quality')} />
        <Tile
          icon={I.audio} label="Audio" value={audioName} disabled={audioTracks.length < 2 && versions.length < 2}
          onClick={() => setPanel(audioTracks.length > 1 ? 'audio' : 'quality')}
        />
        <Tile icon={I.subs} label="Subtitles" value={subName} disabled={!subTracks.length} onClick={() => setPanel('subs')} />
        <Tile icon={I.speed} label="Speed" value={speedName(speed)} onClick={() => setPanel('speed')} />
      </div>
      {subTracks.length > 0 && <>
        <div className="lp-sep" />
        <button type="button" role="switch" aria-checked={subSel >= 0} className="lp-item" onClick={toggleSubs}>
          <Ico d={I.subs} className="lp-ico" />
          <span className="lp-grow">Enable Subtitles</span>
          <span className={`lp-switch ${subSel >= 0 ? 'on' : ''}`} aria-hidden="true" />
        </button>
        <button type="button" className="lp-item" onClick={() => setPanel('subStyle')}>
          <Ico d={I.textSize} className="lp-ico" />
          <span className="lp-grow">Subtitle settings</span>
          <Ico d={I.chevR} size={20} className="lp-ico" />
        </button>
      </>}
    </>;
  };

  // ── keyboard ──────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.s !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const v = videoRef.current;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); toggle(); break;
        case 'ArrowLeft': case 'j': e.preventDefault(); seekBy(-SKIP); break;
        case 'ArrowRight': case 'l': e.preventDefault(); seekBy(SKIP); break;
        case 'ArrowUp': e.preventDefault(); setVolume((v?.volume ?? 1) + 0.1); break;
        case 'ArrowDown': e.preventDefault(); setVolume((v?.volume ?? 1) - 0.1); break;
        case 'm': toggleMute(); break;
        case 'f': toggleFs(); break;
        case 'c': toggleSubs(); break;
        case 'Escape': setPanel(''); setVerOpen(false); return;
        default: return;
      }
      wake();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.s, toggle, seekBy, setVolume, toggleMute, toggleFs, toggleSubs, wake]);

  // ── seek bar ──────────────────────────────────────────────────────────────────────────────────
  const frac = (e: RPointerEvent<HTMLDivElement>) => {
    const r = barRef.current?.getBoundingClientRect(); if (!r || !r.width) return 0;
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  const seekFrac = (f: number) => {
    const v = videoRef.current; if (!v || !full) return;
    // can't seek into the part that hasn't been packaged yet — clamp to the packaged edge
    const t = Math.min(f * full, packaging ? Math.max(0, dur - 0.5) : f * full);
    v.currentTime = t; setCur(t);
  };
  const onBarDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubRef.current = true; setScrub(true);
    const f = frac(e); setHover(f * full); seekFrac(f); wake();
  };
  const onBarMove = (e: RPointerEvent<HTMLDivElement>) => {
    const f = frac(e); setHover(f * full);
    if (scrubRef.current) seekFrac(f);
  };
  const onBarUp = (e: RPointerEvent<HTMLDivElement>) => {
    scrubRef.current = false; setScrub(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    wake();
  };
  const onBarLeave = () => { if (!scrubRef.current) setHover(null); };

  // On touch, the first tap should reveal the controls, not pause the film.
  const onVideoClick = () => {
    if (touchRef.current && !uiRef.current) { wake(); return; }
    toggle(); wake();
  };

  // ── pre-playback states: spinner / unavailable / error ────────────────────────────────────────
  if (state.s !== 'ready') {
    return (
      <div className={`lp-player ${className || ''}`} style={header ? { position: 'relative' } : undefined}>
        <style>{CSS}</style>
        {header && <div className="lp-top lp-show" style={{ zIndex: 1 }}>{header}</div>}
        <div
          className="lp-wait"
          style={{
            ...(fill ? { height: '100%', aspectRatio: 'auto' } : null),
            ...(poster ? { backgroundImage: `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.75)),url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' } : null),
          }}
        >
          {(state.s === 'loading' || state.s === 'preparing') && <div className="lp-spin" role="status" aria-label="Loading" />}
          {state.s === 'unavailable' && (
            <div style={{ opacity: 0.9 }}>
              {versions.length > 1 ? 'This version can’t play in a browser — pick another:' : 'Not available to stream yet.'}
            </div>
          )}
          {(state.s === 'unavailable' || state.s === 'preparing') && versions.length > 1 && (
            <div className="lp-speed" style={{ marginTop: 6 }}>
              <button type="button" className="lp-btn lp-txt lp-verbtn" onClick={() => setVerOpen(o => !o)} aria-haspopup="menu" aria-expanded={verOpen}>
                {verLabel} ▾
              </button>
              {verOpen && renderVersionMenu()}
            </div>
          )}
          {state.s === 'error' && <div style={{ color: '#f5a524' }}>⚠ {state.msg}</div>}
        </div>
      </div>
    );
  }

  // While a title is still packaging, video.duration is only what has been packaged so far;
  // the backend tells us the film's real length so the bar and clock show the whole film.
  const full = Math.max(dur || 0, (state.s === 'ready' && state.duration) || 0);
  const packaging = full > (dur || 0) + 1;
  const pct = full ? (cur / full) * 100 : 0;
  const bpct = full ? Math.max(pct, (buf / full) * 100) : 0;
  const apct = full && packaging ? (dur / full) * 100 : 0;
  const showUi = ui || !playing;
  // The next-episode button: the last 2 minutes (less on short episodes, at least 30 s).
  const left = full - cur;
  const showNext = full > 0 && !ended && left > 0.5 && left <= Math.min(120, Math.max(30, full * 0.06));

  return (
    <div
      ref={rootRef}
      className={`lp-player relative w-full h-full bg-black overflow-hidden select-none ${className || ''}`}
      style={{ cursor: showUi ? undefined : 'none' }}
      onMouseMove={wake}
      onMouseLeave={() => { if (playing && !scrubRef.current) setUi(false); }}
      onTouchStart={() => { touchRef.current = true; wake(); }}
    >
      <style>{CSS}</style>
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="auto"
        className="w-full h-full"
        style={{ background: '#000', objectFit: 'contain', display: 'block' }}
        onClick={onVideoClick}
        onDoubleClick={toggleFs}
      />

      <div className={`lp-shade ${!playing && !ended && !buffering && cur > 0.5 ? 'on' : ''}`} />

      {buffering && !ended && (
        <div className="lp-center"><div className="lp-spin" role="status" aria-label="Buffering" /></div>
      )}

      {/* Paused mid-film the picture just dims; the big button is for the very start and the end. */}
      {!playing && !buffering && (ended || cur < 0.5) && (
        <div className="lp-center">
          <button type="button" className="lp-big" onClick={toggle} aria-label={ended ? 'Replay' : 'Play'}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" aria-hidden="true">{ended ? I.replay : I.play}</svg>
          </button>
        </div>
      )}

      {subStyle.font === 'montserrat' && (
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap" precedence="default" />
      )}
      {cue && (
        <div
          className={`lp-cues ${showUi ? 'up' : ''}`} aria-live="off"
          style={{ '--raise': `${subStyle.raise}%` } as CSSProperties}
        >
          <span
            className={subStyle.bg ? '' : 'lp-nobg'}
            style={{
              color: subStyle.color,
              fontFamily: SUB_FONTS.find(f => f.id === subStyle.font)?.css,
              fontSize: `calc(clamp(15px, 2.2vw, 32px) * ${subStyle.size / 100})`,
            }}
          >{cue}</span>
        </div>
      )}

      {resumed != null && <div className="lp-toast">Resumed from {fmt(resumed)}</div>}

      <div className={`lp-top ${showUi ? 'lp-show' : ''}`}>
        {header ?? (title && <div className="lp-title">{title}</div>)}
      </div>

      {panel && <div className="lp-shield" onClick={() => setPanel('')} />}
      {panel === 'episodes' && episodes && <div className="lp-eppanel" role="dialog" aria-label="Episodes">{episodes}</div>}
      {panel && panel !== 'episodes' && <div className="lp-panel" role="dialog" aria-label="Player settings">{renderPanel()}</div>}

      {/* TV: the last stretch (end credits) offers the next episode, controls up or not. */}
      {next && showNext && (
        <button type="button" className={`lp-next ${showUi ? 'up' : ''}`} onClick={next.go}>
          {next.label || 'Next Episode'}<Ico d={I.skipNext} size={22} />
        </button>
      )}

      <div className={`lp-bottom ${showUi ? 'lp-show' : ''}`}>
        <div
          ref={barRef}
          className={`lp-bar ${scrub ? 'scrub' : ''}`}
          role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.floor(full)} aria-valuenow={Math.floor(cur)} aria-valuetext={fmt(cur)}
          onPointerDown={onBarDown} onPointerMove={onBarMove} onPointerUp={onBarUp} onPointerCancel={onBarUp} onPointerLeave={onBarLeave}
        >
          <div className="lp-track">
            {packaging && <div className="lp-avail" style={{ width: `${apct}%` }} />}
            <div className="lp-buf" style={{ width: `${bpct}%` }} />
            <div className="lp-played" style={{ width: `${pct}%` }} />
          </div>
          <div className="lp-knob" style={{ left: `${pct}%` }} />
          {hover != null && full > 0 && (
            <div className="lp-tip" style={{ left: `clamp(30px, ${(hover / full) * 100}%, calc(100% - 30px))` }}>{fmt(hover)}</div>
          )}
        </div>

        <div className="lp-row">
          <div className="lp-grp">
            <Btn onClick={toggle} label={playing ? 'Pause (k)' : 'Play (k)'}>{playing ? I.pause : I.play}</Btn>
            <Btn onClick={() => { seekBy(-SKIP); wake(); }} label="Back 10 seconds (←)">{I.back}</Btn>
            <Btn onClick={() => { seekBy(SKIP); wake(); }} label="Forward 10 seconds (→)">{I.fwd}</Btn>
            <div className="lp-vol">
              <Btn onClick={toggleMute} label={muted ? 'Unmute (m)' : 'Mute (m)'}>{muted || vol === 0 ? I.muted : I.volume}</Btn>
              <input
                type="range" min={0} max={1} step={0.02} value={muted ? 0 : vol}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume" className="lp-range"
                style={{ '--v': `${(muted ? 0 : vol) * 100}%` } as CSSProperties}
              />
            </div>
            <button
              type="button" className="lp-time" onClick={() => setRemain(r => !r)}
              title={remain ? 'Show elapsed time' : 'Show time left'}
            >
              {remain ? `-${fmt(Math.max(0, full - cur))}` : `${fmt(cur)} / ${fmt(full)}`}
            </button>
          </div>
          <div className="lp-grp">
            {episodes && (
              <Btn onClick={() => openPanel('episodes')} label="Episodes" active={panel === 'episodes'} expanded={panel === 'episodes'}>{I.episodes}</Btn>
            )}
            {pipOk && <Btn onClick={togglePip} label="Picture in picture">{I.pip}</Btn>}
            {versions.length > 1 && (
              <Btn onClick={() => openPanel('quality')} label="Quality & language" active={panel === 'quality'} expanded={panel === 'quality'}>{I.cloud}</Btn>
            )}
            {subTracks.length > 0 && (
              <Btn onClick={() => openPanel('subs')} label="Subtitles (c)" active={panel === 'subs'} expanded={panel === 'subs'}>{I.subs}</Btn>
            )}
            <Btn onClick={() => openPanel('main')} label="Settings" active={panel === 'main' || panel === 'audio' || panel === 'speed' || panel === 'subStyle'} expanded={panel !== ''}>{I.gear}</Btn>
            <Btn onClick={toggleFs} label={fs ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}>{fs ? I.fsExit : I.fs}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
