/**
 * Sitemap lastmod must be W3C Datetime (YYYY-MM-DD is safest for Google Search Console).
 * Rejects future TMDB release dates and invalid strings.
 */
export function formatSitemapLastMod(value?: string | null): string {
  const today = startOfUtcDay(new Date());

  if (!value || typeof value !== 'string' || !value.trim()) {
    return formatDateOnly(today);
  }

  const parsed = parseTmdbDate(value.trim());
  if (!parsed) {
    return formatDateOnly(today);
  }

  const day = startOfUtcDay(parsed);
  if (day.getTime() > today.getTime()) {
    return formatDateOnly(today);
  }

  return formatDateOnly(day);
}

function parseTmdbDate(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const d = new Date(`${value}-01T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}$/.test(value)) {
    const d = new Date(`${value}-01-01T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
