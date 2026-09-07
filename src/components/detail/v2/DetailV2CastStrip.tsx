'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface DetailV2CastStripProps {
  cast: CastMember[];
  title?: string;
}

export default function DetailV2CastStrip({ cast, title = 'Cast' }: DetailV2CastStripProps) {
  const [open, setOpen] = useState(true);

  if (!cast.length) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {title}
          <span className="text-zinc-700">({cast.length})</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cast.map((person) => {
            const photoUrl = person.profile_path
              ? `${TMDB_IMAGE_BASE_URL}/w185${person.profile_path}`
              : null;

            return (
              <div key={person.id} className="w-[80px] shrink-0 sm:w-[90px]">
                <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-lg border border-white/[0.06] bg-zinc-900">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="90px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-800/60">
                      <svg className="h-7 w-7 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="truncate text-[11px] font-semibold text-zinc-200" title={person.name}>
                  {person.name}
                </p>
                <p className="truncate text-[10px] text-zinc-500" title={person.character}>
                  {person.character}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
