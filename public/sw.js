// Enhanced service worker for caching assets and improving performance
// Version: 1.3.1 - Ad Network Removed (couphaithuph.net)

const CACHE_VERSION = 'v1.3.1';
const CACHE_NAME = `boredflix-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${CACHE_VERSION}`;
const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const CHUNK_CACHE = `chunk-cache-${CACHE_VERSION}`;

// Security configuration
const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://image.tmdb.org',
  'https://api.themoviedb.org'
];

const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache size
const MAX_CACHE_ENTRIES = 1000; // Maximum cache entries

// Assets to cache on install (critical for first load)
const PRECACHE_ASSETS = [
  '/',
  '/images/placeholder-poster.png',
  '/images/boredflix-logo.svg',
  '/images/boredflix-icon-couch.svg',
  '/favicon.ico',
  '/next.svg',
  '/vercel.svg'
];

// Security: Validate origin
function isAllowedOrigin(url) {
  const origin = new URL(url).origin;
  return ALLOWED_ORIGINS.includes(origin);
}

// Security: Validate response before caching
function isValidResponse(response) {
  return response && 
         response.status === 200 && 
         response.type === 'basic' || response.type === 'cors';
}

// Security: Sanitize cache keys
function sanitizeCacheKey(request) {
  const url = new URL(request.url);
  // Remove sensitive query parameters
  const sensitiveParams = ['api_key', 'token', 'session'];
  sensitiveParams.forEach(param => {
    url.searchParams.delete(param);
  });
  return url.toString();
}

// Install event - precache static assets
self.addEventListener('install', (event) => {
  const isDevelopment = self.location.hostname === 'localhost';
  if (isDevelopment) {
    console.log(`[Service Worker] Installing new version ${CACHE_VERSION}`);
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        if (isDevelopment) {
          console.log('[Service Worker] Precaching critical assets');
        }
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        if (isDevelopment) {
          console.error('[Service Worker] Install failed:', error);
        }
      })
  );
});

// Activation event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new service worker');
  
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE, CHUNK_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log(`[Service Worker] Deleting old cache: ${cacheToDelete}`);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Helper function to determine cache TTL based on resource type
const getCacheTTL = (url, resourceType) => {
  // TMDB images can be cached longer
  if (url.includes('image.tmdb.org')) {
    return 7 * 24 * 60 * 60; // 7 days in seconds
  }
  
  // API responses should be fresher
  if (url.includes('/api/') || url.includes('themoviedb.org')) {
    return 30 * 60; // 30 minutes in seconds
  }
  
  // Static assets like CSS, JS
  if (resourceType === 'static') {
    return 24 * 60 * 60; // 1 day in seconds
  }
  
  // Default cache time
  return 60 * 60; // 1 hour in seconds
};

// Helper to add cache headers to response
const addCacheHeaders = (response, ttl) => {
  // Clone the response
  const responseToCache = response.clone();
  
  // Create new headers
  const headers = new Headers(responseToCache.headers);
  headers.set('Cache-Control', `max-age=${ttl}`);
  
  // Create new response with updated headers
  return new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headers
  });
};

// Main fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Security: Only handle requests from allowed origins
  if (!isAllowedOrigin(event.request.url)) {
    return;
  }
  
  // Security: Skip sensitive requests
  if (event.request.url.includes('auth') || 
      event.request.url.includes('login') ||
      event.request.url.includes('password') ||
      event.request.method !== 'GET') {
    return;
  }

  // Special handling for TMDB images - Cache first with network fallback
  if (url.origin.includes('image.tmdb.org')) {
    // Check if image is likely to be an LCP image (poster or backdrop)
    const isLikelyLCPImage = url.pathname.includes('/original/') || 
                            url.pathname.includes('/w1280/') || 
                            url.pathname.includes('/w780/');
    
    // Use different strategy for LCP images vs regular images
    if (isLikelyLCPImage) {      // For LCP images, use network-first to ensure freshness
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (!isValidResponse(response)) {
              return caches.match(event.request);
            }
            
            // Cache the fresh response with sanitized key
            const ttl = getCacheTTL(event.request.url, 'image');
            const cachedResponse = addCacheHeaders(response.clone(), ttl);
            
            caches.open(IMAGE_CACHE).then(cache => {
              const sanitizedKey = sanitizeCacheKey(event.request);
              cache.put(sanitizedKey, cachedResponse);
            });
            
            return response;
          })
          .catch(() => {
            // Fall back to cache if network fails
            return caches.match(event.request).then(cachedResponse => {
              return cachedResponse || caches.match('/images/placeholder-poster.png');
            });
          })
      );
    } else {
      // For regular images, use cache-first strategy
      event.respondWith(
        caches.open(IMAGE_CACHE).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            // Return cached response if available
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Otherwise fetch from network and cache
            return fetch(event.request).then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Cache the response with proper TTL
              const ttl = getCacheTTL(event.request.url, 'image');
              const cachedResponse = addCacheHeaders(response, ttl);
              cache.put(event.request, cachedResponse);
              
              return response;
            }).catch(() => {
              // If both cache and network fail, return placeholder image
              return caches.match('/images/placeholder-poster.png');
            });
          });
        })
      );
    }
    return;
  }
  
  // For API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('themoviedb.org')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the response
          if (response.status === 200) {
            const ttl = getCacheTTL(event.request.url, 'api');
            const responseToCache = addCacheHeaders(response, ttl);
            
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || new Response(JSON.stringify({error: 'Network error'}), {
              headers: {'Content-Type': 'application/json'},
              status: 503
            });
          });
        })
    );
    return;
  }
    // Enhanced handling for static assets (CSS, JS, fonts) with chunk error recovery
  if (event.request.url.match(/\.(css|js|woff2?|ttf|eot)$/)) {
    // Special handling for Next.js chunks
    const isNextChunk = event.request.url.includes('/_next/static/chunks/') || 
                       event.request.url.includes('/_next/static/css/');
    
    if (isNextChunk) {
      // For Next.js chunks, use network-first to avoid stale chunk issues
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              // Cache the fresh chunk
              const ttl = getCacheTTL(event.request.url, 'static');
              const responseToCache = addCacheHeaders(networkResponse.clone(), ttl);
              
              caches.open(CHUNK_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
              return networkResponse;
            }
            throw new Error(`Chunk load failed: ${networkResponse.status}`);
          })
          .catch(() => {
            // If network fails, try cache but also signal potential chunk error
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // No cached version available - this will cause a chunk load error
              // which our client-side handlers will catch
              throw new Error('Chunk not available in cache or network');
            });
          })
      );
    } else {
      // For other static assets, use cache-first strategy
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          // Return cached version immediately for speed
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Update cache with new version in background
            if (networkResponse && networkResponse.status === 200) {
              const ttl = getCacheTTL(event.request.url, 'static');
              const responseToCache = addCacheHeaders(networkResponse, ttl);
              
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
            // If update fails, still use cached version
            return cachedResponse;
          });
          
          return cachedResponse || fetchPromise;
        })
      );
    }
    return;
  }
  
  // Default strategy for all other requests - Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Cache a copy of the response
        const ttl = getCacheTTL(event.request.url, 'default');
        const responseToCache = addCacheHeaders(response, ttl);
        
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Background sync for offline capabilities
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  }
});

// Sync watchlist data when coming back online
async function syncWatchlist() {
  const offlineData = await getOfflineWatchlistActions();
  if (offlineData && offlineData.length) {
    try {
      // Send the data to your server
      await fetch('/api/watchlist/sync', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(offlineData)
      });
      // Clear processed offline actions
      await clearOfflineWatchlistActions();
    } catch (error) {
      console.error('[Service Worker] Sync failed:', error);
    }
  }
}

// Performance optimization - prefetch likely navigation paths
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PREFETCH_PAGES') {
    const urls = event.data.urls;
    if (Array.isArray(urls) && urls.length) {
      caches.open(RUNTIME_CACHE).then((cache) => {
        urls.forEach(url => {
          fetch(url, { credentials: 'same-origin' })
            .then(response => {
              if (response && response.status === 200) {
                cache.put(url, response);
              }
            })
            .catch(error => {
              console.error('[Service Worker] Prefetch failed:', error);
            });
        });
      });
    }
  }
});

// These functions would be implemented based on your storage approach
async function getOfflineWatchlistActions() {
  // Placeholder implementation
  return [];
}

async function clearOfflineWatchlistActions() {
  // Placeholder implementation
}
