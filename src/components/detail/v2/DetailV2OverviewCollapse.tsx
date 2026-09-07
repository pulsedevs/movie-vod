'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Description from '@/components/movie/Description';

interface OverviewCredit {
  label: string;
  names: string[];
}

interface Props {
  overview?: string;
  credits?: OverviewCredit[];
  /** Single genre pill rendered beside the About toggle — mobile only */
  mobileGenre?: React.ReactNode;
}

export default function DetailV2OverviewCollapse({ overview, credits, mobileGenre }: Props) {
  const [open, setOpen] = useState(false);

  const hasContent = !!overview || credits?.some((c) => c.names.length > 0);
  if (!hasContent) return null;

  return (
    <div className="mt-2 border-t border-white/[0.05]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 pt-2 pb-1 text-left"
        aria-expanded={open}
      >
        {/* Mobile: genre pill inline on the left */}
        {mobileGenre && <span className="md:hidden shrink-0 inline-flex items-center">{mobileGenre}</span>}

        <span
          className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150 ${
            open
              ? 'border-white/20 bg-white/10 text-zinc-200'
              : 'border-white/[0.08] bg-white/[0.04] text-zinc-400'
          }`}
        >
          About
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-2 pt-1">
          {overview && <Description overview={overview} />}

          {credits?.some((c) => c.names.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              {credits.map(
                ({ label, names }) =>
                  names.length > 0 && (
                    <span key={label}>
                      <span className="text-zinc-600">{label} </span>
                      <span className="font-medium text-zinc-300">{names.join(', ')}</span>
                    </span>
                  ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
