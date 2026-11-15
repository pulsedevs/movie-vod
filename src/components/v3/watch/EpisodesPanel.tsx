'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SeasonEps } from '../detail/TvWatchV3';
import { watchHref } from './links';

export interface SeasonTab {
  season_number: number;
  name?: string;
  episode_count: number;
}

const aired = (d?: string | null) => !d || new Date(`${d}T00:00:00Z`).getTime() <= Date.now();
const fmtDate = (d?: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';

/**
 * The player's Episodes panel: season tabs, then the season's episodes as cards in a sideways row
 * (the playing one marked "Now playing"); a card opens that episode's player page.
 */
export default function EpisodesPanel({
  tvId,
  seasons,
  season,
  episode,
  initialEpisodes,
}: {
  tvId: number;
  seasons: SeasonTab[];
  /** The playing episode. */
  season: number;
  episode: number;
  /** The playing season's episodes (loaded with the page). */
  initialEpisodes?: SeasonEps['episodes'];
}) {
  const [open, setOpen] = useState(season);
  const [data, setData] = useState<Record<number, SeasonEps['episodes'] | null>>(() =>
    initialEpisodes ? { [season]: initialEpisodes } : {},
  );
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open in data) return;
    let alive = true;
    fetch(`/api/tv/season?tvId=${tvId}&seasonNumber=${open}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d: SeasonEps | null) => {
        if (alive) setData((prev) => (open in prev ? prev : { ...prev, [open]: d?.episodes ?? null }));
      });
    return () => {
      alive = false;
    };
  }, [open, tvId, data]);

  const episodes = data[open];

  // Open on the playing episode.
  useEffect(() => {
    const el = row.current;
    if (!el || open !== season || !episodes) return;
    const card = el.querySelector<HTMLElement>('[data-current="true"]');
    if (card) el.scrollLeft = Math.max(0, card.offsetLeft - el.clientWidth / 2 + card.offsetWidth / 2);
  }, [episodes, open, season]);

  const page = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className="flex min-h-0 flex-col text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        {seasons.length > 1 ? (
          <div className="-my-1 flex min-w-0 gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Seasons">
            {seasons.map((t) => {
              const on = t.season_number === open;
              return (
                <button
                  key={t.season_number}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setOpen(t.season_number)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    on ? 'bg-white text-black' : 'bg-white/[0.08] text-white/75 hover:bg-white/[0.15] hover:text-white'
                  }`}
                >
                  {t.season_number === 0 ? 'Specials' : `Season ${t.season_number}`}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-base font-bold">{seasons[0]?.name || `Season ${season}`}</p>
        )}
      </div>

      <div className="relative">
        <div
          ref={row}
          onWheel={(e) => {
            // A mouse wheel scrolls the row sideways.
            if (row.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) row.current.scrollLeft += e.deltaY;
          }}
          className="flex gap-4 overflow-x-auto scroll-smooth px-5 py-5 sm:px-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {episodes === undefined
            ? Array.from({ length: 5 }, (_, i) => <div key={i} className="h-[236px] w-[256px] shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />)
            : !episodes?.length
              ? <p className="py-10 text-sm text-white/55">No episodes listed for this season yet.</p>
              : episodes.map((ep) => {
                  const current = open === season && ep.episode_number === episode;
                  const ok = aired(ep.air_date);
                  const body = (
                    <>
                      <div className="relative aspect-video bg-white/[0.04]">
                        {ep.still_path ? (
                          <Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" fill sizes="256px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white/15">E{ep.episode_number}</span>
                        )}
                        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[12px] font-semibold backdrop-blur">
                          S{open}E{ep.episode_number}
                          {current ? ' · Now Playing' : ''}
                        </span>
                        {!ok && (
                          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                            <CalendarClock className="h-3 w-3" /> {fmtDate(ep.air_date)}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-[15px] font-bold">{ep.name || `Episode ${ep.episode_number}`}</p>
                        {ep.overview && <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/65">{ep.overview}</p>}
                      </div>
                    </>
                  );
                  const cls = `block w-[256px] shrink-0 overflow-hidden rounded-xl bg-white/[0.06] ring-1 transition ${
                    current ? 'ring-white/60' : 'ring-white/10'
                  }`;
                  return ok && !current ? (
                    <Link key={ep.episode_number} href={watchHref('tv', tvId, open, ep.episode_number)} className={`${cls} hover:bg-white/[0.1] hover:ring-white/30`}>
                      {body}
                    </Link>
                  ) : (
                    <div key={ep.episode_number} data-current={current || undefined} aria-current={current || undefined} className={`${cls} ${ok ? '' : 'opacity-50'}`}>
                      {body}
                    </div>
                  );
                })}
        </div>
        <button
          type="button"
          onClick={() => page(-1)}
          aria-label="Earlier episodes"
          className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white sm:flex"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          aria-label="Later episodes"
          className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white sm:flex"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
