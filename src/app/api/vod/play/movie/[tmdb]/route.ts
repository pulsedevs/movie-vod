import { NextRequest, NextResponse } from "next/server";

// Proxy to the LemurPlay VOD backend. Keeps the shared secret server-side and gives the browser a
// same-origin endpoint (no CORS). The backend resolves the TMDB id -> panel title, packages it to
// HLS on first play, and returns { status: 'ready'|'preparing', url }.
export const dynamic = "force-dynamic";

const BACKEND = process.env.LEMUR_BACKEND || process.env.NEXT_PUBLIC_LEMUR_BACKEND || "http://localhost:8000";
const SECRET = process.env.LEMUR_INTERNAL_SECRET || "";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ tmdb: string }> }) {
  const { tmdb } = await ctx.params;
  try {
    const r = await fetch(`${BACKEND}/play/movie/${encodeURIComponent(tmdb)}`, {
      headers: SECRET ? { "x-internal-secret": SECRET } : {},
      cache: "no-store",
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch {
    return NextResponse.json({ status: "error", error: "backend unreachable" }, { status: 502 });
  }
}
