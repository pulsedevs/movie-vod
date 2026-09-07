'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLibraryPanelData } from '@/hooks/useLibraryPanelData';
import { Compass, Clock, Bookmark, CheckCircle2, Library, LogOut, ChevronDown, X } from 'lucide-react';
import PersonalListItem from './PersonalListItem';
import ContinueFeaturedCard from './ContinueFeaturedCard';
import { navThemes, type NavTheme } from './navThemes';
import { toV2Href } from '@/utils/v2Shell';
import {
  isDetailPanelPath,
  DETAIL_PLAYER_PANEL_PORTAL_ID,
  DETAIL_TV_SEASONS_PORTAL_ID,
  parseDetailPanelPath,
} from '@/utils/detailPanel';
import DetailPanelSimilar from '@/components/detail/v2/DetailPanelSimilar';
import { V2_DURATION, v2Transition } from '@/utils/v2Transitions';

type PersonalTab = 'continue' | 'bookmarked' | 'recent';

const tabConfig: { id: PersonalTab; label: string; icon: typeof Clock; theme: NavTheme }[] = [
  { id: 'continue',   label: 'Continue', icon: Clock,    theme: navThemes.home    },
  { id: 'bookmarked', label: 'Saved',    icon: Bookmark, theme: navThemes.library },
  { id: 'recent',     label: 'Completed', icon: CheckCircle2, theme: navThemes.parties },
];

const libraryVariants = {
  show: { x: 0, opacity: 1 },
  hide: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

const detailVariants = {
  initial: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir: number) => ({ x: dir * 40, opacity: 0 }),
};

export default function LibraryPanelInner({ forceLibrary = false, onClose }: { forceLibrary?: boolean; onClose?: () => void }) {
  const pathname = usePathname() ?? '';
  const reducedMotion = useReducedMotion();
  const rawIsDetailPanel = isDetailPanelPath(pathname);
  const isDetailPanel = forceLibrary ? false : rawIsDetailPanel;

  const prevDetailRef = useRef(isDetailPanel);
  const slideDirRef = useRef(1);
  if (isDetailPanel !== prevDetailRef.current) {
    slideDirRef.current = isDetailPanel ? 1 : -1;
    prevDetailRef.current = isDetailPanel;
  }
  const slideDir = slideDirRef.current;

  const [activeTab, setActiveTab] = useState<PersonalTab>('continue');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const { watchlist, continueWatching, recentWatched } = useLibraryPanelData();
  const activeTheme = tabConfig.find((t) => t.id === activeTab)!.theme;
  const featuredContinue = continueWatching[0];
  const moreContinue = continueWatching.slice(1);
  const detailMeta = forceLibrary ? null : parseDetailPanelPath(pathname);

  const counts: Record<PersonalTab, number> = {
    continue:   continueWatching.length,
    bookmarked: watchlist.length,
    recent:     recentWatched.length,
  };

  const panelTransition = v2Transition(V2_DURATION.panel, 0, reducedMotion ?? false);

  return (
    <>
      {/* ── Library panel ────────────────────────────────────────── */}
      <motion.div
        key="library-panel"
        custom={slideDir}
        variants={libraryVariants}
        initial={false}
        animate={isDetailPanel ? 'hide' : 'show'}
        transition={panelTransition}
        aria-hidden={isDetailPanel}
        className={`absolute inset-0 flex flex-col overflow-hidden py-5 px-3 ${
          isDetailPanel ? 'z-0' : 'z-10'
        }`}
        style={{ pointerEvents: isDetailPanel ? 'none' : undefined }}
      >
        {/* Profile / auth */}
        <div className="shrink-0 mb-4 px-0.5">
          {user ? (
            <div ref={profileRef} className="relative">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-1 py-1 hover:bg-white/[0.04] transition-colors duration-150"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: navThemes.library.bgActive,
                      color: navThemes.library.iconActive,
                      border: `1px solid ${navThemes.library.icon}55`,
                    }}
                  >
                    {user.displayName?.slice(0, 2).toUpperCase() ??
                      user.email?.slice(0, 2).toUpperCase() ??
                      'BF'}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-white text-sm font-semibold truncate leading-tight">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-zinc-500 text-[11px] truncate">{user.email}</p>
                  </div>
                  <ChevronDown
                    className="w-3.5 h-3.5 shrink-0 text-zinc-500 transition-transform duration-150"
                    style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:scale-90 transition-colors duration-150"
                    aria-label="Close panel"
                  >
                    <X className="w-3.5 h-3.5 text-white/50" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(22,22,26,0.98)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-gray-500 text-[11px] px-1 mt-2">
                {counts.continue} in progress · {counts.bookmarked} saved
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Library className="w-4 h-4 shrink-0" style={{ color: navThemes.library.icon }} />
                <p className="text-white text-sm font-semibold flex-1">Your library</p>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.07] hover:bg-white/[0.12] active:scale-90 transition-colors duration-150"
                    aria-label="Close panel"
                  >
                    <X className="w-3.5 h-3.5 text-white/50" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('open-auth-modal', { detail: { mode: 'signin' } }),
                  )
                }
                className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-900 transition-opacity hover:opacity-90"
                style={{ backgroundColor: navThemes.library.iconActive }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }),
                  )
                }
                className="w-full py-2 mt-1.5 rounded-xl text-xs font-semibold text-zinc-300 border border-white/10 hover:bg-white/[0.04] transition-colors"
              >
                Create account
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-4 border border-white/5">
          {tabConfig.map(({ id, label, icon: Icon, theme }) => {
            const isActive = activeTab === id;
            const count = counts[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center px-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all min-w-0"
                style={
                  isActive
                    ? { backgroundColor: theme.bgActive, color: theme.label }
                    : { color: '#a1a1aa' }
                }
              >
                <Icon
                  className="w-3.5 h-3.5 mb-1 shrink-0"
                  style={{ color: isActive ? theme.iconActive : theme.icon }}
                />
                <span className="block truncate w-full text-center">{label}</span>
                {count > 0 && (
                  <span
                    className="block text-[10px] font-bold mt-0.5"
                    style={{
                      color: isActive ? theme.iconActive : theme.icon,
                      opacity: isActive ? 1 : 0.75,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1 scrollbar-hide">
          {activeTab === 'continue' && (
            <>
              {continueWatching.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  message="Nothing in progress yet."
                  cta="Start watching"
                  href={toV2Href(pathname, '/browse/movies')}
                  theme={navThemes.home}
                />
              ) : (
                <>
                  {featuredContinue && (
                    <ContinueFeaturedCard item={featuredContinue} theme={navThemes.home} />
                  )}
                  {moreContinue.length > 0 && (
                    <ul className="space-y-0.5">
                      {moreContinue.map((item) => (
                        <li key={`${item.id}-${item.media_type}`}>
                          <PersonalListItem
                            id={item.id}
                            mediaType={item.media_type}
                            title={item.title || item.name || 'Untitled'}
                            posterPath={item.poster_path}
                            progress={item.progress}
                            season={item.season}
                            episode={item.episode}
                            accentColor={navThemes.home.icon}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'bookmarked' && (
            <>
              {watchlist.length === 0 ? (
                <EmptyState
                  icon={Library}
                  message="No saved titles yet."
                  cta="Discover movies"
                  href={toV2Href(pathname, '/browse/movies')}
                  theme={navThemes.library}
                />
              ) : (
                <ul className="space-y-0.5">
                  {watchlist.map((item) => {
                    const title = item.media_type === 'movie' ? item.title : item.name;
                    return (
                      <li key={`${item.id}-${item.media_type}`}>
                        <PersonalListItem
                          id={item.id}
                          mediaType={item.media_type}
                          title={title ?? 'Untitled'}
                          posterPath={item.poster_path}
                          subtitle={item.media_type}
                          showPlay={false}
                          accentColor={navThemes.library.icon}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {activeTab === 'recent' && (
            <>
              {recentWatched.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  message="No finished titles yet."
                  cta="Start watching"
                  href={toV2Href(pathname, '/')}
                  theme={navThemes.parties}
                />
              ) : (
                <ul className="space-y-0.5">
                  {recentWatched.map((item) => (
                    <li key={`${item.id}-${item.media_type}-watched`}>
                      <PersonalListItem
                        id={item.id}
                        mediaType={item.media_type}
                        title={item.title || item.name || 'Untitled'}
                        posterPath={item.poster_path}
                        subtitle="Finished"
                        showPlay={false}
                        accentColor={navThemes.parties.icon}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Footer link */}
        <Link
          href={toV2Href(pathname, '/library')}
          className="shrink-0 mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border transition-colors"
          style={{
            color: activeTheme.iconActive,
            backgroundColor: activeTheme.bgRest,
            borderColor: `${activeTheme.icon}33`,
          }}
        >
          Open full library
          <Compass className="w-3 h-3" />
        </Link>
      </motion.div>

      {/* ── Detail panel (desktop only — forceLibrary suppresses it) ── */}
      <AnimatePresence initial={false} custom={slideDir}>
        {isDetailPanel && (
          <motion.div
            key="detail-panel"
            custom={slideDir}
            variants={detailVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
            className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#0b0b0b] py-3 px-2"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide">
              <div id={DETAIL_PLAYER_PANEL_PORTAL_ID} className="shrink-0" />
              {detailMeta?.mediaType === 'tv' && (
                <div
                  id={DETAIL_TV_SEASONS_PORTAL_ID}
                  className="w-full min-w-0 max-w-full shrink-0 overflow-hidden"
                />
              )}
              {detailMeta && (
                <DetailPanelSimilar mediaType={detailMeta.mediaType} mediaId={detailMeta.id} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({
  icon: Icon,
  message,
  cta,
  href,
  theme,
}: {
  icon: typeof Clock;
  message: string;
  cta: string;
  href: string;
  theme: NavTheme;
}) {
  return (
    <div className="text-center px-3 py-10">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: theme.bgActive, color: theme.iconActive }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-gray-400 text-sm mb-4 leading-relaxed">{message}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
        style={{ backgroundColor: theme.icon, color: '#0a0a0a' }}
      >
        {cta}
      </Link>
    </div>
  );
}
