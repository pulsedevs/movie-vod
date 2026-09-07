// src/app/not-found.tsx
import Link from 'next/link'; // Import Link for navigation

// This component defines the UI for your 404 page
export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center p-6">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-lg mb-8">
        Sorry, we couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/" // Link back to the homepage
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-md transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}