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

/**
 * The trailer playing silently behind the detail hero: a YouTube embed (autoplay, muted, looped,
 * no controls, inline), oversized to cover the box and crop YouTube's own title bar and logo.
 * It stays invisible until YouTube reports "playing" (so no black flash or spinner shows), and is
 * steered through the embed's postMessage API (mute / unMute / play / pause).
 */
export default function BackdropTrailer({ youtubeKey, active, muted, onPlayingChange }: BackdropTrailerProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Let the page and the backdrop settle first; a trailer that pops in instantly feels jumpy.
  useEffect(() => {
    setMounted(false);
    setPlaying(false);
    const id = setTimeout(() => setMounted(true), START_DELAY_MS);
    return () => clearTimeout(id);
  }, [youtubeKey]);

  const post = useCallback((func: string, args: unknown[] = []) => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  }, []);

  // YouTube tells us its state once we say we are listening.
  useEffect(() => {
    if (!mounted) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      let data: { event?: string; info?: unknown } | null = null;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const info = data?.info as { playerState?: number } | number | undefined;
      const state = typeof info === 'number' ? info : info?.playerState;
      if (state === 1) setPlaying(true); // playing
      else if (state === 0 || state === 2) setPlaying(false); // ended / paused
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mounted]);

  const onLoad = () => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: youtubeKey, channel: 'widget' }), '*');
    post('addEventListener', ['onStateChange']);
  };

  useEffect(() => {
    if (!mounted) return;
    post(active ? 'playVideo' : 'pauseVideo');
  }, [active, mounted, post]);

  useEffect(() => {
    if (!mounted) return;
    if (muted) post('mute');
    else {
      post('unMute');
      post('setVolume', [70]);
    }
  }, [muted, mounted, playing, post]);

  const visible = mounted && playing && active;
  useEffect(() => {
    onPlayingChange?.(visible);
  }, [visible, onPlayingChange]);

  if (!mounted) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    loop: '1',
    playlist: youtubeKey, // loop needs the video listed as its own playlist
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
      className={`absolute inset-0 overflow-hidden transition-opacity duration-[1200ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
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
