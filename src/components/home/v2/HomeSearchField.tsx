'use client';

import { type FormEvent, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import HomeSearchTicker from './HomeSearchTicker';

interface HomeSearchTickerState {
  titles: string[];
  index: number;
  offsetY: number;
  lineHeight: number;
  durationMs: number;
  isAnimating: boolean;
  show: boolean;
  currentTitle: string;
}

interface HomeSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onFocus?: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  onTickerSelect?: (title: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  className?: string;
  variant?: 'default' | 'prominent';
  ticker?: HomeSearchTickerState;
  idlePulse?: boolean;
}

export default function HomeSearchField({
  value,
  onChange,
  placeholder,
  onFocus,
  onSubmit,
  onClear,
  onTickerSelect,
  inputRef,
  autoFocus,
  className = '',
  variant = 'default',
  ticker,
  idlePulse = false,
}: HomeSearchFieldProps) {
  const isProminent = variant === 'prominent';
  const showTicker = Boolean(ticker?.show && value.trim().length === 0);

  return (
    <form onSubmit={onSubmit} className={`relative w-full ${className}`}>
      <div
        className={[
          'relative flex items-center w-full rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl transition-[border-color,box-shadow,ring-color]',
          isProminent
            ? 'border-2 border-[#FFF9F3] bg-[rgba(14,14,16,0.9)] shadow-[0_0_0_1px_rgba(250,247,242,0.22)_inset,0_12px_32px_rgba(0,0,0,0.52),0_0_20px_rgba(250,247,242,0.16)] ring-2 ring-[#FAF7F2]/40 focus-within:border-[#FFF9F3] focus-within:ring-2 focus-within:ring-[#FAF7F2]/50 focus-within:shadow-[0_0_0_1px_rgba(250,247,242,0.28)_inset,0_12px_32px_rgba(0,0,0,0.52),0_0_26px_rgba(250,247,242,0.22)]'
            : 'border border-white/15 bg-[linear-gradient(140deg,rgba(18,18,22,0.9),rgba(10,10,12,0.82))] shadow-[0_12px_32px_rgba(0,0,0,0.5)] focus-within:border-amber-300/35 focus-within:shadow-[0_14px_40px_rgba(0,0,0,0.58)]',
          idlePulse && showTicker
            ? 'animate-[search-idle-glow_3.2s_ease-in-out_infinite]'
            : '',
        ].join(' ')}
      >
        {!isProminent ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(249,115,22,0.14),transparent_46%),radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.14),transparent_48%)]" />
        ) : null}
        <div className="relative z-10 min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={showTicker ? '' : placeholder}
            autoFocus={autoFocus}
            aria-label="Search movies and TV shows"
            className={[
              'w-full py-3 pl-4 pr-2 bg-transparent text-zinc-100 placeholder-zinc-400 focus:outline-none min-w-0 text-sm sm:text-base',
              isProminent ? 'text-[#FFF9F3] caret-[#FAF7F2] placeholder:text-[#FAF7F2]/55' : '',
            ].join(' ')}
          />
          {showTicker && ticker ? (
            <HomeSearchTicker
              titles={ticker.titles}
              index={ticker.index}
              offsetY={ticker.offsetY}
              lineHeight={ticker.lineHeight}
              durationMs={ticker.durationMs}
              isAnimating={ticker.isAnimating}
              isProminent={isProminent}
              onSelect={onTickerSelect}
            />
          ) : null}
        </div>
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className={[
              'relative z-10 pr-2 pl-1 py-3 transition-colors shrink-0',
              isProminent ? 'text-[#FAF7F2]/80 hover:text-[#FFF9F3]' : 'text-zinc-400 hover:text-zinc-100',
            ].join(' ')}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
        <button
          type="submit"
          className={[
            'relative z-10 pr-4 pl-2 py-3 transition-colors shrink-0',
            isProminent ? 'text-[#FAF7F2] hover:text-[#FFF9F3]' : 'text-zinc-300 hover:text-white',
          ].join(' ')}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
