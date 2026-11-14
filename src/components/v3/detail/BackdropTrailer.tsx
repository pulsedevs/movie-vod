'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface BackdropTrailerProps {
  youtubeKey: string;
  /** false = paused and hidden (Play pressed, scrolled away, tab hidden...). */
  active: boolean;
  muted: boolean;
  /** Reports when frames are actually on screen, so the page can show the mute button. */
  onPlayingChange?: (playing: boolean) => void;
  /** Wait before loading the video (the detail hero lets the page settle; a hover card starts sooner). */
  delayMs?: number;
}

const START_DELAY_MS = 2500;
/** Shown only after the video clock has moved this far while playing: by then YouTube's start
 *  overlay and any play/pause icon have faded out. */
const SETTLE_SECONDS = 1;
/** Paused only after the fade-out: YouTube draws its play button the instant it pauses. */
const PAUSE_AFTER_MS = 400;

// YouTube player states.
const PLAYING = 1;
const ENDED = 0;

type YtMessage = { event?: string; info?: unknown };

/**
 * The trailer playing silently behind the detail hero: a YouTube embed (autoplay, muted, no
 * controls, inline), oversized to cover the box and crop YouTube's title bar and logo.
 *
 * None of YouTube's own UI may ever show, so the video is visible only while YouTube reports it
 * playing AND its clock has really advanced (a "playing" state alone is not proof: a blocked
 * autoplay can still sit on its play button). It hides at once on pause / buffering / end, and is
 * paused only after it has faded out. Commands are sent only when needed (autoplay and mute come
 * from the URL), since a needless play/pause makes YouTube flash its icon.
 */
export default function BackdropTrailer({
  youtubeKey,
  active,
  muted,
  onPlayingChange,
  delayMs = START_DELAY_MS,
}: BackdropTrailerProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);
  const state = useRef<number | null>(null);
  const playStart = useRef<number | null>(null); // video time when the current playing stretch began
  const pausedByUs = useRef(false);
  const mutedSent = useRef(true); // the URL starts it muted

  // Let the page and the backdrop settle first; a trailer that pops in instantly feels jumpy.
  useEffect(() => {
    setMounted(false);
    setSettled(false);
    state.current = null;
    playStart.current = null;
    pausedByUs.current = false;
    mutedSent.current = true;
    const id = setTimeout(() => setMounted(true), delayMs);
    return () => clearTimeout(id);
  }, [youtubeKey, delayMs]);

  const post = useCallback((func: string, args: unknown[] = []) => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      let msg: YtMessage | null = null;
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object') return;

      // Only these carry the player state; other events have unrelated numbers in `info`
      // (onPlaybackRateChange sends 1, which is also the "playing" state).
      let next: number | undefined;
      let time: number | undefined;
      if (msg.event === 'onStateChange' && typeof msg.info === 'number') {
        next = msg.info;
      } else if ((msg.event === 'infoDelivery' || msg.event === 'initialDelivery') && msg.info && typeof msg.info === 'object') {
        const info = msg.info as { playerState?: number; currentTime?: number };
        if (typeof info.playerState === 'number') next = info.playerState;
        if (typeof info.currentTime === 'number') time = info.currentTime;
      }

      if (next !== undefined && next !== state.current) {
        state.current = next;
        playStart.current = null;
        if (next !== PLAYING) {
          setSettled(false); // paused, buffering, cued, ended: hide at once
          if (next === ENDED) {
            // Restart it ourselves (YouTube's own loop flashes its replay screen).
            post('seekTo', [0, true]);
            post('playVideo');
          }
        }
      }
      if (time !== undefined && state.current === PLAYING) {
        if (playStart.current === null || time < playStart.current) playStart.current = time;
        else if (time - playStart.current >= SETTLE_SECONDS) setSettled(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mounted, post]);

  const onLoad = () => {
    // Ask YouTube to report its state and clock (it then sends infoDelivery messages).
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: youtubeKey, channel: 'widget' }), '*');
    post('addEventListener', ['onStateChange']);
  };

  // Pause once hidden (after the fade); resume only what we paused (autoplay starts it otherwise).
  useEffect(() => {
    if (!mounted) return;
    if (active) {
      if (pausedByUs.current) {
        pausedByUs.current = false;
        post('playVideo');
      }
      return;
    }
    const id = setTimeout(() => {
      pausedByUs.current = true;
      post('pauseVideo');
    }, PAUSE_AFTER_MS);
    return () => clearTimeout(id);
  }, [active, mounted, post]);

  // Sound: only when the viewer changes it.
  useEffect(() => {
    if (!mounted || muted === mutedSent.current) return;
    mutedSent.current = muted;
    if (muted) post('mute');
    else {
      post('unMute');
      post('setVolume', [70]);
    }
  }, [muted, mounted, post]);

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
        // Cover the box at 16:9, then 36% larger: YouTube's title bar and logo fall outside it, and
        // so do the black bars of a 2.39:1 "scope" trailer letterboxed in its 16:9 frame (1 / 0.744).
        style={{
          width: 'max(100cqw, 177.78cqh)',
          height: 'max(100cqh, 56.25cqw)',
          transform: 'translate(-50%, -50%) scale(1.36)',
        }}
      />
    </div>
  );
}
