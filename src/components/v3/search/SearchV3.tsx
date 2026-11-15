'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import type { MediaItem } from '@/types';
import { PosterFrame } from '../rows/Cards';
import { useV3Scroll } from '../V3Shell';
import { AmbientPalette } from '../ambient/AmbientContext';
import { YELLOW_PALETTE } from '../ambient/palette';

/** What /api/search returns per result. */
type ApiResult = {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  overview?: string;
  release_date?: string;
  vote_average?: number;
};

/** The poster cards read title/name and release/first-air date by type. */
export const toMediaItem = (r: ApiResult): MediaItem =>
  ({
    id: r.id,
    media_type: r.media_type,
    poster_path: r.poster_path,
    overview: r.overview ?? '',
    vote_average: r.vote_average ?? 0,
    ...(r.media_type === 'movie'
      ? { title: r.title, release_date: r.release_date ?? '' }
      : { name: r.title, first_air_date: r.release_date ?? '' }),
  }) as unknown as MediaItem;

const keyOf = (i: MediaItem) => `${i.media_type}-${i.id}`;
const dedupe = (list: MediaItem[]) => {
  const seen = new Set<string>();
  return list.filter((i) => (seen.has(keyOf(i)) ? false : (seen.add(keyOf(i)), true)));
};

const TRENDING_GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5';
const RESULTS_GRID = 'grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-6 lg:grid-cols-6';

/**
 * The v3 search page, like cinejoy's: a yellow aurora behind "Discover something new" and a glass
 * search pill; empty, it shows Trending Today; typing searches as you go (debounced), keeps the query
 * in the URL (?q=) and loads more results as you scroll.
 */
export default function SearchV3({
  initialQuery,
  initialResults,
  initialTotalPages,
  trending,
}: {
  initialQuery: string;
  initialResults: MediaItem[];
  initialTotalPages: number;
  trending: MediaItem[];
}) {
  const router = useRouter();
  const scroll = useV3Scroll();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim()); // the debounced one being shown
  const [results, setResults] = useState<MediaItem[]>(initialResults);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  // Bumped when a new result set lands: the grid remounts and cascades in (not on load-more).
  const [setId, setSetId] = useState(0);
  const gen = useRef(0); // late answers for an older query are dropped
  const sentinel = useRef<HTMLDivElement>(null);

  // Empty page: the box is ready to type in.
  useEffect(() => {
    if (!initialQuery) inputRef.current?.focus({ preventScroll: true });
  }, [initialQuery]);

  // Debounce what is typed into the shown query (and the URL).
  useEffect(() => {
    const t = setTimeout(() => {
      const q = text.trim();
      if (q === query) return;
      setQuery(q);
      router.replace(q ? `/search?q=${encodeURIComponent(q)}` : '/search', { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [text, query, router]);

  const fetchPage = useCallback(async (q: string, p: number) => {
    const res = await fetch(`/api/search?query=${encodeURIComponent(q)}&page=${p}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { results?: ApiResult[]; total_pages?: number };
    return { items: (data.results ?? []).map(toMediaItem), total: data.total_pages ?? 1 };
  }, []);

  // A new query: first page (the server already rendered the initial one).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (query === initialQuery.trim()) return;
    }
    const id = ++gen.current;
    setError(false);
    setPage(1);
    if (!query) {
      setResults([]);
      setTotalPages(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPage(query, 1)
      .then(({ items, total }) => {
        if (id !== gen.current) return;
        setResults(dedupe(items));
        setTotalPages(total);
        setSetId((n) => n + 1);
      })
      .catch(() => id === gen.current && (setResults([]), setError(true)))
      .finally(() => id === gen.current && setLoading(false));
  }, [query, initialQuery, fetchPage]);

  // More results as the end comes into view.
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !query || page >= totalPages) return;
    const id = gen.current;
    setLoadingMore(true);
    fetchPage(query, page + 1)
      .then(({ items }) => {
        if (id !== gen.current) return;
        setResults((prev) => dedupe([...prev, ...items]));
        setPage((p) => p + 1);
      })
      .catch(() => {})
      .finally(() => id === gen.current && setLoadingMore(false));
  }, [loading, loadingMore, query, page, totalPages, fetchPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), {
      root: scroll?.current ?? null,
      rootMargin: '1200px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, scroll, results.length]);

  const searching = text.trim().length > 0;
  // Typed but not searched yet (debounce), or searching.
  const pending = loading || query !== text.trim();

  return (
    <div className="v3-gutter relative pb-10 pt-28 md:pt-32">
      <AmbientPalette palette={YELLOW_PALETTE} />

      <h1 className="v3-display text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-xl md:text-[40px]">
        Discover something <span className="text-amber-300">new</span>
      </h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(text.trim());
          inputRef.current?.blur();
        }}
        className="mx-auto mt-7 max-w-[560px]"
      >
        <label className="group flex h-12 items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] pl-5 pr-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150 transition focus-within:border-amber-300/60 focus-within:bg-white/[0.11] focus-within:ring-4 focus-within:ring-amber-300/15">
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-300" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-white/50 transition-colors group-focus-within:text-amber-300" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search movies & shows..."
            aria-label="Search movies and shows"
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-white caret-amber-300 outline-none placeholder:text-white/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </form>

      {!searching ? (
        trending.length > 0 && (
          <section className="mt-16 md:mt-28" aria-labelledby="trending-today">
            <h2 id="trending-today" className="mb-6 text-center text-lg font-medium tracking-tight text-white md:text-xl">
              Trending Today
            </h2>
            <div className={`${TRENDING_GRID} v3-cascade`}>
              {trending.slice(0, 20).map((item, i) => (
                <PosterFrame key={keyOf(item)} item={item} priority={i < 5} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 250px" />
              ))}
            </div>
          </section>
        )
      ) : (
        <section className="mt-10 md:mt-14" aria-live="polite" aria-busy={loading}>
          {query && !loading && !error && results.length > 0 && (
            <p className="mb-5 text-sm text-white/50">
              Results for <span className="font-medium text-amber-300">&ldquo;{query}&rdquo;</span>
            </p>
          )}
          {error && !pending ? (
            <p className="py-16 text-center text-white/60">Search isn&rsquo;t answering right now. Try again in a moment.</p>
          ) : results.length === 0 && pending ? (
            <div className={`${RESULTS_GRID} v3-cascade`} aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold text-white">No results for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-sm text-white/55">Check the spelling, or try the title in English.</p>
            </div>
          ) : (
            <>
              {/* The previous results stay (dimmed) until the new ones arrive, then cascade in. */}
              <div key={setId} className={`${RESULTS_GRID} v3-cascade transition-opacity duration-200 ${pending ? 'opacity-50' : ''}`}>
                {results.map((item, i) => (
                  <PosterFrame key={keyOf(item)} item={item} priority={i < 6} sizes="(max-width: 640px) 33vw, 204px" />
                ))}
              </div>
              <div ref={sentinel} className="h-px" />
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
