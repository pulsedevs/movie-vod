import { NextRequest, NextResponse } from 'next/server';
import { CACHE } from '@/lib/cache';

/**
 * What a hover preview needs for one title, in one small cached call:
 * GET /api/media/preview?type=movie|tv&id=<tmdb>
 *   -> { trailerKey, logoPath, runtime (minutes; TV = an episode), backdropPath, title }
 */
type Video = { site?: string; type?: string; key?: string; official?: boolean };
type Logo = { file_path: string; iso_639_1: string | null; vote_average: number };

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const id = Number(request.nextUrl.searchParams.get('id'));
  if ((type !== 'movie' && type !== 'tv') || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'type must be movie|tv and id a TMDB id' }, { status: 400 });
  }
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'TMDB key missing' }, { status: 500 });

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&append_to_response=videos,images&include_image_language=en,null`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'not found' }, { status: res.status === 404 ? 404 : 502 });
    }
    const d = await res.json();
    const vids: Video[] = (d.videos?.results ?? []).filter((v: Video) => v.site === 'YouTube' && v.key);
    const trailer =
      vids.find((v) => v.type === 'Trailer' && v.official) ??
      vids.find((v) => v.type === 'Trailer') ??
      vids.find((v) => v.type === 'Teaser') ??
      null;
    const logos: Logo[] = d.images?.logos ?? [];
    const logo =
      [...logos].filter((l) => l.iso_639_1 === 'en').sort((a, b) => b.vote_average - a.vote_average)[0] ?? logos[0] ?? null;

    return NextResponse.json(
      {
        trailerKey: trailer?.key ?? null,
        logoPath: logo?.file_path ?? null,
        runtime: (type === 'movie' ? d.runtime : d.episode_run_time?.[0]) || null,
        backdropPath: d.backdrop_path ?? null,
        title: d.title ?? d.name ?? null,
      },
      { headers: CACHE.details() },
    );
  } catch {
    return NextResponse.json({ error: 'TMDB unreachable' }, { status: 502 });
  }
}
