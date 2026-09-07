# Cloudflare Deployment Error Fix

## Problem
Each deployment causes errors due to Cloudflare caching old files and security rules.

## Immediate Solutions

### 1. Purge Cloudflare Cache After Each Deployment
```bash
# Run this after every deployment
npm run purge-cache
# or
node scripts/purge-cloudflare-cache.js
```

### 2. Hard Refresh Browser
- `Ctrl+Shift+R` (Windows/Linux)
- `Cmd+Shift+R` (Mac)

## Cloudflare Cache Rules Setup

### Rule 1: JavaScript/CSS Cache (Priority 1)
```
Field: File extension
Operator: equals
Value: js,css,woff,woff2,ttf,eot
Cache Level: Standard
Browser TTL: 1 hour
Edge TTL: 1 day
```

### Rule 2: Images Cache (Priority 2)
```
Field: File extension  
Operator: equals
Value: jpg,jpeg,png,gif,ico,svg,webp
Cache Level: Standard
Browser TTL: 1 day
Edge TTL: 7 days
```

### Rule 3: HTML No Cache (Priority 3)
```
Field: File extension
Operator: equals  
Value: html
Cache Level: Bypass
```

### Rule 4: API No Cache (Priority 4)
```
Field: URI Path
Operator: starts with
Value: /api/
Cache Level: Bypass
```

## Security Rules to Check

### 1. Rate Limiting
- Ensure your deployment IP isn't rate limited
- Whitelist Vercel deployment IPs if needed

### 2. Bot Fight Mode
- May interfere with build processes
- Consider disabling for deployment domains

## Automated Solution

### Add to package.json:
```json
{
  "scripts": {
    "deploy": "npm run build && npm run purge-cache",
    "purge-cache": "node scripts/purge-cloudflare-cache.js"
  }
}
```

### Environment Variables Needed:
```
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Build-time Cache Busting

Your build already includes timestamps, but ensure:

1. **Static assets have unique names**
2. **HTML files are not cached**
3. **API routes bypass cache**

## Common Error Patterns

### 1. "404 Not Found" after deployment
- **Cause**: Old cached 404 responses
- **Fix**: Purge cache for affected URLs

### 2. "JavaScript errors" or "white screen"
- **Cause**: Mixed old/new JavaScript files
- **Fix**: Purge entire cache + hard refresh

### 3. "API errors" or "CORS issues"
- **Cause**: Cached pre-flight requests
- **Fix**: Purge API cache + check security rules

## Quick Debug Checklist

1. ✅ Purged Cloudflare cache?
2. ✅ Hard refreshed browser?
3. ✅ Checked cache rule priorities?
4. ✅ Verified no security blocks?
5. ✅ Confirmed build deployed to Vercel?

## Prevention

- **Always purge cache after deployment**
- **Use cache-busting timestamps**
- **Set proper cache headers**
- **Monitor Cloudflare Analytics for 404s/errors**
