'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Genre } from '@/types';
import { ChevronDown, X, Filter } from 'lucide-react';
import { useFilters } from './FilterContext';

interface FilterPanelProps {
  mediaType: 'movie' | 'tv' | 'anime';
  genres: Genre[];
}

const getSortOptions = (mediaType: 'movie' | 'tv' | 'anime') => [
  { value: 'popularity.desc', label: 'Popularity (High to Low)' },
  { value: 'popularity.asc', label: 'Popularity (Low to High)' },
  { value: 'vote_average.desc', label: 'Rating (High to Low)' },
  { value: 'vote_average.asc', label: 'Rating (Low to High)' },
  {
    value: mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc',
    label: mediaType === 'anime' ? 'Air Date (Newest)' : 'Release Date (Newest)',
  },
  {
    value: mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
    label: mediaType === 'anime' ? 'Air Date (Oldest)' : 'Release Date (Oldest)',
  },
];

const languageOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: 'Japanese (Original)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ru-RU', label: 'Russian' },
];

const getLanguageOptions = (mediaType: 'movie' | 'tv' | 'anime') => {
  if (mediaType === 'anime') {
    return [
      { value: 'en-US', label: 'English (Dubbed)' },
      { value: 'ja-JP', label: 'Japanese (Original)' },
      { value: 'zh-CN', label: 'Chinese (Simplified)' },
      { value: 'ko-KR', label: 'Korean' },
      { value: 'es-ES', label: 'Spanish' },
      { value: 'fr-FR', label: 'French' },
    ];
  }
  return languageOptions;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => ({
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

const voteCountOptions = [
  { value: 'auto', label: 'Smart Filter (Recommended)' },
  { value: '1000', label: '1000+ votes (Very Popular)' },
  { value: '500', label: '500+ votes (Popular)' },
  { value: '100', label: '100+ votes (Well Known)' },
  { value: '50', label: '50+ votes (Some Recognition)' },
  { value: '0', label: 'Any Number of Votes' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({ mediaType, genres }) => {
  const { filters, setFilters, clearFilters } = useFilters();

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [isVoteCountDropdownOpen, setIsVoteCountDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Refs for click outside detection
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const ratingDropdownRef = useRef<HTMLDivElement>(null);
  const voteCountDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setIsGenreDropdownOpen(false);
    setIsYearDropdownOpen(false);
    setIsSortDropdownOpen(false);
    setIsRatingDropdownOpen(false);
    setIsVoteCountDropdownOpen(false);
    setIsLanguageDropdownOpen(false);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        genreDropdownRef.current && !genreDropdownRef.current.contains(target) &&
        yearDropdownRef.current && !yearDropdownRef.current.contains(target) &&
        sortDropdownRef.current && !sortDropdownRef.current.contains(target) &&
        ratingDropdownRef.current && !ratingDropdownRef.current.contains(target) &&
        voteCountDropdownRef.current && !voteCountDropdownRef.current.contains(target) &&
        languageDropdownRef.current && !languageDropdownRef.current.contains(target)
      ) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns when filters change (after selection)
  useEffect(() => {
    closeAllDropdowns();
  }, [filters]);

  const toggleGenre = (genreId: string) => {
    setFilters({
      genres: filters.genres.includes(genreId)
        ? filters.genres.filter((id) => id !== genreId)
        : [...filters.genres, genreId],
    });
  };

  const getSelectedSortLabel = () => {
    const sortOptions = getSortOptions(mediaType);
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

  const getSelectedVoteCountLabel = () => {
    return voteCountOptions.find((option) => option.value === filters.minVoteCount)?.label || 'Smart Filter';
  };

  const getSelectedLanguageLabel = () => {
    const options = getLanguageOptions(mediaType);
    return filters.language 
      ? options.find((option) => option.value === filters.language)?.label || 'Language'
      : 'Language';
  };

  const activeFilterCount = [
    filters.genres.length > 0,
    !!filters.year,
    filters.sortBy !== 'popularity.desc',
    filters.minRating !== '0',
    filters.minVoteCount !== 'auto',
    !!filters.language, // Only count if language is explicitly set
  ].filter(Boolean).length;

  return (
    <div className="mb-6 relative z-40">
      <div className="flex lg:hidden justify-between items-center mb-6">
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="group flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 backdrop-blur-sm border border-blue-400/20 hover:border-blue-400/40 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <Filter size={18} className="group-hover:text-blue-400 transition-colors" />
          <span className="font-semibold">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="group flex items-center gap-2 bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 backdrop-blur-sm border border-red-400/20 hover:border-red-400/40 px-4 py-3 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
          >
            <X size={16} className="group-hover:text-red-400 transition-colors" />
            <span className="font-medium group-hover:text-red-400 transition-colors">Clear</span>
          </button>
        )}
      </div>

      <div className={`${isFilterExpanded ? 'block' : 'hidden'} lg:block bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 relative overflow-visible`}>
        {/* Decorative gradient overlay - clipped to container */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none rounded-2xl overflow-hidden" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-4 flex-grow">
            {/* Genre Filter */}
            <div className="relative" ref={genreDropdownRef}>
              <button
                onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                className="group flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl px-5 py-3 text-sm transition-all duration-300 min-w-fit hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
                  <span className="font-medium">
                    {filters.genres.length > 0
                      ? `Genres (${filters.genres.length})`
                      : 'All Genres'}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-all duration-300 group-hover:text-blue-400 ${
                    isGenreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isGenreDropdownOpen && (
                <div className="absolute z-50 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {genres.map((genre) => (
                      <label key={genre.id} className="group flex items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200">
                        <input
                          type="checkbox"
                          id={`genre-${genre.id}`}
                          checked={filters.genres.includes(genre.id.toString())}
                          onChange={() => toggleGenre(genre.id.toString())}
                          className="w-4 h-4 mr-3 rounded bg-transparent border-2 border-white/30 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
                        />
                        <span className="text-sm group-hover:text-white/90 transition-colors">
                          {genre.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Filter */}
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="group w-full flex items-center justify-between bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl px-5 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" />
                  <span className="font-medium">{getSelectedLanguageLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-all duration-300 group-hover:text-purple-400 ${
                    isLanguageDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isLanguageDropdownOpen && (
                <div className="absolute z-50 mt-2 w-52 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-2">
                    {getLanguageOptions(mediaType).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ language: option.value });
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-all duration-200 ${
                          filters.language === option.value ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Year Filter */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="group w-full flex items-center justify-between bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl px-5 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-teal-500 rounded-full" />
                  <span className="font-medium">{getSelectedYearLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-all duration-300 group-hover:text-green-400 ${
                    isYearDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isYearDropdownOpen && (
                <div className="absolute z-50 mt-2 w-52 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setFilters({ year: undefined });
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-all duration-200 ${
                        !filters.year ? 'bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-400/30' : ''
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
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-all duration-200 ${
                          filters.year === option.value ? 'bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-400/30' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div className="relative" ref={ratingDropdownRef}>
              <button
                onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                className="group w-full flex items-center justify-between bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl px-5 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                  <span className="font-medium">{getSelectedRatingLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-all duration-300 group-hover:text-yellow-400 ${
                    isRatingDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isRatingDropdownOpen && (
                <div className="absolute z-50 mt-2 w-52 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-2">
                    {ratingOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ minRating: option.value });
                          setIsRatingDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-all duration-200 ${
                          filters.minRating === option.value ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vote Count Filter */}
            <div className="relative" ref={voteCountDropdownRef}>
              <button
                onClick={() => setIsVoteCountDropdownOpen(!isVoteCountDropdownOpen)}
                className="group w-full flex items-center justify-between bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl px-5 py-3 text-sm transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full" />
                  <span className="font-medium">{getSelectedVoteCountLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-all duration-300 group-hover:text-pink-400 ${
                    isVoteCountDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isVoteCountDropdownOpen && (
                <div className="absolute z-50 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-2">
                    {voteCountOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ minVoteCount: option.value });
                          setIsVoteCountDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-all duration-200 ${
                          filters.minVoteCount === option.value ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-400/30' : ''
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

          {/* Sort and Clear Section */}
          <div className="flex gap-4 items-start">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="group flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 backdrop-blur-sm border border-blue-400/20 hover:border-blue-400/40 rounded-xl px-5 py-3 text-sm min-w-[200px] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
                  <span className="font-medium">{getSelectedSortLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-all duration-300 group-hover:text-blue-400 ${
                    isSortDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-2">
                    {getSortOptions(mediaType).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ sortBy: option.value });
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl hover:bg-white/10 transition-all duration-200 ${
                          filters.sortBy === option.value ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear All Button */}
            <div className="hidden lg:block">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="group flex items-center gap-2 bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 backdrop-blur-sm border border-red-400/20 hover:border-red-400/40 px-4 py-3 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                >
                  <X size={16} className="group-hover:text-red-400 transition-colors" />
                  <span className="font-medium group-hover:text-red-400 transition-colors">Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Genre Tags */}
        {filters.genres.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex flex-wrap gap-3">
              {filters.genres.map((genreId) => {
                const genre = genres.find((g) => g.id.toString() === genreId);
                return (
                  <div
                    key={genreId}
                    className="group flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 px-4 py-2 rounded-full text-sm transition-all duration-300 hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <span className="font-medium text-blue-100">{genre?.name || genreId}</span>
                    <button
                      onClick={() => toggleGenre(genreId)}
                      className="ml-2 p-1 hover:bg-white/20 rounded-full transition-all duration-200 group-hover:scale-110"
                      aria-label={`Remove ${genre?.name || genreId} filter`}
                    >
                      <X size={14} className="text-blue-200 hover:text-white transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;