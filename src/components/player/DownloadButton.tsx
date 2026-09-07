'use client';

import { getMovieDownloadUrl, getTvDownloadUrl } from '@/utils/downloadLinks';

interface DownloadButtonProps {
  mediaType: 'movie' | 'tv';
  mediaId: string | number;
  seasonNumber?: number;
  episodeNumber?: number;
  className?: string;
  title?: string;
  /** Always show the label (for grid / compact layouts). */
  showLabel?: boolean;
}

const buttonClassName =
  'relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group';

export default function DownloadButton({
  mediaType,
  mediaId,
  seasonNumber,
  episodeNumber,
  className = buttonClassName,
  title,
  showLabel = false,
}: DownloadButtonProps) {
  const defaultTitle = mediaType === 'movie' ? 'Download Movie' : 'Download Episode';
  const href =
    mediaType === 'movie'
      ? getMovieDownloadUrl(mediaId)
      : getTvDownloadUrl(mediaId, seasonNumber, episodeNumber);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title ?? defaultTitle}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v11m0 0l-4-4m4 4l4-4m-9 7.5h10.5"
        />
      </svg>
      <span
        className={
          showLabel
            ? 'text-[9px] font-semibold leading-none text-zinc-200'
            : 'hidden sm:inline text-xs sm:text-sm font-medium'
        }
      >
        Download
      </span>
    </a>
  );
}
