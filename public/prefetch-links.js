// Advanced prefetch utility for improved navigation performance
(function() {
  // Only run in the browser
  if (typeof window === 'undefined') return;
    // Configuration
  const config = {
    // How long to wait after hovering before prefetching
    hoverDelay: 100, // Increased for better performance
    // Maximum number of URLs to prefetch at once
    maxPrefetches: 8, // Reduced to avoid too many preloads
    // URLs that have already been prefetched
    prefetchedUrls: new Set(),
    // URLs currently being prefetched
    inProgressUrls: new Set(),
    // Limit prefetching on slow connections
    respectDataSaver: true,
    // Don't prefetch if mobile and on slow connection
    disableOnSlowConnection: true,
    // Prefetch priority URLs immediately
    priorityPaths: ['/browse/movies', '/browse/tv', '/', '/search'],
    // Use prefetch for all URLs to avoid preload warnings
    usePreloadForPriority: false
  };
  
  // Check connection speed if possible
  function isSlowConnection() {
    if (!navigator.connection) return false;
    
    if (config.respectDataSaver && navigator.connection.saveData) {
      return true;
    }
    
    // 3G or slower is considered slow
    return ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType);
  }
  
  // Prefetch a URL using fetch
  function prefetchUrl(url) {
    // Skip if already prefetched or in progress
    if (config.prefetchedUrls.has(url) || config.inProgressUrls.has(url)) {
      return;
    }
    
    // Skip if slow connection
    if (config.disableOnSlowConnection && isSlowConnection()) {
      return;
    }
    
    // Don't prefetch too many URLs
    if (config.prefetchedUrls.size >= config.maxPrefetches) {
      return;
    }
    
    // Mark as in progress
    config.inProgressUrls.add(url);
    
    // Use fetch to prefetch
    fetch(url, { 
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Purpose': 'prefetch' }
    })
    .then(() => {
      // Mark as prefetched
      config.prefetchedUrls.add(url);
      config.inProgressUrls.delete(url);
      
      // Also notify service worker for caching
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PREFETCH_PAGES',
          urls: [url]
        });
      }
    })
    .catch(() => {
      // Remove from in progress on error
      config.inProgressUrls.delete(url);
    });
  }
  
  // Create a link prefetch
  function createLinkPrefetch(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
    config.prefetchedUrls.add(url);
  }
  
  // Prefetch on hover or touchstart
  let hoverTimer = null;
  function handleLinkInteraction(event) {
    const link = event.currentTarget;
    if (!link || !link.href || link.target === '_blank') return;
    
    // Clear any existing timer
    if (hoverTimer) clearTimeout(hoverTimer);
    
    // Set a new timer
    hoverTimer = setTimeout(() => {
      const url = link.href;
      
      // Only prefetch same-origin URLs
      if (url.startsWith(window.location.origin)) {
        prefetchUrl(url);
      }
    }, config.hoverDelay);
  }
  
  // Stop prefetching if the user moves away
  function handleLinkLeave() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }
  
  // Detect visible links in the viewport and prefetch them
  function prefetchVisibleLinks() {
    // Use intersection observer if available
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target;
            if (link.href && link.href.startsWith(window.location.origin)) {
              // Prefetch after a short delay
              setTimeout(() => {
                prefetchUrl(link.href);
              }, 300);
            }
            // Unobserve after prefetching
            observer.unobserve(link);
          }
        });
      }, { threshold: 0.5 });
      
      // Observe all links
      document.querySelectorAll('a[href^="' + window.location.origin + '"]').forEach(link => {
        observer.observe(link);
      });
    }
  }
  
  // Add event listeners to all links
  function attachPrefetchEvents() {
    document.querySelectorAll('a[href^="' + window.location.origin + '"]').forEach(link => {
      // Skip links that already have listeners
      if (link.dataset.prefetchEnabled) return;
      
      link.addEventListener('mouseenter', handleLinkInteraction);
      link.addEventListener('touchstart', handleLinkInteraction);
      link.addEventListener('mouseleave', handleLinkLeave);
      link.addEventListener('touchend', handleLinkLeave);
      
      // Mark as having listeners
      link.dataset.prefetchEnabled = 'true';
    });
  }
    // Initialize after DOM is fully loaded
  function initialize() {
    // Don't run on slow connections
    if (config.disableOnSlowConnection && isSlowConnection()) {
      console.log('Prefetching disabled due to slow connection');
      return;
    }
    
    // Initial attachment
    attachPrefetchEvents();
    
    // Prefetch visible links
    prefetchVisibleLinks();
    
    // Prefetch priority paths immediately to improve FCP for key pages
    setTimeout(() => {
      config.priorityPaths.forEach(path => {
        const fullUrl = window.location.origin + path;
        if (!config.prefetchedUrls.has(fullUrl)) {          if (config.usePreloadForPriority) {
            // Use prefetch instead of preload for navigation
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = fullUrl;
            // Remove the unsupported 'as' attribute for navigation prefetching
            document.head.appendChild(link);
            config.prefetchedUrls.add(fullUrl);
            console.log('Prefetched priority path:', path);
          } else {
            prefetchUrl(fullUrl);
            console.log('Prefetched priority path:', path);
          }
        }
      });
    }, 500);
    
    // Re-check periodically for new links (e.g., after AJAX)
    setInterval(() => {
      attachPrefetchEvents();
    }, 2000);
    
    // Prefetch next and previous pages if they exist
    setTimeout(() => {
      // Look for pagination links
      const nextLink = document.querySelector('a[rel="next"]');
      if (nextLink && nextLink.href) {
        createLinkPrefetch(nextLink.href);
      }
      
      const prevLink = document.querySelector('a[rel="prev"]');
      if (prevLink && prevLink.href) {
        createLinkPrefetch(prevLink.href);
      }
      
      // Also prefetch main navigation links that are visible
      document.querySelectorAll('nav a, header a').forEach(link => {
        if (link.href && link.href.startsWith(window.location.origin) && isElementVisible(link)) {
          setTimeout(() => prefetchUrl(link.href), 800);
        }
      });
    }, 1000);
  }
  
  // Check if element is visible in the viewport
  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded
    initialize();
  }
})();
