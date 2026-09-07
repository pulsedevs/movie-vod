'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Check } from 'lucide-react';
import { Genre } from '@/types';
import { useFilters } from '@/components/browse/FilterContext';
import { navThemes, type NavTheme } from '../navThemes';
import type { BrowseMediaType } from '@/lib/browse/loadBrowsePage';

const sortOptions = {
  movie: [
    { value: 'popularity.desc', label: 'Popular' },
    { value: 'vote_average.desc', label: 'Top rated' },
    { value: 'primary_release_date.desc', label: 'Newest' },
    { value: 'primary_release_date.asc', label: 'Oldest' },
  ],
  tv: [
    { value: 'popularity.desc', label: 'Popular' },
    { value: 'vote_average.desc', label: 'Top rated' },
    { value: 'first_air_date.desc', label: 'Newest' },
    { value: 'first_air_date.asc', label: 'Oldest' },
  ],
  anime: [
    { value: 'popularity.desc', label: 'Popular' },
    { value: 'vote_average.desc', label: 'Top rated' },
    { value: 'first_air_date.desc', label: 'Newest' },
    { value: 'first_air_date.asc', label: 'Oldest' },
  ],
} as const;

const ratingOptions = [
  { value: '0', label: 'Any' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
  { value: '5', label: '5+' },
];

const voteCountOptions = [
  { value: '1000', label: '1k+' },
  { value: '500', label: '500+' },
  { value: '100', label: '100+' },
  { value: '50', label: '50+' },
  { value: '0', label: 'Any' },
];

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: '', label: 'All' },
  ...Array.from({ length: currentYear - 1900 + 1 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];

interface BrowseV2FilterBarProps {
  mediaType: BrowseMediaType;
  genres: Genre[];
}

type DropdownId = 'genres' | 'sort' | 'year' | 'rating' | 'votes' | null;

function FilterDropdown({
  id,
  openId,
  onOpenChange,
  ariaLabel,
  triggerLabel,
  value,
  values,
  onChange,
  onMultiChange,
  options,
  theme,
  highlighted = false,
  layout = 'list',
  scrollable = false,
  multiSelect = false,
  scrollHeight,
  panelMinWidth,
  panelAlign = 'left',
}: {
  id: DropdownId;
  openId: DropdownId;
  onOpenChange: (id: DropdownId) => void;
  ariaLabel: string;
  triggerLabel?: string;
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onMultiChange?: (values: string[]) => void;
  options: { value: string; label: string }[];
  theme: NavTheme;
  highlighted?: boolean;
  layout?: 'list' | 'grid';
  scrollable?: boolean;
  multiSelect?: boolean;
  /** Fixed height for the scrollable content area (e.g. 'h-40') — forces a constant panel height */
  scrollHeight?: string;
  /** Wider menu than the trigger — use for grid panels */
  panelMinWidth?: string;
  panelAlign?: 'left' | 'right';
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOpen = openId === id;
  const [panelPos, setPanelPos] = useState<{ top: number; left?: number; right?: number } | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos(
        panelAlign === 'right'
          ? { top: rect.bottom + 6, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 6, left: rect.left }
      );
    }
    if (!isOpen) setPanelPos(null);
  }, [isOpen, panelAlign]);


  const selectedLabel =
    triggerLabel ??
    (value !== undefined && value !== ''
      ? options.find((opt) => opt.value === value)?.label
      : undefined) ??
    ariaLabel;

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const handleSelect = (optValue: string) => {
    if (multiSelect && onMultiChange && values) {
      if (optValue === '') {
        onMultiChange([]);
        return;
      }
      onMultiChange(
        values.includes(optValue)
          ? values.filter((v) => v !== optValue)
          : [...values, optValue]
      );
      return;
    }
    onChange?.(optValue);
    onOpenChange(null);
  };

  const isOptionSelected = (optValue: string) => {
    if (multiSelect && values) {
      if (optValue === '') return values.length === 0;
      return values.includes(optValue);
    }
    if (value === undefined || value === '') return false;
    return optValue === value;
  };

  const widePanel = layout === 'grid' || !!panelMinWidth;
  const panelWidthClass = widePanel
    ? `${panelMinWidth ?? 'min-w-[14rem]'} w-max max-w-[min(100vw-1.5rem,22rem)]`
    : 'left-0 right-0 w-full';

  return (
    <div className="relative shrink-0 w-[4.5rem] sm:w-auto sm:min-w-0 sm:shrink">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onOpenChange(isOpen ? null : id)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={[
          'w-full flex items-center justify-between gap-1 sm:gap-2 rounded-lg sm:rounded-xl border px-2 py-1.5 sm:px-3 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium transition-all duration-200',
          isOpen
            ? 'border-white/25 bg-white/[0.08] shadow-lg shadow-black/30'
            : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
        ].join(' ')}
        style={
          highlighted
            ? {
                borderColor: `${theme.icon}66`,
                backgroundColor: theme.bgActive,
                color: theme.label,
              }
            : { color: 'rgba(255,255,255,0.88)' }
        }
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`shrink-0 w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: highlighted ? theme.iconActive : 'rgba(255,255,255,0.45)' }}
        />
      </button>

      {isOpen && panelPos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => onOpenChange(null)} />
          <div
            className={`fixed z-[9999] overflow-hidden rounded-xl border border-white/[0.12] bg-[#101010]/98 backdrop-blur-xl shadow-2xl shadow-black/60 ${panelWidthClass}`}
            style={panelPos}
            role="listbox"
          >
            <div
              className={[
                'p-1.5',
                scrollable ? `${scrollHeight ?? 'max-h-44'} overflow-y-auto overscroll-contain scrollbar-hide` : '',
              ].join(' ')}
            >
              {layout === 'grid' ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {options.map((opt) => {
                    const isSelected = isOptionSelected(opt.value);
                    return (
                      <button
                        key={opt.value || 'all'}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          'relative flex min-h-[1.75rem] items-center justify-center rounded-md border px-1.5 py-1 text-[10px] font-medium text-center leading-snug transition-colors',
                          isSelected
                            ? 'border-transparent'
                            : 'border-white/[0.08] bg-white/[0.03] text-white/75 hover:bg-white/[0.07] hover:text-white',
                        ].join(' ')}
                        style={
                          isSelected
                            ? { backgroundColor: theme.bgActive, color: theme.label, borderColor: `${theme.icon}44` }
                            : undefined
                        }
                      >
                        <span className="line-clamp-2">{opt.label}</span>
                        {isSelected && multiSelect && (
                          <Check className="absolute right-0.5 top-0.5 h-2.5 w-2.5" style={{ color: theme.iconActive }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ul className="py-0.5">
                  {options.map((opt) => {
                    const isSelected = isOptionSelected(opt.value);
                    return (
                      <li key={opt.value || 'all'}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(opt.value)}
                          className={[
                            'w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[10px] text-left transition-colors rounded-md',
                            isSelected ? '' : 'text-white/75 hover:bg-white/[0.06] hover:text-white',
                          ].join(' ')}
                          style={isSelected ? { backgroundColor: theme.bgActive, color: theme.label } : undefined}
                        >
                          <span className="truncate">{opt.label}</span>
                          {isSelected && (
                            <Check className="w-3 h-3 shrink-0" style={{ color: theme.iconActive }} />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function votesTriggerLabel(minVoteCount?: string): string {
  if (!minVoteCount || minVoteCount === 'auto') return 'Votes';
  return voteCountOptions.find((o) => o.value === minVoteCount)?.label ?? 'Votes';
}

function genreTriggerLabel(genres: Genre[], selectedIds: string[]): string {
  if (selectedIds.length === 0) return 'Genre';
  if (selectedIds.length === 1) {
    const match = genres.find((g) => g.id.toString() === selectedIds[0]);
    return match?.name ?? '1 genre';
  }
  return `${selectedIds.length} genres`;
}

export default function BrowseV2FilterBar({ mediaType, genres }: BrowseV2FilterBarProps) {
  const { filters, setFilters, clearFilters } = useFilters();
  const theme = navThemes[mediaType === 'movie' ? 'movies' : mediaType === 'tv' ? 'tv' : 'anime'];
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);

  const genreOptions = [
    { value: '', label: 'All' },
    ...genres.map((g) => ({ value: g.id.toString(), label: g.name })),
  ];

  const activeCount = [
    filters.genres.length > 0,
    !!filters.year,
    filters.sortBy !== 'popularity.desc' && !!filters.sortBy,
    filters.minRating !== '0' && !!filters.minRating,
    filters.minVoteCount !== 'auto' && !!filters.minVoteCount,
  ].filter(Boolean).length;

  return (
    <div className="mb-4 w-full min-w-0">
      {/* Mobile: flat chip row (no card wrapper). Desktop: card with bg/border */}
      <div className="w-full min-w-0 sm:rounded-2xl sm:border sm:border-white/[0.08] sm:bg-white/[0.02] sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Scrollable pill row on mobile, grid on sm+ */}
          <div className="flex-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 sm:grid sm:grid-cols-5 sm:gap-2.5 sm:overflow-visible sm:pb-0">
            <FilterDropdown
              id="votes"
              openId={openDropdown}
              onOpenChange={setOpenDropdown}
              ariaLabel="Votes"
              triggerLabel={votesTriggerLabel(filters.minVoteCount)}
              value={
                filters.minVoteCount && filters.minVoteCount !== 'auto'
                  ? filters.minVoteCount
                  : ''
              }
              onChange={(minVoteCount) => setFilters({ minVoteCount: minVoteCount || 'auto' })}
              options={voteCountOptions}
              theme={theme}
              highlighted={!!filters.minVoteCount && filters.minVoteCount !== 'auto'}
              layout="grid"
              panelMinWidth="min-w-[10rem]"
            />
            <FilterDropdown
              id="rating"
              openId={openDropdown}
              onOpenChange={setOpenDropdown}
              ariaLabel="Rating"
              triggerLabel={!filters.minRating || filters.minRating === '0' ? 'Rating' : undefined}
              value={filters.minRating || '0'}
              onChange={(minRating) => setFilters({ minRating })}
              options={ratingOptions}
              theme={theme}
              highlighted={!!filters.minRating && filters.minRating !== '0'}
              layout="grid"
              panelMinWidth="min-w-[10rem]"
            />
            <FilterDropdown
              id="year"
              openId={openDropdown}
              onOpenChange={setOpenDropdown}
              ariaLabel="Year"
              value={filters.year || ''}
              onChange={(year) => setFilters({ year: year || undefined })}
              options={yearOptions}
              theme={theme}
              highlighted={!!filters.year}
              layout="grid"
              scrollable
              scrollHeight="h-40"
              panelMinWidth="min-w-[12rem]"
            />
            <FilterDropdown
              id="sort"
              openId={openDropdown}
              onOpenChange={setOpenDropdown}
              ariaLabel="Sort"
              value={filters.sortBy || 'popularity.desc'}
              onChange={(sortBy) => setFilters({ sortBy })}
              options={[...sortOptions[mediaType]]}
              theme={theme}
              highlighted={!!filters.sortBy && filters.sortBy !== 'popularity.desc'}
              layout="grid"
              panelMinWidth="min-w-[12rem]"
            />
            <FilterDropdown
              id="genres"
              openId={openDropdown}
              onOpenChange={setOpenDropdown}
              ariaLabel="Genre"
              triggerLabel={genreTriggerLabel(genres, filters.genres)}
              values={filters.genres}
              onMultiChange={(genres) => setFilters({ genres })}
              options={genreOptions}
              theme={theme}
              highlighted={filters.genres.length > 0}
              layout="grid"
              scrollable
              multiSelect
              panelMinWidth="min-w-[15rem]"
              panelAlign="right"
            />
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium border transition-colors"
              style={{ color: theme.label, backgroundColor: theme.bgRest, borderColor: `${theme.icon}33` }}
              aria-label="Clear filters"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
