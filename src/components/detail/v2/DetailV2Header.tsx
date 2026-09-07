'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import BoredFlixLogoStatic from '@/components/branding/BoredFlixLogoStatic';
import { getDetailBrowseHref, getDetailHomeHref } from '@/utils/detailLayout';
import { navThemes } from '@/components/home/v2/navThemes';

type DetailMediaType = 'movie' | 'tv';

interface DetailV2HeaderProps {
  title: string;
  mediaType: DetailMediaType;
}

const mediaLabels: Record<DetailMediaType, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
};

const mediaThemes: Record<DetailMediaType, keyof typeof navThemes> = {
  movie: 'movies',
  tv: 'tv',
};

export default function DetailV2Header({ title, mediaType }: DetailV2HeaderProps) {
  const theme = navThemes[mediaThemes[mediaType]];
  const browseHref = getDetailBrowseHref(mediaType);
  const homeHref = getDetailHomeHref();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Link
          href={browseHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label={`Back to ${mediaLabels[mediaType]}`}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <Link
          href={homeHref}
          className="inline-flex shrink-0 items-center"
          aria-label="BoredFlix home"
        >
          <BoredFlixLogoStatic className="block h-8 w-auto sm:h-9" />
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1.5 text-xs sm:text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href={browseHref}
            className="shrink-0 truncate transition-colors hover:text-white"
            style={{ color: theme.label }}
          >
            {mediaLabels[mediaType]}
          </Link>
          <span className="shrink-0 text-zinc-600">/</span>
          <span className="truncate font-medium text-white" title={title}>
            {title}
          </span>
        </nav>
      </div>
    </header>
  );
}
