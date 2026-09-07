'use client';

import React, { useState } from 'react';
import { Genre } from '@/types';
import { ChevronDown, X, Filter } from 'lucide-react';
import { useFilters } from './FilterContext';

interface ClientFilterPanelProps {
  mediaType: 'movie' | 'tv';
  genres: Genre[];
}

const getSortOptions = (mediaType: 'movie' | 'tv') => [
  { value: 'popularity.desc', label: 'Popularity (High to Low)' },
  { value: 'popularity.asc', label: 'Popularity (Low to High)' },
  { value: 'vote_average.desc', label: 'Rating (High to Low)' },
  { value: 'vote_average.asc', label: 'Rating (Low to High)' },
  {
    value: mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc',
    label: 'Release Date (Newest)',
  },
  {
    value: mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
    label: 'Release Date (Oldest)',
  },
];

const languageOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ru-RU', label: 'Russian' },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => ({
  value: (currentYear - i).toString(),
  label: (currentYear - i).toString(),
}));

const ratingOptions = [
  { value: '8', label: '8+ (Excellent)' },
  { value: '7', label: '7+ (Good)' },
  { value: '6', label: '6+ (Fair)' },
  { value: '5', label: '5+ (Average)' },
  { value: '0', label: 'Show All' },
];

const ClientFilterPanel: React.FC<ClientFilterPanelProps> = ({ mediaType, genres }) => {
  const { filters, setFilters, clearFilters } = useFilters();
  const sortOptions = getSortOptions(mediaType);

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const toggleGenre = (genreId: string) => {
    setFilters({
      genres: filters.genres.includes(genreId)
        ? filters.genres.filter((id) => id !== genreId)
        : [...filters.genres, genreId],
    });
  };

  const getSelectedSortLabel = () => {
    return sortOptions.find((option) => option.value === filters.sortBy)?.label || 'Sort By';
  };

  const getSelectedYearLabel = () => {
    return filters.year ? `Year: ${filters.year}` : 'All Years';
  };

  const getSelectedRatingLabel = () => {
    return filters.minRating !== '0'
      ? ratingOptions.find((option) => option.value === filters.minRating)?.label
      : 'Any Rating';
  };

  const getSelectedLanguageLabel = () => {
    return languageOptions.find((option) => option.value === filters.language)?.label || 'English';
  };

  const activeFilterCount = [
    filters.genres.length > 0,
    !!filters.year,
    filters.sortBy !== 'popularity.desc',
    filters.minRating !== '0',
    !!filters.language, // Only count if language is explicitly set
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      <div className="flex lg:hidden justify-between items-center mb-4">
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Filter size={18} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 bg-red-900/50 hover:bg-red-900 px-3 py-2 rounded-lg text-sm transition"
          >
            <X size={16} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className={`${isFilterExpanded ? 'block' : 'hidden'} lg:block bg-gray-800 rounded-lg p-4 shadow-md`}>
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-3 flex-grow">
            <div className="relative md:w-64">
              <button
                onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 text-sm transition"
              >
                <span>
                  {filters.genres.length > 0
                    ? `Genres (${filters.genres.length})`
                    : 'All Genres'}
                </span>
                <ChevronDown
                  size={16}
                  className={`transform transition ${
                    isGenreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isGenreDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {genres.map((genre) => (
                      <div key={genre.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`genre-${genre.id}`}
                          checked={filters.genres.includes(genre.id.toString())}
                          onChange={() => toggleGenre(genre.id.toString())}
                          className="w-4 h-4 mr-2 rounded bg-gray-700 border-gray-600 accent-blue-500"
                        />
                        <label
                          htmlFor={`genre-${genre.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {genre.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 text-sm transition"
              >
                <span>{getSelectedLanguageLabel()}</span>
                <ChevronDown
                  size={16}
                  className={`transform transition ${
                    isLanguageDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isLanguageDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-1">
                    {languageOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ language: option.value });
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-600 transition ${
                          filters.language === option.value ? 'bg-blue-600' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 text-sm transition"
              >
                <span>{getSelectedYearLabel()}</span>
                <ChevronDown
                  size={16}
                  className={`transform transition ${
                    isYearDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isYearDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setFilters({ year: undefined });
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-600 transition ${
                        !filters.year ? 'bg-blue-600' : ''
                      }`}
                    >
                      All Years
                    </button>
                    {yearOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ year: option.value });
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-600 transition ${
                          filters.year === option.value ? 'bg-blue-600' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 text-sm transition"
              >
                <span>{getSelectedRatingLabel()}</span>
                <ChevronDown
                  size={16}
                  className={`transform transition ${
                    isRatingDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isRatingDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
                  <div className="p-1">
                    {ratingOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ minRating: option.value });
                          setIsRatingDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-600 transition ${
                          filters.minRating === option.value ? 'bg-blue-600' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 text-sm min-w-[180px] transition"
              >
                <span>{getSelectedSortLabel()}</span>
                <ChevronDown
                  size={16}
                  className={`transform transition ${
                    isSortDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 z-10 mt-1 w-64 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
                  <div className="p-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ sortBy: option.value });
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-600 transition ${
                          filters.sortBy === option.value ? 'bg-blue-600' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 bg-red-900/50 hover:bg-red-900 px-3 py-2 rounded-lg text-sm transition"
                >
                  <X size={16} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {filters.genres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.genres.map((genreId) => {
              const genre = genres.find((g) => g.id.toString() === genreId);
              return (
                <div
                  key={genreId}
                  className="flex items-center bg-blue-600/30 px-3 py-1 rounded-full text-xs"
                >
                  <span>{genre?.name || genreId}</span>
                  <button
                    onClick={() => toggleGenre(genreId)}
                    className="ml-1 p-0.5 hover:bg-blue-700 rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientFilterPanel;