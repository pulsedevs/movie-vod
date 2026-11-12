import { NextRequest, NextResponse } from "next/server";

// Proxy to the LemurPlay VOD backend for one TV episode, addressed the way the site knows it
// (TMDB show id + season + episode). Same contract as the movie route: { status: 'ready' |
// 'preparing' | 'unavailable', url }, and 404 when the panel has no such show/episode (the page
// then falls back to its other sources). Keeps the shared secret server-side.
export const dynamic = "force-dynamic";

const BACKEND = process.env.LEMUR_BACKEND || process.env.NEXT_PUBLIC_LEMUR_BACKEND || "http://localhost:8000";
const SECRET = process.env.LEMUR_INTERNAL_SECRET || "";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tmdb: string; season: string; episode: string }> },
) {
  const { tmdb, season, episode } = await ctx.params;
  if (!/^\d+$/.test(tmdb) || !/^\d+$/.test(season) || !/^\d+$/.test(episode)) {
    return NextResponse.json({ status: "error", error: "bad episode" }, { status: 400 });
  }
  const qs = new URLSearchParams();
  const orig = req.nextUrl.searchParams.get("orig");   // show's TMDB original_language
  if (orig) qs.set("orig", orig.slice(0, 5).toLowerCase());
  const q = qs.toString() ? `?${qs}` : "";
  try {
    const r = await fetch(`${BACKEND}/play/tv/${tmdb}/${season}/${episode}${q}`, {
      headers: SECRET ? { "x-internal-secret": SECRET } : {},
      cache: "no-store",
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch {
    return NextResponse.json({ status: "error", error: "backend unreachable" }, { status: 502 });
  }
}
