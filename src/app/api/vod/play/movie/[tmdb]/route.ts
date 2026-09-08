import { NextRequest, NextResponse } from "next/server";

// Proxy to the LemurPlay VOD backend. Keeps the shared secret server-side and gives the browser a
// same-origin endpoint (no CORS). The backend resolves the TMDB id -> panel title, packages it to
// HLS on first play, and returns { status: 'ready'|'preparing', url }.
export const dynamic = "force-dynamic";

const BACKEND = process.env.LEMUR_BACKEND || process.env.NEXT_PUBLIC_LEMUR_BACKEND || "http://localhost:8000";
const SECRET = process.env.LEMUR_INTERNAL_SECRET || "";

export async function GET(req: NextRequest, ctx: { params: Promise<{ tmdb: string }> }) {
  const { tmdb } = await ctx.params;
  // v = a specific copy the viewer picked; lang = preferred audio language (en, fr, nl …).
  const sp = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  const v = sp.get("v"); const lang = sp.get("lang");
  if (v) qs.set("v", v);
  if (lang) qs.set("lang", lang.slice(0, 5).toLowerCase());
  const orig = sp.get("orig");                      // film's TMDB original_language
  if (orig) qs.set("orig", orig.slice(0, 5).toLowerCase());
  const q = qs.toString() ? `?${qs}` : "";
  try {
    const r = await fetch(`${BACKEND}/play/movie/${encodeURIComponent(tmdb)}${q}`, {
      headers: SECRET ? { "x-internal-secret": SECRET } : {},
      cache: "no-store",
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch {
    return NextResponse.json({ status: "error", error: "backend unreachable" }, { status: 502 });
  }
}
