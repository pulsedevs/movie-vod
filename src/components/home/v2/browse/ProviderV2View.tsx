'use client';

import { Suspense, useState } from 'react';
import { MediaItem, Genre } from '@/types';
import { FilterProvider } from '@/components/browse/FilterContext';
import PaginatedResults from '@/components/browse/PaginatedResults';
import { BROWSE_V2_GRID_CLASS } from './browseV2Grid';
import type { StreamProvider } from '@/config/providers';

interface ProviderV2ViewProps {
  provider: StreamProvider;
  tab: 'movie' | 'tv';
  initialResults: MediaItem[];
  initialTotalPages: number;
  initialTotalResults: number;
}

const EMPTY_GENRES: Genre[] = [];
const EMPTY_FILTERS = { genres: [] };

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}

export default function ProviderV2View({
  provider,
  tab,
  initialResults,
  initialTotalPages,
  initialTotalResults,
}: ProviderV2ViewProps) {
  return (
    <div className="px-4 sm:px-5 py-4 pb-8 w-full min-w-0">

      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <span className="h-5 w-1 shrink-0 rounded-full" style={{ backgroundColor: provider.color }} />
        <h1 className="text-base font-semibold text-white sm:text-lg">{provider.name}</h1>
        {initialTotalResults > 0 && (
          <span className="text-[11px] text-white/35">
            {initialTotalResults.toLocaleString()} titles
          </span>
        )}
      </div>

      {/* Movie / TV tabs */}
      <TabBar provider={provider} activeTab={tab} />

      {/* Results */}
      <FilterProvider initialFilters={EMPTY_FILTERS}>
        <Suspense fallback={<Spinner />}>
          <PaginatedResults
            initialResults={initialResults}
            initialTotalPages={initialTotalPages}
            initialTotalResults={initialTotalResults}
            initialPage={1}
            mediaType={tab}
            gridClassName={BROWSE_V2_GRID_CLASS}
            compact
            compactCards
            provider={provider.tmdbId}
          />
        </Suspense>
      </FilterProvider>
    </div>
  );
}

function TabBar({ provider, activeTab }: { provider: StreamProvider; activeTab: 'movie' | 'tv' }) {
  const tabs: { label: string; value: 'movie' | 'tv'; href: string }[] = [
    // Link the default tab at its clean URL: `?tab=movie` renders byte-identical output to the
    // bare path, so linking it created a crawlable duplicate. `isActive` keys off `value`, not
    // `href`, so the highlight is unaffected.
    { label: 'Movies',   value: 'movie', href: `/browse/provider/${provider.slug}` },
    { label: 'TV Shows', value: 'tv',    href: `/browse/provider/${provider.slug}?tab=tv` },
  ];

  return (
    <div className="flex gap-1.5 mb-4 bg-white/[0.03] p-1 rounded-xl border border-white/5 w-fit">
      {tabs.map((t) => {
        const isActive = t.value === activeTab;
        return (
          <a
            key={t.value}
            href={t.href}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
            style={
              isActive
                ? { backgroundColor: provider.bgColor, color: provider.color }
                : { color: 'rgba(255,255,255,0.4)' }
            }
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}
