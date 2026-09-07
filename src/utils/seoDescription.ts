/**
 * Shared meta-description builder for movie/TV detail pages.
 *
 * The previous per-page templates repeated the title TWICE inside boilerplate
 * ("Where can I watch X online for free? You can stream X (year) on BoredFlix…"),
 * which consumed the entire 155-char budget on long titles — the synopsis was cut off
 * entirely and every page ended up with a near-identical description. Google rewrites or
 * ignores snippets like that, and it reinforces the thin/duplicate signal.
 *
 * Here the title appears ONCE and the unique synopsis leads, so each page gets a distinct,
 * useful description that still fits the snippet budget.
 */

const MAX_LEN = 155;
const SEPARATOR = ' — ';

/** Trim to `max` at a word boundary (never mid-word) and add an ellipsis. */
function clampWords(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:—-]+$/, '')}…`;
}

export interface DetailDescriptionInput {
  title: string;
  /** Release / first-air year. 'N/A' or empty is ignored. */
  year?: string;
  overview?: string | null;
  /** Comma-joined genre names, used only when TMDB has no overview. */
  genres?: string;
  kind: 'movie' | 'tv';
  /** e.g. "3 seasons" — TV fallback only. */
  seasonsText?: string;
}

export function buildDetailDescription({
  title,
  year,
  overview,
  genres,
  kind,
  seasonsText,
}: DetailDescriptionInput): string {
  // Front-load the transactional phrase people actually type ("watch X online free"), then the
  // unique synopsis. Descriptions don't affect ranking, but matching the searcher's own wording
  // in the snippet drives CTR — and the synopsis keeps every page's description distinct.
  const titleYear = year && year !== 'N/A' ? `${title} (${year})` : title;
  const head = kind === 'tv'
    ? `Watch ${titleYear} online free`
    : `Watch ${titleYear} online free in HD`;
  const tail = ' No sign up on BoredFlix.';

  // The synopsis is the only genuinely unique part; fall back to catalogue facts without it.
  const fallback =
    kind === 'tv'
      ? `${genres || 'TV'} series${seasonsText ? `, ${seasonsText}` : ''}.`
      : `${genres || 'Movie'}.`;
  const middle = overview?.trim() || fallback;

  const budget = MAX_LEN - head.length - SEPARATOR.length - tail.length;

  // Pathologically long title: keep title + brand rather than emit a stub of a synopsis.
  if (budget < 40) return clampWords(`${head}.${tail}`, MAX_LEN);

  return `${head}${SEPARATOR}${clampWords(middle, budget)}${tail}`;
}
