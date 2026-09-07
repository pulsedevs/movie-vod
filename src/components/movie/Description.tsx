"use client";

import { useState } from 'react';

/**
 * Movie/TV synopsis with a "Read More" toggle.
 *
 * SEO-critical: the FULL overview is always present in the DOM and the collapsed state is
 * purely visual (CSS line-clamp). The previous version sliced the string
 * (`overview.substring(0, 75)`), so crawlers only ever received the first 75 characters —
 * the main reason detail pages had almost no indexable text ("Crawled - currently not indexed").
 */
export default function Description({ overview }: { overview: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!overview) return <p className="text-sm text-gray-500">No overview available.</p>;

  // Only offer the toggle when there is genuinely more to reveal than the clamp shows.
  const isTruncatable = overview.length > 180;
  const clamped = isTruncatable && !isExpanded;

  return (
    <div>
      <p
        className={`text-sm text-gray-300 leading-relaxed ${
          clamped ? 'line-clamp-2 sm:line-clamp-3' : ''
        }`}
      >
        {overview}
      </p>
      {isTruncatable && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-blue-500 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse overview' : 'Expand overview'}
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}
