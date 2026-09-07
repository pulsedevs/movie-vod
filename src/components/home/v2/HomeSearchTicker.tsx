'use client';

interface HomeSearchTickerProps {
  titles: string[];
  index: number;
  offsetY: number;
  lineHeight: number;
  durationMs: number;
  isAnimating: boolean;
  isProminent?: boolean;
  onSelect?: (title: string) => void;
}

export default function HomeSearchTicker({
  titles,
  index,
  offsetY,
  lineHeight,
  durationMs,
  isAnimating,
  isProminent = false,
  onSelect,
}: HomeSearchTickerProps) {
  const current = titles[index] ?? '';
  const next = titles[(index + 1) % titles.length] ?? '';
  const labelClass = isProminent ? 'text-[#FAF7F2]/50' : 'text-zinc-500';
  const titleClass = isProminent ? 'text-[#FAF7F2]/68' : 'text-zinc-400';
  const cursorClass = isProminent ? 'text-[#FAF7F2]/85' : 'text-zinc-400/80';

  return (
    <div
      className="absolute inset-0 z-[5] flex items-center pl-4 pr-2 pointer-events-none"
      aria-hidden
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className={`shrink-0 text-sm ${labelClass}`}>Trending</span>
        <span className={`shrink-0 text-sm font-light animate-pulse ${cursorClass}`}>|</span>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onSelect?.(current)}
          className={`min-w-0 flex-1 overflow-hidden text-left pointer-events-auto transition-colors hover:opacity-90 ${titleClass}`}
          aria-label={`Search for ${current}`}
        >
          <div className="overflow-hidden" style={{ height: lineHeight }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                transition: isAnimating ? `transform ${durationMs}ms ease-out` : 'none',
              }}
            >
              <div
                className="truncate text-sm sm:text-base leading-6"
                style={{ height: lineHeight }}
              >
                {current}
              </div>
              <div
                className="truncate text-sm sm:text-base leading-6"
                style={{ height: lineHeight }}
              >
                {next}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
