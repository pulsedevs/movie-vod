'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface BackdropTrailerProps {
  youtubeKey: string;
  /** false = paused and hidden (Play pressed, scrolled away, tab hidden...). */
  active: boolean;
  muted: boolean;
  /** Reports when frames are actually on screen, so the page can show the mute button. */
  onPlayingChange?: (playing: boolean) => void;
}

const START_DELAY_MS = 2500;
/** Shown only after it has played this long: YouTube's start overlay (big play button, title) is gone by then. */
const SETTLE_MS = 700;
/** Paused only after the fade-out: YouTube draws its play button the instant it pauses. */
const PAUSE_AFTER_MS = 400;

// YouTube player states.
const PLAYING = 1;
const ENDED = 0;

/**
 * The trailer playing silently behind the detail hero: a YouTube embed (autoplay, muted, no
 * controls, inline), oversized to cover the box and crop YouTube's title bar and logo. None of
 * YouTube's own UI may ever show, so the video is visible only while it is actually playing and has
 * settled; it disappears first and pauses after (pause, buffering, end of the loop all hide it).
 * Steered through the embed's postMessage API.
 */
export default function BackdropTrailer({ youtubeKey, active, muted, onPlayingChange }: BackdropTrailerProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Let the page and the backdrop settle first; a trailer that pops in instantly feels jumpy.
  useEffect(() => {
    setMounted(false);
    setSettled(false);
    const id = setTimeout(() => setMounted(true), START_DELAY_MS);
    return () => clearTimeout(id);
  }, [youtubeKey]);

  const post = useCallback((func: string, args: unknown[] = []) => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      let data: { info?: unknown } | null = null;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const info = data?.info as { playerState?: number } | number | undefined;
      const state = typeof info === 'number' ? info : info?.playerState;
      if (state === undefined) return;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (state === PLAYING) {
        settleTimer.current = setTimeout(() => setSettled(true), SETTLE_MS);
      } else {
        // Paused, buffering, cued, ended: hide at once.
        setSettled(false);
        if (state === ENDED) {
          // Restart it ourselves (YouTube's own loop flashes its replay screen).
          post('seekTo', [0, true]);
          post('playVideo');
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [mounted, post]);

  const onLoad = () => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: youtubeKey, channel: 'widget' }), '*');
    post('addEventListener', ['onStateChange']);
  };

  // Play when allowed; when not, it is already invisible (visible needs active) - pause once the fade is done.
  useEffect(() => {
    if (!mounted) return;
    if (active) {
      post('playVideo');
      return;
    }
    const id = setTimeout(() => post('pauseVideo'), PAUSE_AFTER_MS);
    return () => clearTimeout(id);
  }, [active, mounted, post]);

  useEffect(() => {
    if (!mounted) return;
    if (muted) post('mute');
    else {
      post('unMute');
      post('setVolume', [70]);
    }
  }, [muted, mounted, settled, post]);

  const visible = mounted && settled && active;
  useEffect(() => {
    onPlayingChange?.(visible);
  }, [visible, onPlayingChange]);

  if (!mounted) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
    playsinline: '1',
    enablejsapi: '1',
    origin: window.location.origin,
  });

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden transition-opacity ${
        visible ? 'opacity-100 duration-[900ms]' : 'opacity-0 duration-200'
      }`}
      style={{ containerType: 'size' }}
    >
      <iframe
        ref={ref}
        src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?${params.toString()}`}
        title=""
        tabIndex={-1}
        allow="autoplay; encrypted-media; picture-in-picture"
        onLoad={onLoad}
        className="pointer-events-none absolute left-1/2 top-1/2 border-0"
        // Cover the box at 16:9, then 25% larger so YouTube's title bar and logo fall outside it.
        style={{
          width: 'max(100cqw, 177.78cqh)',
          height: 'max(100cqh, 56.25cqw)',
          transform: 'translate(-50%, -50%) scale(1.25)',
        }}
      />
    </div>
  );
}
