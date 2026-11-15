'use client';

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Clapperboard, Home, Search, Settings, Tv, type LucideIcon } from 'lucide-react';
import BoredFlixLogoStatic from '@/components/branding/BoredFlixLogoStatic';
import { isV2NavActive } from '@/utils/v2Shell';
import { useTrailersPref } from './prefs';

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

type PillBox = { x: number; y: number; w: number; h: number; on: boolean; jump: boolean };

/**
 * The white pill behind the active section. It is one element that slides to the active link (springy,
 * like cinejoy's) instead of each link painting its own background. Links carry `data-pill={route}`.
 * Before hydration the active link paints its own white background, so there is no flash.
 */
function useSlidingPill(active: string | null) {
  const ref = useRef<HTMLElement>(null);
  const [box, setBox] = useState<PillBox>({ x: 0, y: 0, w: 0, h: 0, on: false, jump: true });

  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const measure = () => {
      const el = active ? nav.querySelector<HTMLElement>(`[data-pill="${active}"]`) : null;
      setBox((prev) =>
        el
          ? // Appearing (first paint, or back from a page with no section): jump there, don't slide in from the old spot.
            { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, on: true, jump: !prev.on }
          : { ...prev, on: false, jump: false },
      );
    };
    measure();
    // Widths change when the fonts load or the window resizes.
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [active]);

  const pill = (
    <span
      aria-hidden
      className={`v3-navpill pointer-events-none absolute left-0 z-0 rounded-full bg-white ${box.jump ? 'v3-navpill-jump' : ''}`}
      style={{ transform: `translate3d(${box.x}px,0,0)`, top: box.y, width: box.w, height: box.h, opacity: box.on ? 1 : 0 }}
    />
  );
  return { ref, pill, ready: box.on };
}

/** Top bar: logo on the left, a frosted pill with the sections + search + settings on the right.
 *  On phones the sections move to a frosted pill at the bottom of the screen. */
export default function GlassNav({ scrolled = false }: { scrolled?: boolean }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const onDetail = /^\/(movie|tv)\//.test(pathname);
  const [trailersOn, setTrailersOn] = useTrailersPref();

  // The pill moves on the click, not when the next page has loaded.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(null), 8000); // a navigation that never landed
    return () => clearTimeout(t);
  }, [pending]);
  const activeRoute = pending ?? NAV.find((n) => isV2NavActive(pathname, n.route))?.route ?? null;
  const go = (route: string) => (e: ReactMouseEvent) => {
    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) setPending(route);
  };
  const top = useSlidingPill(activeRoute);
  const bottom = useSlidingPill(activeRoute);
  // The new section's icon pops in with a bounce (not on the first paint).
  const [seenRoute, setSeenRoute] = useState(activeRoute);
  const [pop, setPop] = useState(false);
  if (seenRoute !== activeRoute) {
    setSeenRoute(activeRoute);
    setPop(true);
  }

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
              <BoredFlixLogoStatic className="block h-10 w-auto md:h-12" />
            </Link>
          </div>

          <nav
            ref={top.ref}
            aria-label="Main"
            className={`pointer-events-auto relative hidden items-center gap-1 rounded-full p-1.5 transition-colors duration-500 md:flex ${GLASS} ${
              scrolled ? 'bg-black/35' : ''
            }`}
          >
            {top.pill}
            {NAV.map(({ route, label, icon: Icon }) => {
              const active = route === activeRoute;
              return (
                <Link
                  key={route}
                  href={route}
                  data-pill={route}
                  onClick={go(route)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
                    active ? `text-black ${top.ready ? '' : 'bg-white'}` : 'text-white/75 hover:text-white'
                  }`}
                >
                  {active && <Icon className={`h-4 w-4 ${pop ? 'v3-navicon-in' : ''}`} strokeWidth={2.2} />}
                  {label}
                </Link>
              );
            })}
            <span className="mx-1.5 h-5 w-px bg-white/15" />
            <Link
              href="/search"
              aria-label="Search"
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <div className="relative z-20" ref={settingsRef}>
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
                <div className={`absolute right-0 top-full mt-3 flex w-max flex-col gap-2 rounded-2xl p-3 ${GLASS} bg-black/60`}>
                  <div className="flex items-center justify-between gap-6 px-1 py-1 text-sm text-white/85">
                    <span>Background trailers</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={trailersOn}
                      aria-label="Background trailers"
                      onClick={() => setTrailersOn(!trailersOn)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${trailersOn ? 'bg-white' : 'bg-white/20'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
                          trailersOn ? 'left-[22px] bg-black' : 'left-0.5 bg-white'
                        }`}
                      />
                    </button>
                  </div>
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
        ref={bottom.ref}
        aria-label="Main"
        className={`fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-full p-1.5 md:hidden ${GLASS} bg-black/45`}
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {bottom.pill}
        {NAV.map(({ route, label, icon: Icon }) => {
          const active = route === activeRoute;
          return (
            <Link
              key={route}
              href={route}
              data-pill={route}
              onClick={go(route)}
              aria-current={active ? 'page' : undefined}
              className={`relative z-10 flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition-colors duration-300 ${
                active ? `text-black ${bottom.ready ? '' : 'bg-white'}` : 'text-white/70'
              }`}
            >
              <Icon
                key={active ? 'on' : 'off'}
                className={`h-[18px] w-[18px] ${active && pop ? 'v3-navicon-in' : ''}`}
                strokeWidth={active ? 2.3 : 1.9}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
