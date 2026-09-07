'use client';

import React from 'react';

interface PageSizeSelectorProps {
  currentPageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  totalResults: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 40, 60, 100];

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  currentPageSize,
  onPageSizeChange,
  totalResults,
}) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span>Show:</span>
      <select
        value={currentPageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span>per page</span>
      <span className="text-gray-500">
        ({totalResults.toLocaleString()} total results)
      </span>
    </div>
  );
};

export default PageSizeSelector;
