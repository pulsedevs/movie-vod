'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** A YouTube video in a dimmed overlay; Esc or a click outside closes it. */
export default function TrailerModal({ youtubeKey, title, onClose }: { youtubeKey: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="aspect-video overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
