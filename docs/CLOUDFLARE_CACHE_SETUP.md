# Cloudflare Cache Setup — BoredFlix

## The Golden Rule

**Always use `override_origin` in Cloudflare Cache Rules.**

Never use `respect_origin` for this project. Next.js sends `Cache-Control: private, no-cache, no-store` for dynamic (SSR) pages. If Cloudflare respects that header, it caches nothing. Cache Reserve goes from gigabytes → megabytes. The site becomes slow.

---

## Working Configuration (as of June 2026)

Zone ID: `d1c861f141366eb83917dcbfe98c9d63`  
Ruleset ID: `13c661bd731d4317a315d16b9c717e9f`

### Rule 1 — Static Assets
- **Expression:** `http.request.full_uri wildcard r"https://*.boredflix.tv/_next/static/*"`
- **Edge TTL:** `override_origin: 31536000` (1 year)
- **Browser TTL:** bypass (let Next.js handle browser cache with immutable headers)
- **Cache Reserve:** eligible ✅
- **Why:** Next.js hashes static chunk filenames — they never change for the same deploy. Safe to cache forever.

### Rule 2 — API Routes
- **Expression:** `starts_with(http.request.uri.path, "/api/")`
- **Edge TTL:** `override_origin: 604800` (1 week)
- **Browser TTL:** bypass
- **Cache Reserve:** eligible ✅
- **Why:** TMDB data (genres, discover results, search) doesn't change minute-to-minute. 1 week is safe. `build-info` is an exception but the trade-off is acceptable.

### Rule 3 — HTML Pages
- **Expression:** `(not starts_with(http.request.uri.path, "/api/")) and (not starts_with(http.request.uri.path, "/_next/")) and (not starts_with(http.request.uri.path, "/images/"))`
- **Edge TTL:** `override_origin: 31536000` (1 year)
- **Browser TTL:** bypass
- **Cache Reserve:** eligible ✅
- **Why:** Movie/TV detail pages and browse pages are rendered from TMDB data that rarely changes. Cloudflare serves from edge; new deploys bust the cache automatically.

### Rule 4 — Images
- **Expression:** `http.request.full_uri wildcard r"https://*.boredflix.tv/images/*"`
- **Edge TTL:** `override_origin: 31536000` (1 year)
- **Browser TTL:** `override_origin: 31536000`
- **Cache Reserve:** eligible ✅
- **Why:** Public images are static assets.

---

## What NOT to Do

### ❌ Don't use `respect_origin`
```
edge_ttl: { mode: "respect_origin" }  // BREAKS CACHING
```
Next.js SSR pages send `Cache-Control: private, no-cache, no-store`. Cloudflare reads this and caches nothing. Cache Reserve drops from gigabytes to megabytes.

### ❌ Don't use short edge TTLs (like 2 hours)
```
edge_ttl: { mode: "override_origin", default: 7200 }  // TOO SHORT
```
Every 2 hours the edge cache expires. Cache Reserve gets hammered with reads. The site makes frequent round trips to origin.

### ❌ Don't set `CDN-Cache-Control` headers expecting Cloudflare to use them
Unless you use `respect_origin`, Cloudflare ignores `CDN-Cache-Control`. And if you DO use `respect_origin`, Next.js's `Cache-Control: private` overrides everything anyway. Just use `override_origin`.

---

## How Cache Reserve Works

```
User Request
    ↓
Cloudflare Edge Cache
    HIT → serve instantly (<10ms)
    ↓ MISS
Cloudflare Cache Reserve
    HIT → serve + repopulate edge (~50ms)
    ↓ MISS
Vercel Origin (Next.js)
    → render page → TMDB API call (~300-800ms)
    → store in Cache Reserve + Edge
```

Cache Reserve is populated when:
1. Edge cache misses AND Cache Reserve misses → origin is called → result stored in both
2. Items stay in Cache Reserve for up to 30 days

With 1-year edge TTL, popular pages almost never leave edge cache. Cache Reserve stores less-popular pages that eventually get evicted from edge.

**Healthy stats look like:** millions of reads (Cache Reserve serving frequently), thousands of writes (many unique pages cached), gigabytes stored.

---

## Next.js Code Setup

### Browse pages — remove `force-dynamic`, use `revalidate`
```ts
// ❌ Bad — forces re-render on every Cloudflare cache miss, no ISR fallback
export const dynamic = 'force-dynamic';

// ✅ Good — ISR every 5 minutes as fallback, Cloudflare still serves from edge for 1 year
export const revalidate = 300;
```

### Parallelize TMDB calls in `loadBrowsePage.ts`
```ts
// ❌ Bad — sequential, wastes 200-400ms
const genres = await getGenres(genreType);
const results = await fetchBrowseResults(...);

// ✅ Good — parallel
const [genres, results] = await Promise.all([
  getGenres(genreType),
  fetchBrowseResults(...),
]);
```

### `next.config.ts` headers
The `CDN-Cache-Control` headers in `next.config.ts` are irrelevant when using `override_origin` in Cloudflare. Keep `Cache-Control: public, max-age=0, must-revalidate` on HTML pages so browsers always revalidate with Cloudflare edge (which serves the cached version instantly).

---

## Cloudflare API — Useful Commands

```bash
TOKEN="your-api-token"
ZONE="d1c861f141366eb83917dcbfe98c9d63"
RULESET="13c661bd731d4317a315d16b9c717e9f"

# List all cache rules
curl "https://api.cloudflare.com/client/v4/zones/$ZONE/rulesets/$RULESET" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# Update a specific rule
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/rulesets/$RULESET/rules/RULE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "action": "set_cache_settings", "action_parameters": { ... } }'
```

**Rule IDs:**
- Static Assets: `33d8bf9262934d25a601e1e61ff17c6e`
- API Routes: `0cb85ae5252d48dc8f206ce8d949e01a`
- HTML Pages: `ab5bae72ebda4374b255d5ecebae3ccf`
- Images: `9be8e71a9ac048abb404729bc127ffd6`

**API Token permissions needed:**
- `Zone:Cache Rules:Edit` — to modify rules
- `Zone:Analytics:Read` — to read cache hit stats (separate token needed)

---

## Summary for V3

1. Create 4 Cache Rules in Cloudflare (Static, API, HTML, Images)
2. All use `override_origin` — never `respect_origin`
3. TTLs: Static = 1 year, API = 1 week, HTML = 1 year, Images = 1 year
4. Enable Cache Reserve on all rules
5. In Next.js: use `revalidate` not `force-dynamic` on browse pages
6. In Next.js: parallelize independent TMDB fetch calls with `Promise.all`
