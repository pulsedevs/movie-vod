# Enhanced Sitemap Strategy for Comprehensive Indexing

## Current State
- 50 popular movies in sitemap
- 50 popular TV shows in sitemap
- Static pages covered
- Good for top content, but missing long-tail content

## Proposed Enhancement: Paginated Sitemaps

### 1. Multiple Movie Sitemaps
```
/sitemap-movies-1.xml  (Movies 1-1000, popular)
/sitemap-movies-2.xml  (Movies 1001-2000, popular)
/sitemap-movies-3.xml  (Movies 2001-3000, popular)
/sitemap-movies-genre-action.xml
/sitemap-movies-genre-horror.xml
/sitemap-movies-new-releases.xml
```

### 2. Multiple TV Sitemaps
```
/sitemap-tv-1.xml      (TV shows 1-1000, popular)
/sitemap-tv-2.xml      (TV shows 1001-2000, popular) 
/sitemap-tv-genre-drama.xml
/sitemap-tv-genre-comedy.xml
/sitemap-tv-new-releases.xml
```

### 3. Discovery Flow Enhancement
```
Main Sitemap Index
├── Static Pages Sitemap
├── Popular Movies Sitemap (top 50)
├── Popular TV Sitemap (top 50)
├── Extended Movies Sitemap 1 (51-1000)
├── Extended Movies Sitemap 2 (1001-2000)
├── Extended TV Sitemap 1 (51-1000)
├── Extended TV Sitemap 2 (1001-2000)
├── Genre-based Sitemaps
└── New Releases Sitemaps
```

### 4. Implementation Strategy

#### Phase 1: Expand Current Sitemaps
- Modify existing movie/TV sitemaps to include 1000 items instead of 50
- Use multiple TMDB API pages
- Implement smart caching to avoid API limits

#### Phase 2: Add Genre Sitemaps
- Create genre-specific sitemaps for better content organization
- Target long-tail SEO keywords

#### Phase 3: Add Time-based Sitemaps
- New releases sitemap (updated weekly)
- Trending content sitemap (updated daily)

### 5. Benefits
- **Comprehensive Coverage**: Index thousands of movies/TV shows
- **Better SEO**: Target genre-specific and long-tail keywords
- **Faster Discovery**: New content gets indexed within days
- **User Experience**: Better content discoverability
- **Search Rankings**: More indexed pages = better domain authority

### 6. Technical Implementation
- Modify sitemap index to reference multiple sub-sitemaps
- Add pagination logic to TMDB API calls
- Implement intelligent caching strategy
- Add fallback content for each sitemap type
