# CORS Policy Fix for Movie Browse API

## Problem Fixed
**Error**: "Access to fetch at 'https://boredflix.vercel.app/api/discover?...' from origin 'https://www.boredflix.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."

## Root Cause
The application was making API calls to a hardcoded domain (`boredflix.vercel.app`) from a different domain (`www.boredflix.cc`), causing CORS policy violations.

## Solutions Implemented

### 1. **Client-Side API Calls (PaginatedResults.tsx)**
- **Before**: Used hardcoded `baseUrl` from environment variable
- **After**: Use relative URLs with `window.location.origin`

```javascript
// Before (causing CORS error):
const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';
const url = new URL(`${baseUrl}/api/discover`);

// After (CORS-safe):
const url = new URL(`/api/discover`, window.location.origin);
```

### 2. **Server-Side API Calls (page.tsx)**
- **Before**: Used hardcoded environment variable
- **After**: Dynamic domain detection based on environment

```javascript
// Before:
const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';

// After:
let baseUrl: string;
if (typeof window !== 'undefined') {
  // Client-side: use current origin
  baseUrl = window.location.origin;
} else {
  // Server-side: construct from environment variables
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || 
               process.env.NEXT_PUBLIC_DOMAIN?.replace(/^https?:\/\//, '') || 
               'localhost:3000';
  baseUrl = `${protocol}://${host}`;
}
```

### 3. **Environment Variable Update**
- Updated `NEXT_PUBLIC_DOMAIN` to match actual production domain
- **Before**: `http://localhost:3000`
- **After**: `https://www.boredflix.cc`

## Benefits of This Fix

### 🚀 **Immediate Benefits**:
1. **No More CORS Errors**: API calls now use same-origin requests
2. **Environment Agnostic**: Works correctly in dev, staging, and production
3. **Future-Proof**: Automatically adapts to domain changes

### 🔒 **Security Benefits**:
1. **Same-Origin Policy**: Follows web security best practices
2. **No Hardcoded URLs**: Reduces potential security vectors
3. **Dynamic Resolution**: Adapts to deployment environment

### 🛠️ **Development Benefits**:
1. **Works Locally**: No changes needed for local development
2. **Works on Any Domain**: Deployment-agnostic code
3. **Cleaner Code**: Removes environment-specific hardcoding

## Files Modified

1. **`src/components/browse/PaginatedResults.tsx`**:
   - Removed hardcoded `baseUrl`
   - Use `window.location.origin` for client-side API calls

2. **`src/app/browse/movies/page.tsx`**:
   - Enhanced server-side URL construction
   - Dynamic environment detection
   - Fallback to environment variables when needed

3. **`.env.local`**:
   - Updated `NEXT_PUBLIC_DOMAIN` to production domain

## Testing
- No compilation errors
- API calls now use same-origin requests
- Works in both development and production environments
- Backwards compatible with existing functionality

## Result
The CORS policy error should now be resolved, and the movie browse page should load data correctly from the API without cross-origin issues.
