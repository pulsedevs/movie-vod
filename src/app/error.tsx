// src/app/error.tsx
'use client'; // <--- Make this the VERY FIRST line

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

// error.tsx components receive these props
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }; // The error that occurred
  reset: () => void; // Function to attempt to re-render the component tree
}) {  
  useEffect(() => {
    // Log the error using structured logger
    logger.error(error, { digest: error.digest, source: 'error.tsx' });
    
    // Send to Sentry (chunk errors are filtered in Sentry config)
    if (error.message && !error.message.includes('ChunkLoadError')) {
      // Use setTimeout to make this truly async and avoid build-time bundling
      setTimeout(() => {
        try {
          // Check if Sentry module is available on window (set by sentry.client.config.ts if installed)
          const sentryModule = typeof window !== 'undefined' ? (window as any).__SENTRY_MODULE__ : null;
          if (sentryModule) {
            sentryModule.captureException(error, {
              tags: {
                errorBoundary: 'root',
              },
              extra: {
                digest: error.digest,
              },
            });
          }
          // Sentry package removed - dynamic import disabled
        } catch (e) {
          // Sentry not available
        }
      }, 0);
    }
    
    // Special handling for ChunkLoadError
    if (error.message && error.message.includes('ChunkLoadError')) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('ChunkLoadError detected in error boundary, reloading page...');
      }
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">
        Oops! Something went wrong.
      </h2>
      <p className="mb-4">
        We encountered an error processing this part of the application.
      </p>
      {/* Button to try reloading the component segment */}
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}