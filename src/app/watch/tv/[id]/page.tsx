import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadTvDetail } from '@/lib/detail/loadTvDetail';
import ResumeRedirect from '@/components/v3/watch/ResumeRedirect';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { robots: { index: false, follow: true } };

/** /watch/tv/:id (Play on a show card): goes on to the viewer's episode, else the first one. */
export default async function WatchShowPage({ params }: Props) {
  const { id } = await params;
  const show = await loadTvDetail(id);
  if (!show) notFound();
  const firstSeason =
    (show.seasons ?? [])
      .filter((s) => s.season_number > 0 && s.episode_count > 0)
      .sort((a, b) => a.season_number - b.season_number)[0]?.season_number ?? 1;
  return <ResumeRedirect tvId={show.id} firstSeason={firstSeason} />;
}
