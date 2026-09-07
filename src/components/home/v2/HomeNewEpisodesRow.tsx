import Link from 'next/link';
import { TMDB_IMAGE_BASE_URL } from '@/utils/constants';
import { createSlug } from '@/utils/movieLinks';
import { loadRecentEpisodes } from '@/lib/detail/loadEpisodeDetail';

/**
 * "New Episodes" row — server component.
 *
 * Two jobs: it's the freshest content on the site (a real freshness signal), and it gives the
 * per-episode pages inbound links from the homepage, which is by far the strongest page here.
 * Rendered inside <Suspense> so its TMDB calls never block the rest of the homepage.
 */
export default async function HomeNewEpisodesRow() {
  const episodes = await loadRecentEpisodes(18);
  if (!episodes.length) return null;

  return (
    <section className="mt-5 min-w-0" aria-labelledby="new-episodes-heading">
      <h2
        id="new-episodes-heading"
        className="mb-2.5 px-4 text-[15px] font-bold text-white sm:px-5"
      >
        <span
          className="mr-2 inline-block h-3.5 w-1 translate-y-0.5 rounded-full align-middle"
          style={{ backgroundColor: '#a78bfa' }}
          aria-hidden="true"
        />
        New Episodes
      </h2>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-1 sm:px-5">
        {episodes.map((ep) => {
          const slug = createSlug(ep.showName);
          if (!slug) return null;
          const href = `/tv/${ep.showId}/${slug}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`;
          const still = ep.stillPath ? `${TMDB_IMAGE_BASE_URL}w300${ep.stillPath}` : null;

          return (
            <Link
              key={`${ep.showId}-${ep.seasonNumber}-${ep.episodeNumber}`}
              href={href}
              className="group w-[190px] shrink-0"
              title={`${ep.showName} S${ep.seasonNumber}E${ep.episodeNumber} — ${ep.episodeName}`}
            >
              <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
                {still ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={still}
                    alt={`${ep.showName} season ${ep.seasonNumber} episode ${ep.episodeNumber}`}
                    width={190}
                    height={107}
                    loading="lazy"
                    className="h-[107px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-[107px] w-full bg-white/[0.04]" />
                )}
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  S{ep.seasonNumber} E{ep.episodeNumber}
                </span>
              </div>

              <p className="mt-1.5 truncate text-[12.5px] font-semibold text-zinc-200 group-hover:text-white">
                {ep.showName}
              </p>
              <p className="truncate text-[11px] text-zinc-500">{ep.episodeName}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
