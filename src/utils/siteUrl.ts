const FALLBACK_ORIGIN = 'https://boredflix.tv';

/** Default legacy hosts if NEXT_PUBLIC_SEO_REDIRECT_HOSTS is unset */
const DEFAULT_LEGACY_HOSTS =
  'boredflix.com,www.boredflix.com,www.boredflix.tv';

function parseConfiguredSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    FALLBACK_ORIGIN;

  try {
    const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`;
    return new URL(withProtocol);
  } catch {
    return new URL(FALLBACK_ORIGIN);
  }
}

/** Canonical origin for metadata, sitemaps, JSON-LD (from env). */
export function getCanonicalOrigin(): string {
  return parseConfiguredSiteUrl().origin;
}

/** Hostname only, for middleware redirects (from env). */
export function getCanonicalHost(): string {
  return parseConfiguredSiteUrl().host;
}

/** Build an absolute canonical URL for a path (e.g. `/movie/123/slug`). */
export function buildCanonicalUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getCanonicalOrigin()}${normalized}`;
}

/**
 * Hosts that should 308-redirect to the canonical site.
 * Set NEXT_PUBLIC_SEO_REDIRECT_HOSTS=comma,separated,hosts (no https).
 */
export function getLegacyRedirectHosts(): Set<string> {
  const raw =
    process.env.NEXT_PUBLIC_SEO_REDIRECT_HOSTS ?? DEFAULT_LEGACY_HOSTS;

  return new Set(
    raw
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );
}
