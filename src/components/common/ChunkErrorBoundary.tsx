'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    // Check if it's a chunk load error
    const isChunkError = error.message?.includes('ChunkLoadError') ||
                        error.message?.includes('Loading chunk') ||
                        error.message?.includes('Loading CSS chunk') ||
                        error.message?.includes('Failed to fetch dynamically imported module') ||
                        error.name === 'ChunkLoadError';
    
    console.error('Error caught by ChunkErrorBoundary:', error);
    
    if (isChunkError) {
      console.error('Chunk load error detected, will attempt recovery...');
      
      // Use a timeout to allow the error boundary to render first
      setTimeout(() => {
        // Clear caches more aggressively
        if (typeof window !== 'undefined') {
          // Clear all possible caches
          if ('caches' in window) {
            caches.keys().then(names => {
              console.log('Clearing caches:', names);
              const allCaches = names.map(name => caches.delete(name));
              Promise.all(allCaches)                .then(() => {
                  console.log('All caches cleared, reloading...');
                  // Force hard reload using type assertion
                  (window as any).location.reload();
                })
                .catch(() => {
                  console.log('Cache clearing failed, force reloading...');
                  (window as any).location.reload();
                });
            }).catch(() => {
              console.log('Cache access failed, force reloading...');
              (window as any).location.reload();
            });
          } else {
            console.log('No cache API, force reloading...');
            (window as any).location.reload();
          }
        }
      }, 100);
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Use structured logger
    logger.error(error, {
      componentStack: errorInfo.componentStack,
      source: 'ChunkErrorBoundary',
    });
    
    // Log additional details about chunk errors (development only)
    if (process.env.NODE_ENV === 'development') {
      if (error.message?.includes('ChunkLoadError') || 
          error.message?.includes('Loading chunk')) {
        logger.debug('Chunk load failure details:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }
    }
    
    // Note: Chunk errors are filtered in Sentry config, so we don't send them
  }

  handleRetry = () => {
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        const nextCaches = names.filter(name => 
          name.includes('next') || 
          name.includes('static') || 
          name.includes('webpack')
        );        Promise.all(nextCaches.map(name => caches.delete(name)))
          .then(() => (window as any).location.reload())
          .catch(() => (window as any).location.reload());
      }).catch(() => (window as any).location.reload());
    } else {
      (window as any).location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a chunk error for immediate reload
      const isChunkError = this.state.error?.message?.includes('ChunkLoadError') ||
                          this.state.error?.message?.includes('Loading chunk');
      
      if (isChunkError) {
        // Show minimal loading screen while reloading
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white">Updating application...</p>
            </div>
          </div>
        );
      }

      // For other errors, show fallback or error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              The application encountered an error. This might be due to a recent update.
            </p>
            <button
              onClick={this.handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
