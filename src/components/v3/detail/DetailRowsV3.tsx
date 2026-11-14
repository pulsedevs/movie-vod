'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import RowScroller from '../rows/RowScroller';
import TrailerModal from './TrailerModal';

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}

/** Cast as round portraits; initials when TMDB has no photo. */
export function CastCircles({ cast }: { cast: CastMember[] }) {
  if (!cast.length) return null;
  return (
    <RowScroller title="Cast" gap="gap-5 md:gap-8">
      {cast.map((p) => (
        <div key={p.id} className="flex w-[96px] shrink-0 flex-col items-center text-center md:w-[112px]">
          <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            {p.profile_path ? (
              <Image src={`https://image.tmdb.org/t/p/w185${p.profile_path}`} alt={p.name} fill sizes="112px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-white/40">
                {p.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="line-clamp-1 text-sm font-semibold text-white">{p.name}</p>
          {p.character && <p className="line-clamp-1 text-xs text-white/50">{p.character}</p>}
        </div>
      ))}
    </RowScroller>
  );
}

export interface VideoItem {
  key: string;
  name?: string;
  type?: string;
}

/** Trailers and teasers (YouTube thumbnails); a click plays one in an overlay. */
export function TrailersRow({ videos, title }: { videos: VideoItem[]; title: string }) {
  const [open, setOpen] = useState<VideoItem | null>(null);
  if (!videos.length) return null;
  return (
    <>
      <RowScroller title="Trailers">
        {videos.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setOpen(v)}
            className="group/tr w-[260px] shrink-0 text-left md:w-[320px]"
          >
            <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition duration-300 group-hover/tr:-translate-y-1 group-hover/tr:ring-white/25">
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail host */}
              <img src={`https://i.ytimg.com/vi/${v.key}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black transition group-hover/tr:scale-110">
                  <Play className="ml-0.5 h-5 w-5 fill-black" />
                </span>
              </span>
            </div>
            <p className="mt-2.5 line-clamp-1 text-sm font-medium text-white/90">{v.name || v.type || 'Trailer'}</p>
          </button>
        ))}
      </RowScroller>
      {open && <TrailerModal youtubeKey={open.key} title={title} onClose={() => setOpen(null)} />}
    </>
  );
}
