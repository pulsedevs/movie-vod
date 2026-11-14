'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Clapperboard, Home, Search, Settings, Tv, type LucideIcon } from 'lucide-react';
import BoredFlixLogoStatic from '@/components/branding/BoredFlixLogoStatic';
import { isV2NavActive } from '@/utils/v2Shell';

const HeaderAdToggle = dynamic(() => import('@/components/ads/HeaderAdToggle'), { ssr: false });
const DesktopDiscordButton = dynamic(() => import('@/components/home/v2/DesktopDiscordButton'), { ssr: false });

const NAV: { route: string; label: string; icon: LucideIcon }[] = [
  { route: '/', label: 'Home', icon: Home },
  { route: '/browse/movies', label: 'Movies', icon: Clapperboard },
  { route: '/browse/tv', label: 'Shows', icon: Tv },
  { route: '/library', label: 'My List', icon: Bookmark },
];

const GLASS =
  'border border-white/[0.09] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_rgba(0,0,0,0.35)]';

/** Top bar: logo on the left, a frosted pill with the sections + search + settings on the right.
 *  On phones the sections move to a frosted pill at the bottom of the screen. */
export default function GlassNav({ scrolled = false }: { scrolled?: boolean }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const onDetail = /^\/(movie|tv)\//.test(pathname);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [settingsOpen]);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        {/* A soft shade behind the bar once the page scrolls, so it reads over any poster. */}
        <div
          className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent transition-opacity duration-500 ${
            scrolled ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="v3-gutter relative flex items-center justify-between gap-4 pt-4 md:pt-5">
          <div className="pointer-events-auto flex items-center gap-3">
            {onDetail && (
              <button
                type="button"
                onClick={back}
                aria-label="Back"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Link href="/" aria-label="Home" className="flex items-center">
              <BoredFlixLogoStatic className="block h-8 w-auto md:h-9" />
            </Link>
          </div>

          <nav
            aria-label="Main"
            className={`pointer-events-auto hidden items-center gap-1 rounded-full p-1.5 transition-colors duration-500 md:flex ${GLASS} ${
              scrolled ? 'bg-black/35' : ''
            }`}
          >
            {NAV.map(({ route, label, icon: Icon }) => {
              const active = isV2NavActive(pathname, route);
              return (
                <Link
                  key={route}
                  href={route}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                    active
                      ? 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.25)]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {active && <Icon className="h-4 w-4" strokeWidth={2.2} />}
                  {label}
                </Link>
              );
            })}
            <span className="mx-1.5 h-5 w-px bg-white/15" />
            <Link
              href="/search"
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                aria-label="Settings"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-[18px] w-[18px]" />
              </button>
              {settingsOpen && (
                <div className={`absolute right-0 top-full mt-3 flex flex-col gap-2 rounded-2xl p-3 ${GLASS} bg-black/60`}>
                  <HeaderAdToggle />
                  <DesktopDiscordButton />
                </div>
              )}
            </div>
          </nav>

          <Link
            href="/search"
            aria-label="Search"
            className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-white md:hidden ${GLASS}`}
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      {/* Phones: sections in a frosted pill at the bottom. */}
      <nav
        aria-label="Main"
        className={`fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-full p-1.5 md:hidden ${GLASS} bg-black/45`}
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {NAV.map(({ route, label, icon: Icon }) => {
          const active = isV2NavActive(pathname, route);
          return (
            <Link
              key={route}
              href={route}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition-colors ${
                active ? 'bg-white text-black' : 'text-white/70'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.9} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
