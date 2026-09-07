'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Star, User, Search, type LucideIcon } from 'lucide-react';
import { navThemes, type NavTheme } from './navThemes';
import { isV2NavActive, toV2Href } from '@/utils/v2Shell';
import SearchBar from '@/components/search/SearchBar';

interface HomeV2BottomNavProps {
  mePanelOpen: boolean;
  onMePress: () => void;
}

const navItems: { route: string; label: string; icon: LucideIcon; theme: NavTheme }[] = [
  { route: '/',              label: 'Home',   icon: Home,  theme: navThemes.home   },
  { route: '/browse/movies', label: 'Movies', icon: Film,  theme: navThemes.movies },
  { route: '/browse/tv',     label: 'TV',     icon: Tv,    theme: navThemes.tv     },
  { route: '/browse/anime',  label: 'Anime',  icon: Star,  theme: navThemes.anime  },
];

export default function HomeV2BottomNav({ mePanelOpen, onMePress }: HomeV2BottomNavProps) {
  const pathname = usePathname() ?? '';
  const meTheme = navThemes.library;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1">
      <nav
        className="rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.16] shadow-[0_-4px_24px_rgba(0,0,0,0.6)] px-1 py-1.5"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-evenly">
          {navItems.map(({ route, label, icon: Icon, theme }) => {
            const isActive = isV2NavActive(pathname, route);
            const href = toV2Href(pathname, route);
            return (
              <Link
                key={route}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-[3px] min-w-[48px] px-2 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
                style={isActive ? { backgroundColor: theme.bgActive } : undefined}
              >
                {isActive && (
                  <span
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                    style={{ backgroundColor: theme.iconActive }}
                  />
                )}
                <Icon
                  className="w-[17px] h-[17px] shrink-0"
                  style={{ color: isActive ? theme.iconActive : 'rgba(255,255,255,0.3)' }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: isActive ? theme.label : 'rgba(255,255,255,0.3)' }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Search — opens the full-screen search modal */}
          <SearchBar
            triggerClassName="relative flex flex-col items-center justify-center gap-[3px] min-w-[48px] px-2 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
            triggerChildren={
              <>
                <Search className="w-[17px] h-[17px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[10px] font-medium leading-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Search
                </span>
              </>
            }
          />

          {/* Me — opens library / profile drawer */}
          <button
            type="button"
            onClick={onMePress}
            aria-pressed={mePanelOpen}
            className="relative flex flex-col items-center justify-center gap-[3px] min-w-[48px] px-2 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
            style={mePanelOpen ? { backgroundColor: meTheme.bgActive } : undefined}
          >
            {mePanelOpen && (
              <span
                className="absolute -top-px left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                style={{ backgroundColor: meTheme.iconActive }}
              />
            )}
            <User
              className="w-[17px] h-[17px] shrink-0"
              style={{ color: mePanelOpen ? meTheme.iconActive : 'rgba(255,255,255,0.3)' }}
            />
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: mePanelOpen ? meTheme.label : 'rgba(255,255,255,0.3)' }}
            >
              Me
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
