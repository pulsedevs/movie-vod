'use client';

import { Download, X } from 'lucide-react';

interface DownloadInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadInfoModal({ isOpen, onClose }: DownloadInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-info-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-7 pb-5 text-center">
          <Download className="w-10 h-10 text-blue-400 mx-auto mb-4" />

          <h2 id="download-info-title" className="text-lg font-bold text-white mb-2">
            Download in Player
          </h2>

          <p className="text-gray-400 text-sm mb-5">
            Download is only on <span className="text-white font-medium">Premium 1</span>.
            Use the download button inside that player.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
