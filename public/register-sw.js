// Enhanced service worker registration for improved performance
(function() {
  // Only register in browser environment
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  
  // Configuration
  const config = {
    // Path to service worker
    swPath: '/sw.js',
    // Log debug info
    debug: false,
    // Time to wait before registration (ms)
    registrationDelay: 1000,
    // Should we reload the page on new SW installation?
    reloadOnUpdate: false
  };
  
  // Logger function
  const log = (...args) => {
    if (config.debug) {
      console.log('[ServiceWorker]', ...args);
    }
  };
  
  // Unregister all old service workers first (to remove ad network code)
  const unregisterOldServiceWorkers = async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        log('Unregistered old service worker:', registration.scope);
      }
    } catch (error) {
      console.error('Error unregistering old service workers:', error);
    }
  };

  // Register the service worker
  const registerServiceWorker = async () => {
    if (navigator.onLine === false) {
      // Defer registration until online
      log('Device is offline, deferring service worker registration');
      window.addEventListener('online', registerServiceWorker);
      return;
    }
    
    // First, unregister all old service workers to remove ad network code
    await unregisterOldServiceWorkers();
    
    log('Registering service worker...');
    
    navigator.serviceWorker.register(config.swPath, { scope: '/' })
      .then(registration => {
        log('Registration successful, scope:', registration.scope);
        
        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker available
                log('New service worker installed');
                
                // Show update notification to user
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('App Updated', {
                    body: 'New content is available. Reload to see the latest version.'
                  });
                }
                
                // Reload the page if configured to do so
                if (config.reloadOnUpdate) {
                  window.location.reload();
                }
              } else {
                // Service Worker installed for the first time
                log('Service Worker installed for the first time');
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  };
  
  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      log('Cache updated:', event.data.url);
    }
  });
  
  // Register after page load completes and the browser is idle
  if ('requestIdleCallback' in window) {
    window.addEventListener('load', () => {
      window.requestIdleCallback(() => {
        setTimeout(registerServiceWorker, config.registrationDelay);
      }, { timeout: 5000 });
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    window.addEventListener('load', () => {
      setTimeout(registerServiceWorker, config.registrationDelay + 500);
    });
  }
})();
