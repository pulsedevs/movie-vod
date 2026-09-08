'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent, ReactNode } from 'react';
import Hls from 'hls.js';

interface Props {
  tmdbId: number | string;
  title?: string;
  /** Film's original language (TMDB ISO-639-1); the backend accepts original OR English audio. */
  origLang?: string;
  poster?: string;
  className?: string;
}

/** One selectable copy of the film — audio language × quality — plus its packaging state. */
export interface Version {
  sid: string; lang: string; label: string; quality: string; name: string;
  state: 'ready' | 'streaming' | 'packaging' | 'bad' | 'none'; reason?: string; current?: boolean;
}

type PlayState =
  | { s: 'loading' }
  | { s: 'preparing'; versions?: Version[] }
  | { s: 'ready'; url: string; sid?: string; versions?: Version[] }
  | { s: 'unavailable'; versions?: Version[]; reason?: string }
  | { s: 'error'; msg: string };

interface IOSVideo extends HTMLVideoElement { webkitEnterFullscreen?: () => void }

const LANG_KEY = 'lp:lang';
/** Preferred audio language: what the viewer last picked, else the browser's language. */
const prefLang = (): string => {
  try { const s = localStorage.getItem(LANG_KEY); if (s) return s; } catch { /* ignore */ }
  try { return (navigator.language || 'en').slice(0, 2).toLowerCase(); } catch { return 'en'; }
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP = 10;                       // seconds per ←/→ and the skip buttons
const HIDE_AFTER = 2600;               // ms of stillness before controls fade (while playing)
const posKey = (id: number | string) => `lp:pos:movie:${id}`;

const fmt = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  return (h ? `${h}:` : '') + (h ? String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
};

// Remembered position for "resume where you left off" (ignored for the first 30s / last minute).
const readSaved = (id: number | string): number => {
  try { const n = parseFloat(localStorage.getItem(posKey(id)) || '0'); return isFinite(n) && n > 30 ? n : 0; } catch { return 0; }
};

// ── icons (24×24, currentColor) ──────────────────────────────────────────────────────────────────
const I = {
  play: <path d="M8 5v14l11-7z" />,
  pause: <path d="M6 5h4v14H6zm8 0h4v14h-4z" />,
  replay: <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />,
  back: <>
    <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
    <text x="9" y="15.5" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none">10</text>
  </>,
  fwd: <>
    <path d="M12 5V1l5 5-5 5V7a5 5 0 1 0 5 5h2a7 7 0 1 1-7-7z" />
    <text x="8.6" y="15.5" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none">10</text>
  </>,
  volume: <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />,
  muted: <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.5 2.5v-.7zM19 12a7 7 0 0 1-1.3 4.1l1.5 1.5A9 9 0 0 0 21 12a9 9 0 0 0-7-8.8v2.1A7 7 0 0 1 19 12zM4.3 3 3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3a7 7 0 0 1-2.3 1.2v2.1a9 9 0 0 0 3.7-1.8l2 2 1.3-1.3L4.3 3zM12 4 9.9 6.1 12 8.2V4z" />,
  fs: <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />,
  fsExit: <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />,
  pip: <path d="M19 11h-8v6h8v-6zm4 8V5c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 0H3V5h18v14z" />,
};

function Btn({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" className="lp-btn" onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">{children}</svg>
    </button>
  );
}

const CSS = `
.lp-player{--lp:#4ade80;color:#fff;font-size:14px;line-height:1}
.lp-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.lp-big{pointer-events:auto;background:rgba(0,0,0,.55);border:0;border-radius:999px;width:84px;height:84px;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);transition:transform .15s,background .15s}
.lp-big:hover{transform:scale(1.06);background:rgba(0,0,0,.7)}
.lp-spin{width:54px;height:54px;border-radius:50%;border:4px solid rgba(255,255,255,.18);border-top-color:#fff;animation:lpspin .8s linear infinite}
@keyframes lpspin{to{transform:rotate(360deg)}}
.lp-top,.lp-bottom{position:absolute;left:0;right:0;opacity:0;transition:opacity .25s;pointer-events:none}
.lp-top{top:0;padding:14px 18px 34px;background:linear-gradient(rgba(0,0,0,.7),transparent)}
.lp-bottom{bottom:0;padding:24px 14px 8px;background:linear-gradient(transparent,rgba(0,0,0,.85))}
.lp-show{opacity:1;pointer-events:auto}
.lp-title{font-weight:700;font-size:15px;text-shadow:0 1px 3px rgba(0,0,0,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-bar{position:relative;height:22px;display:flex;align-items:center;cursor:pointer;touch-action:none}
.lp-track{position:relative;width:100%;height:4px;background:rgba(255,255,255,.22);border-radius:2px;overflow:hidden;transition:height .12s}
.lp-bar:hover .lp-track,.lp-bar.scrub .lp-track{height:6px}
.lp-buf{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.35)}
.lp-played{position:absolute;left:0;top:0;bottom:0;background:var(--lp)}
.lp-knob{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;background:var(--lp);transform:translate(-50%,-50%) scale(0);transition:transform .12s;box-shadow:0 0 0 4px rgba(74,222,128,.25)}
.lp-bar:hover .lp-knob,.lp-bar.scrub .lp-knob{transform:translate(-50%,-50%) scale(1)}
.lp-tip{position:absolute;bottom:26px;transform:translateX(-50%);background:rgba(0,0,0,.85);padding:4px 7px;border-radius:5px;font-size:12px;font-variant-numeric:tabular-nums;pointer-events:none;white-space:nowrap}
.lp-row{display:flex;align-items:center;gap:2px;height:44px}
.lp-btn{background:none;border:0;color:#fff;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:.92;transition:background .12s,opacity .12s;padding:0}
.lp-btn:hover{background:rgba(255,255,255,.12);opacity:1}
.lp-btn:focus-visible{outline:2px solid var(--lp);outline-offset:-2px}
.lp-txt{width:auto;padding:0 10px;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
.lp-vol{display:flex;align-items:center}
.lp-range{width:0;opacity:0;transition:width .18s,opacity .18s;accent-color:var(--lp);cursor:pointer;margin:0 4px 0 2px}
.lp-vol:hover .lp-range,.lp-range:focus{width:84px;opacity:1}
.lp-time{font-size:13px;font-variant-numeric:tabular-nums;margin-left:8px;white-space:nowrap}
.lp-dim{opacity:.6}
.lp-spacer{flex:1}
.lp-speed{position:relative}
.lp-menu{position:absolute;bottom:46px;right:0;background:rgba(20,22,26,.97);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:6px;display:flex;flex-direction:column;min-width:96px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.lp-menu button{background:none;border:0;color:#fff;text-align:left;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px}
.lp-menu button:hover{background:rgba(255,255,255,.1)}
.lp-menu button.on{color:var(--lp);font-weight:700}
.lp-toast{position:absolute;top:16px;right:16px;background:rgba(0,0,0,.75);padding:8px 12px;border-radius:8px;font-size:13px;border:1px solid rgba(255,255,255,.1);pointer-events:none}
.lp-vermenu{min-width:210px;max-height:260px;overflow:auto}
.lp-menu button:disabled{opacity:.45;cursor:not-allowed}
.lp-menu button:disabled:hover{background:none}
.lp-ok{color:var(--lp);font-weight:700}
.lp-verbtn{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
.lp-wait{width:100%;aspect-ratio:16/9;background:#0b0d10;color:#eef1f5;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;text-align:center;padding:20px}
@media (max-width:640px){.lp-time{font-size:12px}.lp-vol .lp-range{display:none}.lp-btn{width:36px;height:36px}.lp-big{width:68px;height:68px}}
@media (prefers-reduced-motion:reduce){.lp-top,.lp-bottom,.lp-track,.lp-knob,.lp-big{transition:none}}
`;

/**
 * LemurPlay's movie player. Resolves a playable HLS URL from the backend (polling while a title
 * packages on first play), streams it with hls.js, and wraps it in proper movie-player chrome:
 * auto-hiding controls, seek bar with buffer + hover time, ±10s, volume, speed, PiP, fullscreen,
 * keyboard shortcuts, and resume-where-you-left-off.
 */
export default function LemurVodPlayer({ tmdbId, title, origLang, poster, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);
  const scrubRef = useRef(false);
  const uiRef = useRef(true);
  const touchRef = useRef(false);
  const speedOpenRef = useRef(false);

  const [state, setState] = useState<PlayState>({ s: 'loading' });
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
  const [speedOpen, setSpeedOpen] = useState(false);
  const [pipOk, setPipOk] = useState(false);
  const [resumed, setResumed] = useState<number | null>(null);
  const [pickSid, setPickSid] = useState<string>('');  // viewer-picked copy (stream id); '' = by language
  const [verOpen, setVerOpen] = useState(false);
  const verOpenRef = useRef(false);
  const switchPos = useRef<number | null>(null);        // keep the timeline position across a version switch

  useEffect(() => { uiRef.current = ui; }, [ui]);
  useEffect(() => { verOpenRef.current = verOpen; }, [verOpen]);
  useEffect(() => { speedOpenRef.current = speedOpen; }, [speedOpen]);
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
        const r = await fetch(`/api/vod/play/movie/${tmdbId}?${qs}`, { cache: 'no-store' });
        const d = await r.json();
        if (!alive) return;
        // 404 = not in the catalog; disabled = VOD switched off; unavailable = no copy in this
        // language is browser-decodable (HEVC/10-bit) — offer the other versions instead.
        if (r.status === 404 || d.status === 'disabled' || d.status === 'unavailable') {
          setState({ s: 'unavailable', versions: d.versions, reason: d.reason }); return;
        }
        if (d.status === 'ready' && d.url) { setState({ s: 'ready', url: d.url, sid: d.sid, versions: d.versions }); return; }
        if (d.status === 'preparing') {
          setState({ s: 'preparing', versions: d.versions });
          timer = setTimeout(() => poll(attempt + 1), Math.min(6000, 2000 + attempt * 500));
          return;
        }
        setState({ s: 'error', msg: d.error || 'could not start playback' });
      } catch {
        if (alive) setState({ s: 'error', msg: 'backend unreachable' });
      }
    };
    poll();
    return () => { alive = false; clearTimeout(timer); };
  }, [tmdbId, pickSid, origLang]);

  // ── 2. Attach the stream. hls.js (MSE) FIRST — never trust canPlayType for HLS: Chromium on
  //       Windows answers "maybe" yet can't play an m3u8 natively. Native HLS only where there is
  //       no MSE at all (iOS Safari), where it genuinely works. ────────────────────────────────────
  useEffect(() => {
    if (state.s !== 'ready' || !videoRef.current) return;
    const video = videoRef.current;
    const sw = switchPos.current; switchPos.current = null;      // a version switch keeps the position
    const saved = sw != null ? sw : readSaved(tmdbId);
    const start = () => {
      if (saved && sw == null) { setResumed(saved); setTimeout(() => setResumed(null), 3500); }
      video.play().catch(() => { video.muted = true; setMuted(true); video.play().catch(() => {}); });
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true, lowLatencyMode: false, maxBufferLength: 30, backBufferLength: 60,
        startPosition: saved || -1,          // resume where they left off, else from the top
      });
      let recovered = false;
      hls.loadSource(state.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, start);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        // Standard hls.js recovery: one network retry / one media nudge before giving up.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !recovered) { recovered = true; hls.startLoad(); return; }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return; }
        hls.destroy();
        setState({ s: 'error', msg: `playback error (${data.type})` });
      });
      return () => hls.destroy();
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = state.url;
      const onMeta = () => { if (saved) video.currentTime = saved; start(); };
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      return () => video.removeEventListener('loadedmetadata', onMeta);
    }
    setState({ s: 'error', msg: 'HLS not supported in this browser' });
  }, [state, tmdbId]);

  // ── 3. Mirror <video> state into the UI ──────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state.s !== 'ready') return;
    const updBuf = () => {
      const b = v.buffered; let end = 0;
      for (let i = 0; i < b.length; i++) if (b.start(i) <= v.currentTime + 0.5 && b.end(i) > end) end = b.end(i);
      setBuf(end);
    };
    const onTime = () => {
      if (!scrubRef.current) setCur(v.currentTime);
      updBuf();
      const now = Date.now();
      if (now - lastSave.current > 5000 && v.currentTime > 5) {
        lastSave.current = now;
        try { localStorage.setItem(posKey(tmdbId), String(v.currentTime)); } catch { /* private mode */ }
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
      try { localStorage.removeItem(posKey(tmdbId)); } catch { /* ignore */ }
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
  }, [state.s, tmdbId]);

  // ── controls visibility ───────────────────────────────────────────────────────────────────────
  const wake = useCallback(() => {
    setUi(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended && !speedOpenRef.current && !verOpenRef.current && !scrubRef.current) setUi(false);
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

  // ── versions: the same film in other audio languages / qualities ──────────────────────────────
  const chooseVersion = useCallback((ver: Version) => {
    setVerOpen(false);
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
        case 'Escape': setSpeedOpen(false); return;
        default: return;
      }
      wake();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.s, toggle, seekBy, setVolume, toggleMute, toggleFs, wake]);

  // ── seek bar ──────────────────────────────────────────────────────────────────────────────────
  const frac = (e: RPointerEvent<HTMLDivElement>) => {
    const r = barRef.current?.getBoundingClientRect(); if (!r || !r.width) return 0;
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  const seekFrac = (f: number) => {
    const v = videoRef.current; if (!v || !dur) return;
    v.currentTime = f * dur; setCur(f * dur);
  };
  const onBarDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubRef.current = true; setScrub(true);
    const f = frac(e); setHover(f * dur); seekFrac(f); wake();
  };
  const onBarMove = (e: RPointerEvent<HTMLDivElement>) => {
    const f = frac(e); setHover(f * dur);
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
      <div className={`lp-player ${className || ''}`}>
        <style>{CSS}</style>
        <div className="lp-wait" style={poster ? { backgroundImage: `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.75)),url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
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

  const pct = dur ? (cur / dur) * 100 : 0;
  const bpct = dur ? Math.max(pct, (buf / dur) * 100) : 0;
  const showUi = ui || !playing;

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

      {buffering && !ended && (
        <div className="lp-center"><div className="lp-spin" role="status" aria-label="Buffering" /></div>
      )}

      {!playing && !buffering && (
        <div className="lp-center">
          <button type="button" className="lp-big" onClick={toggle} aria-label={ended ? 'Replay' : 'Play'}>
            <svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor" aria-hidden="true">{ended ? I.replay : I.play}</svg>
          </button>
        </div>
      )}

      {resumed != null && <div className="lp-toast">Resumed from {fmt(resumed)}</div>}

      <div className={`lp-top ${showUi ? 'lp-show' : ''}`}>
        {title && <div className="lp-title">{title}</div>}
      </div>

      <div className={`lp-bottom ${showUi ? 'lp-show' : ''}`}>
        <div
          ref={barRef}
          className={`lp-bar ${scrub ? 'scrub' : ''}`}
          role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.floor(dur)} aria-valuenow={Math.floor(cur)} aria-valuetext={fmt(cur)}
          onPointerDown={onBarDown} onPointerMove={onBarMove} onPointerUp={onBarUp} onPointerCancel={onBarUp} onPointerLeave={onBarLeave}
        >
          <div className="lp-track">
            <div className="lp-buf" style={{ width: `${bpct}%` }} />
            <div className="lp-played" style={{ width: `${pct}%` }} />
          </div>
          <div className="lp-knob" style={{ left: `${pct}%` }} />
          {hover != null && dur > 0 && (
            <div className="lp-tip" style={{ left: `${(hover / dur) * 100}%` }}>{fmt(hover)}</div>
          )}
        </div>

        <div className="lp-row">
          <Btn onClick={toggle} label={playing ? 'Pause (k)' : 'Play (k)'}>{playing ? I.pause : I.play}</Btn>
          <Btn onClick={() => { seekBy(-SKIP); wake(); }} label="Back 10 seconds (←)">{I.back}</Btn>
          <Btn onClick={() => { seekBy(SKIP); wake(); }} label="Forward 10 seconds (→)">{I.fwd}</Btn>
          <div className="lp-vol">
            <Btn onClick={toggleMute} label={muted ? 'Unmute (m)' : 'Mute (m)'}>{muted || vol === 0 ? I.muted : I.volume}</Btn>
            <input
              type="range" min={0} max={1} step={0.02} value={muted ? 0 : vol}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume" className="lp-range"
            />
          </div>
          <div className="lp-time">{fmt(cur)} <span className="lp-dim">/ {fmt(dur)}</span></div>
          <div className="lp-spacer" />
          <div className="lp-speed">
            <button type="button" className="lp-btn lp-txt" onClick={() => setSpeedOpen(o => !o)} aria-haspopup="menu" aria-expanded={speedOpen} title="Playback speed">
              {speed}×
            </button>
            {speedOpen && (
              <div className="lp-menu" role="menu">
                {SPEEDS.map(s => (
                  <button
                    type="button" key={s} role="menuitem" className={s === speed ? 'on' : ''}
                    onClick={() => { if (videoRef.current) videoRef.current.playbackRate = s; setSpeedOpen(false); wake(); }}
                  >
                    {s === 1 ? 'Normal' : `${s}×`}
                  </button>
                ))}
              </div>
            )}
          </div>
          {versions.length > 1 && (
            <div className="lp-speed">
              <button
                type="button" className="lp-btn lp-txt lp-verbtn" title="Audio language / quality"
                onClick={() => { setVerOpen(o => !o); setSpeedOpen(false); }} aria-haspopup="menu" aria-expanded={verOpen}
              >
                {verLabel}
              </button>
              {verOpen && renderVersionMenu()}
            </div>
          )}
          {pipOk && <Btn onClick={togglePip} label="Picture in picture">{I.pip}</Btn>}
          <Btn onClick={toggleFs} label={fs ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}>{fs ? I.fsExit : I.fs}</Btn>
        </div>
      </div>
    </div>
  );
}
