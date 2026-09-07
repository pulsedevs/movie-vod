'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage: initialServerPage,
  totalPages,
  siblingCount = 1,
}) => {
  // State to track current page (client-side)
  const [currentPage, setCurrentPage] = useState(initialServerPage);
  // Track if this is client-side rendered
  const [isClient, setIsClient] = useState(false);

  // Initialize on mount - check for hash in URL
  useEffect(() => {
    setIsClient(true);

    // Check if there's a page in the hash (e.g., #page=2)
    const hash = window.location.hash;
    const hashPageMatch = hash.match(/#page=(\d+)/);

    if (hashPageMatch && hashPageMatch[1]) {
      const hashPage = parseInt(hashPageMatch[1], 10);
      if (hashPage >= 1 && hashPage <= totalPages && hashPage !== currentPage) {
        setCurrentPage(hashPage);
      }
    } else if (initialServerPage !== currentPage) {
      // If no hash but server page is different, update state
      setCurrentPage(initialServerPage);
    }
  }, [initialServerPage, totalPages, currentPage]);

  // Navigate to a specific page
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) {
        return; // Don't navigate if invalid page or same page
      }

      // Update client-side state
      setCurrentPage(page);

      // Set the hash fragment in the URL without triggering navigation
      window.location.hash = `page=${page}`;

      // Scroll to top
      window.scrollTo(0, 0);

      // Optionally, trigger data refetch here if needed
    },
    [currentPage, totalPages]
  );

  // Don't render pagination if there's only one page or on server
  if (totalPages <= 1) {
    return null;
  }

  // Generate the page numbers to display (with ellipsis)
  const generatePagination = () => {
    // Initialize array with first page
    const pagination: (number | string)[] = [1];

    // Calculate range of visible page numbers
    const leftSibling = Math.max(2, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);

    // Add left ellipsis if needed
    if (leftSibling > 2) {
      pagination.push('...');
    }

    // Add page numbers between ellipses
    for (let i = leftSibling; i <= rightSibling; i++) {
      pagination.push(i);
    }

    // Add right ellipsis if needed
    if (rightSibling < totalPages - 1) {
      pagination.push('...');
    }

    // Add last page if not already included
    if (totalPages > 1) {
      pagination.push(totalPages);
    }

    return pagination;
  };

  const pages = generatePagination();

  // When rendering on client, use the client state for the current page
  const displayPage = isClient ? currentPage : initialServerPage;

  return (
    <div className="flex justify-center my-8">
      <div className="flex items-center space-x-1">
        {/* First page button */}
        <button
          onClick={() => goToPage(1)}
          disabled={displayPage === 1}
          className={`p-2 rounded-full ${
            displayPage === 1
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-white hover:bg-gray-700'
          }`}
          aria-label="Go to first page"
        >
          <ChevronsLeft size={18} />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => goToPage(displayPage - 1)}
          disabled={displayPage === 1}
          className={`p-2 rounded-full ${
            displayPage === 1
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-white hover:bg-gray-700'
          }`}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page numbers */}
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                …
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <button
              key={`page-${page}`}
              onClick={() => goToPage(pageNum)}
              className={`px-3 py-1 rounded-md ${
                displayPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'text-white hover:bg-gray-700'
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={displayPage === pageNum ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          onClick={() => goToPage(displayPage + 1)}
          disabled={displayPage === totalPages}
          className={`p-2 rounded-full ${
            displayPage === totalPages
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-white hover:bg-gray-700'
          }`}
          aria-label="Go to next page"
        >
          <ChevronRight size={18} />
        </button>

        {/* Last page button */}
        <button
          onClick={() => goToPage(totalPages)}
          disabled={displayPage === totalPages}
          className={`p-2 rounded-full ${
            displayPage === totalPages
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-white hover:bg-gray-700'
          }`}
          aria-label="Go to last page"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;