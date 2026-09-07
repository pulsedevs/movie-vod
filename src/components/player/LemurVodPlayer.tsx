'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface Props {
  tmdbId: number | string;
  poster?: string;
  className?: string;
}

type PlayState =
  | { s: 'loading' }
  | { s: 'preparing' }
  | { s: 'ready'; url: string }
  | { s: 'unavailable' }
  | { s: 'error'; msg: string };

/**
 * LemurPlay's own VOD player: asks the backend for an HLS playlist, shows a "getting your movie…"
 * state while the title packages on first play, then streams it with hls.js. Replaces the external
 * embed iframe — this is OUR stream (panel → HLS → R2), not a third-party player.
 */
export default function LemurVodPlayer({ tmdbId, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlayState>({ s: 'loading' });

  // Resolve a playable HLS URL, polling while the backend packages the title on first play.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async (attempt = 0) => {
      try {
        const r = await fetch(`/api/vod/play/movie/${tmdbId}`, { cache: 'no-store' });
        const d = await r.json();
        if (!alive) return;
        if (r.status === 404 || d.status === 'disabled') { setState({ s: 'unavailable' }); return; }
        if (d.status === 'ready' && d.url) { setState({ s: 'ready', url: d.url }); return; }
        if (d.status === 'preparing') {
          setState({ s: 'preparing' });
          // back off a little, cap ~6s; packaging a film takes a while on first ever play
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
  }, [tmdbId]);

  // Attach hls.js once we have a URL. Safari plays HLS natively, so use that when available.
  useEffect(() => {
    if (state.s !== 'ready' || !videoRef.current) return;
    const video = videoRef.current;

    // With MSE the autoPlay attribute is unreliable — you must call play() once media is ready.
    // Try unmuted; if the browser blocks autoplay, retry muted (always allowed) so it still starts.
    const start = () => {
      video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
    };

    // hls.js (MSE) FIRST — never trust canPlayType for HLS. Chromium on Windows answers "maybe" to
    // canPlayType('application/vnd.apple.mpegurl') yet cannot play an m3u8 natively, so the native
    // path left the <video> parked on the playlist URL forever. Only browsers with no MSE at all
    // (iOS Safari) get the native fallback — there it genuinely works.
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      let recovered = false;
      hls.loadSource(state.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, start);   // the call that actually begins playback under MSE
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        // Standard hls.js recovery: retry the network once, or nudge the media pipeline once,
        // before giving up — r2.dev / a flaky line shouldn't kill the whole session.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !recovered) { recovered = true; hls.startLoad(); return; }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return; }
        hls.destroy();
        setState({ s: 'error', msg: `playback error (${data.type})` });
      });
      return () => hls.destroy();
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = state.url;                 // iOS Safari native HLS (no MSE there)
      video.addEventListener('loadedmetadata', start, { once: true });
      return () => video.removeEventListener('loadedmetadata', start);
    }
    setState({ s: 'error', msg: 'HLS not supported in this browser' });
  }, [state]);

  if (state.s === 'ready') {
    return (
      <video
        ref={videoRef}
        className={className}
        poster={poster}
        controls
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', background: '#000' }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: '100%', aspectRatio: '16 / 9', background: '#0b0d10', color: '#eef1f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        gap: 10, textAlign: 'center', padding: 20,
      }}
    >
      {(state.s === 'preparing' || state.s === 'loading') && (
        <div
          role="status"
          aria-label="Loading"
          style={{
            width: 46, height: 46, borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.15)', borderTopColor: '#eef1f5',
            animation: 'lpspin 0.8s linear infinite',
          }}
        />
      )}
      <style>{'@keyframes lpspin{to{transform:rotate(360deg)}}'}</style>
      {state.s === 'unavailable' && <div style={{ opacity: 0.8 }}>Not available to stream yet.</div>}
      {state.s === 'error' && <div style={{ color: '#f5a524' }}>⚠ {state.msg}</div>}
    </div>
  );
}
