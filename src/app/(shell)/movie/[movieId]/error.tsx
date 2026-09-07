'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Movie page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-500 mb-4">⚠️</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Movie Temporarily Unavailable
          </h2>
          <p className="text-gray-300 mb-6">
            We're having trouble loading this movie right now. This could be due to:
          </p>
          <ul className="text-gray-400 text-sm mb-6 list-disc list-inside space-y-1">
            <li>Temporary server issues</li>
            <li>Network connectivity problems</li>
            <li>Database maintenance</li>
          </ul>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Try Again
          </button>
          
          <Link
            href="/browse/movies"
            className="block w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
          >
            Browse Movies
          </Link>
          
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-transparent hover:bg-gray-800 text-gray-300 font-medium rounded-md border border-gray-600 transition-colors"
          >
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-gray-400 cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-3 bg-gray-800 rounded text-xs text-gray-300 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}