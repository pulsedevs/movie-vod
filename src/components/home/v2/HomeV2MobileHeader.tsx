'use client';

import { usePathname } from 'next/navigation';
import HeaderAdToggle from '@/components/ads/HeaderAdToggle';
import HomeHeroLogo from '@/components/home/v2/HomeHeroLogo';
import { isDetailShellPath } from '@/utils/v2Transitions';

export default function HomeV2MobileHeader() {
  const pathname = usePathname() ?? '';

  if (isDetailShellPath(pathname)) return null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-2.5 pt-2 pb-1.5">
      <header className="rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.16] shadow-[0_4px_24px_rgba(0,0,0,0.6)] px-3 py-2.5 flex items-center justify-between">
        <HomeHeroLogo svgClassName="relative block h-8 w-auto" />

        <div className="flex items-center gap-2">
          <a
            href="https://discord.gg/VHDedCcbGY"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join our Discord"
            className="flex items-center h-7 px-3 rounded-full text-[10px] font-semibold border border-[#5865F2]/35 transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(88,101,242,0.15)', color: '#a5b4fc' }}
          >
            Discord
          </a>

          <HeaderAdToggle />
        </div>
      </header>
    </div>
  );
}
