'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, SkipForward } from 'lucide-react';
import type { StreamSource } from '@/types';
import LemurVodPlayer from '@/components/player/LemurVodPlayer';
import MoviePlayer from '@/components/player/MoviePlayer';
import { readContinueWatching, writeContinueWatching } from '@/utils/libraryStorage';

interface WatchScreenProps {
  kind: 'movie' | 'tv';
  tmdbId: number;
  /** Film title, or the show's name. */
  title: string;
  /** TV: "S1 · E2 · Episode name". */
  subtitle?: string;
  detailsHref: string;
  posterPath: string | null;
  backdropPath: string | null;
  origLang?: string;
  season?: number;
  episode?: number;
  /** TV: the next aired episode's watch page. */
  nextHref?: string | null;
  /** TV: an episode our servers don't have plays from these instead. */
  sources?: StreamSource[];
}

/**
 * The player page: the video fills the window, with Back, the title (to the details page) and,
 * for a show, Next episode in the player's own top bar, which hides with its controls.
 */
export default function WatchScreen(props: WatchScreenProps) {
  const { kind, tmdbId, title, subtitle, detailsHref, posterPath, backdropPath, origLang, season, episode, nextHref, sources } = props;
  const router = useRouter();
  const [missing, setMissing] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Continue Watching: this title moves to the front (TV in both field styles the site reads).
  useEffect(() => {
    const all = readContinueWatching();
    const prev = all.find((x) => Number(x.id) === tmdbId && x.media_type === kind);
    const rest = all.filter((x) => x !== prev);
    const entry = {
      ...prev,
      id: tmdbId,
      media_type: kind,
      ...(kind === 'movie' ? { title } : { name: title, title }),
      poster_path: posterPath,
      backdrop_path: backdropPath,
      ...(kind === 'tv' && season != null && episode != null
        ? { season, episode, ...({ season_number: season, episode_number: episode } as object) }
        : null),
      ...({ last_watched: new Date().toISOString() } as object),
    };
    writeContinueWatching([entry as (typeof all)[number], ...rest]);
  }, [kind, tmdbId, title, posterPath, backdropPath, season, episode]);

  // Back to where the viewer came from; a page opened on its own goes to the details page.
  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(detailsHref);
  };

  const header = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <button
        type="button"
        onClick={back}
        aria-label="Back"
        className="flex h-12 w-12 items-center justify-center rounded-full text-white transition hover:bg-white/10"
      >
        <ArrowLeft className="h-8 w-8" />
      </button>
      <Link
        href={detailsHref}
        title={`${title}: details`}
        className="min-w-0 max-w-[56vw] text-center text-white transition hover:opacity-80"
      >
        <span className="block truncate text-base font-medium drop-shadow">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] text-white/65">{subtitle}</span>}
      </Link>
      <div className="flex justify-end">
        {nextHref && (
          <Link
            href={nextHref}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <SkipForward className="h-4 w-4 fill-black" />
            <span className="hidden sm:inline">Next episode</span>
          </Link>
        )}
      </div>
    </div>
  );

  // A show's episode that isn't on our servers: the older player with its outside servers.
  if (missing && kind === 'tv') {
    return (
      <div className="v3-root fixed inset-0 overflow-y-auto bg-black text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="sticky top-0 z-10 bg-gradient-to-b from-black via-black/80 to-transparent px-[18px] pb-6 pt-3.5">{header}</div>
        <div className="mx-auto max-w-[1400px] px-4 pb-10">
          <MoviePlayer
            sources={sources ?? []}
            mediaType="tv"
            mediaId={tmdbId}
            title={title}
            seasonNumber={season}
            episodeNumber={episode}
            selectedSourceIndex={sourceIndex}
            setSelectedSourceIndex={setSourceIndex}
            embedded
          />
        </div>
      </div>
    );
  }

  return (
    <div className="v3-root fixed inset-0 bg-black">
      <LemurVodPlayer
        key={`${kind}:${tmdbId}:${season ?? ''}:${episode ?? ''}`}
        tmdbId={tmdbId}
        season={kind === 'tv' ? season : undefined}
        episode={kind === 'tv' ? episode : undefined}
        title={title}
        origLang={origLang}
        poster={backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : undefined}
        header={header}
        fill
        onMissing={kind === 'tv' ? () => setMissing(true) : undefined}
        className="h-full w-full"
      />
    </div>
  );
}
