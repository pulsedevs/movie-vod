// Image loading optimization script for improving LCP
(function() {
  // Skip if not browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  // Configuration
  const config = {
    // TMDB image base URL
    tmdbBaseUrl: 'https://image.tmdb.org/t/p/',
    // Common selectors for potential LCP images
    lcpImageSelectors: [
      '.movie-poster img',
      '.hero-image',
      '.banner-image',
      '.poster-image',
      'img[data-priority="true"]',
      '.movie-banner img',
      '.optimized-image[data-image-type="poster"]',
      '.optimized-image[data-image-type="backdrop"]'
    ],
    // Debug mode
    debug: false
  };
  
  // Logger
  const log = (...args) => {
    if (config.debug) {
      console.log('[ImageOptimizer]', ...args);
    }
  };
  
  // Find and optimize potential LCP images
  const optimizeLCPImages = () => {
    // Find all potential LCP images
    let lcpCandidates = [];
    
    config.lcpImageSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          lcpCandidates = [...lcpCandidates, ...Array.from(elements)];
        }
      } catch (e) {
        console.error('Error selecting LCP candidates:', e);
      }
    });
    
    if (lcpCandidates.length === 0) {
      log('No LCP image candidates found');
      return;
    }
    
    log(`Found ${lcpCandidates.length} LCP image candidates`);
    
    // Sort by visibility and size (largest visible images first)
    const visibleLCPCandidates = lcpCandidates
      .filter(el => isInViewport(el))
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return (bRect.width * bRect.height) - (aRect.width * aRect.height);
      });
    
    if (visibleLCPCandidates.length === 0) {
      log('No visible LCP candidates found');
      return;
    }
    
    // Take the top 3 candidates (most likely to be LCP)
    const topCandidates = visibleLCPCandidates.slice(0, 3);
    
    // Optimize each candidate
    topCandidates.forEach((img, index) => {
      // Skip if already optimized
      if (img.dataset.lcpOptimized === 'true') {
        return;
      }
      
      // Mark as optimized to avoid double processing
      img.dataset.lcpOptimized = 'true';
      
      // For TMDB images, ensure they're loaded with the optimal path
      const imgSrc = img.src || img.dataset.src;
      if (imgSrc && imgSrc.includes('image.tmdb.org')) {
        optimizeTMDBImage(img, imgSrc, index === 0);
      } else {
        // For other images, set loading priority
        if (index === 0) {
          img.setAttribute('fetchpriority', 'high');
          img.setAttribute('loading', 'eager');
          img.setAttribute('decoding', 'sync');
        }
      }
      
      log(`Optimized LCP candidate ${index + 1}: ${img.tagName} ${imgSrc}`);
    });
  };
  
  // Optimize TMDB image URLs for better loading
  const optimizeTMDBImage = (img, currentSrc, isTopCandidate) => {
    // If it's a poster or backdrop, adjust the size
    const isBackdrop = currentSrc.includes('/w1280/') || 
                      currentSrc.includes('/original/') || 
                      img.classList.contains('backdrop-image') ||
                      img.dataset.imageType === 'backdrop';
    
    const isPoster = currentSrc.includes('/w342/') || 
                    currentSrc.includes('/w500/') || 
                    img.classList.contains('poster-image') ||
                    img.dataset.imageType === 'poster';
    
    if (isTopCandidate) {
      // For the most likely LCP candidate, use high quality
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('loading', 'eager');
      img.setAttribute('decoding', 'sync');
      
      // Preload the image
      preloadImage(currentSrc);
      
      // Add a class for visual debugging
      img.classList.add('lcp-candidate');
    } else {
      // For other candidates, still prioritize but not as high
      img.setAttribute('loading', 'eager');
    }
  };
  
  // Preload an image
  const preloadImage = (src) => {
    if (!src) return;
    
    // Create a preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    // Add to document head
    document.head.appendChild(link);
    
    log(`Preloaded image: ${src}`);
  };
  
  // Check if element is in viewport
  const isInViewport = (el) => {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= -rect.height &&
      rect.left >= -rect.width &&
      rect.bottom <= (window.innerHeight + rect.height) &&
      rect.right <= (window.innerWidth + rect.width)
    );
  };
  
  // Initialize optimization
  const initialize = () => {
    // Run immediately for fastest effect
    optimizeLCPImages();
    
    // Also run after a small delay to catch dynamically loaded images
    setTimeout(optimizeLCPImages, 200);
    
    // Run again after a longer delay for any lazy-loaded content
    setTimeout(optimizeLCPImages, 1000);
    
    // Monitor LCP with PerformanceObserver if available
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry && lastEntry.element) {
            log(`Actual LCP element: ${lastEntry.element.tagName}, time: ${lastEntry.startTime}ms`);
            
            // Add class to actual LCP element for debugging
            lastEntry.element.classList.add('actual-lcp-element');
          }
        });
        
        lcpObserver.observe({type: 'largest-contentful-paint', buffered: true});
      } catch (e) {
        console.error('LCP observation error:', e);
      }
    }
  };
  
  // Add a small CSS snippet for debugging
  const addDebugStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .lcp-candidate {
        outline: 2px solid rgba(0, 128, 255, 0.5) !important;
      }
      .actual-lcp-element {
        outline: 3px solid rgba(255, 87, 51, 0.8) !important;
      }
    `;
    document.head.appendChild(style);
  };
  
  // Run once DOM is interactive for fastest effect
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded, run immediately
    initialize();
  }
  
  // Add debug styles if in development
  if (window.location.hostname === 'localhost' || config.debug) {
    addDebugStyles();
  }
})();
