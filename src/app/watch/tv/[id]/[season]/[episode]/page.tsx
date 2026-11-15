import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadTvDetail } from '@/lib/detail/loadTvDetail';
import { loadSeasonDetail } from '@/lib/detail/loadEpisodeDetail';
import { createSlug } from '@/utils/movieLinks';
import { buildCanonicalUrl } from '@/utils/siteUrl';
import { discoverStreamSources } from '@/utils/sourceHelper';
import WatchScreen from '@/components/v3/watch/WatchScreen';
import { watchHref } from '@/components/v3/watch/links';

type Props = { params: Promise<{ id: string; season: string; episode: string }> };

const aired = (d?: string | null) => !d || new Date(`${d}T00:00:00Z`).getTime() <= Date.now();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, season, episode } = await params;
  const show = await loadTvDetail(id);
  if (!show) return { title: 'Show Not Found | BoredFlix', robots: { index: false } };
  return {
    title: `Watch ${show.name} S${season} E${episode} | BoredFlix`,
    robots: { index: false, follow: true },
    alternates: {
      canonical: buildCanonicalUrl(`/tv/${id}/${createSlug(show.name)}/season/${season}/episode/${episode}`),
    },
  };
}

/** The episode player page: the episode fills the window, with Next episode when there is one. */
export default async function WatchEpisodePage({ params }: Props) {
  const p = await params;
  const s = Number(p.season);
  const e = Number(p.episode);
  if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e < 1) notFound();

  const [show, seasonData] = await Promise.all([loadTvDetail(p.id), loadSeasonDetail(p.id, s).catch(() => null)]);
  if (!show) notFound();

  const eps = seasonData?.episodes ?? [];
  const i = eps.findIndex((x) => x.episode_number === e);
  const name = i >= 0 ? eps[i].name : undefined;

  // Next: the next aired episode of this season, else episode 1 of the next aired season.
  let next: { s: number; e: number } | null = null;
  if (i >= 0 && i + 1 < eps.length && aired(eps[i + 1].air_date)) {
    next = { s, e: eps[i + 1].episode_number };
  } else if (s > 0) {
    const later = (show.seasons ?? [])
      .filter((x) => x.season_number > s && x.episode_count > 0 && aired(x.air_date))
      .sort((a, b) => a.season_number - b.season_number)[0];
    if (later) next = { s: later.season_number, e: 1 };
  }

  const seasons = (show.seasons ?? [])
    .filter((x) => x.episode_count > 0)
    .sort((a, b) => (a.season_number === 0 ? 1 : b.season_number === 0 ? -1 : a.season_number - b.season_number))
    .map((x) => ({ season_number: x.season_number, name: x.name, episode_count: x.episode_count }));

  return (
    <WatchScreen
      // A new episode starts fresh (fallback player, Continue Watching entry).
      key={`${show.id}:${s}:${e}`}
      kind="tv"
      tmdbId={show.id}
      title={show.name}
      subtitle={[`S${s} · E${e}`, name && name !== `Episode ${e}` ? name : null].filter(Boolean).join(' · ')}
      detailsHref={`/tv/${show.id}/${createSlug(show.name)}`}
      posterPath={show.poster_path ?? null}
      backdropPath={show.backdrop_path ?? null}
      season={s}
      episode={e}
      nextHref={next ? watchHref('tv', show.id, next.s, next.e) : null}
      seasons={seasons}
      seasonEpisodes={eps.map((x) => ({
        episode_number: x.episode_number,
        name: x.name,
        overview: x.overview,
        still_path: x.still_path,
        runtime: x.runtime,
        air_date: x.air_date,
      }))}
      sources={discoverStreamSources()}
    />
  );
}
