import React, { Component, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log using structured logger
    logger.error(error, {
      componentStack: errorInfo.componentStack,
      source: 'ErrorBoundary',
    });
    
    // Send to Sentry (chunk errors are filtered in Sentry config)
    if (!error.message?.includes('ChunkLoadError')) {
      // Use setTimeout to make this truly async and avoid build-time bundling
      setTimeout(() => {
        try {
          const sentryModule = typeof window !== 'undefined' ? (window as any).__SENTRY_MODULE__ : null;
          if (sentryModule) {
            sentryModule.captureException(error, {
              contexts: {
                react: {
                  componentStack: errorInfo.componentStack,
                },
              },
              tags: {
                errorBoundary: 'component',
              },
            });
          }
          // Sentry package removed - dynamic import disabled
        } catch (e) {
          // Sentry not available
        }
      }, 0);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;