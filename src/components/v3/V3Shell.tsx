'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { AmbientProvider } from './ambient/AmbientContext';
import AmbientBackground from './ambient/AmbientBackground';
import GlassNav from './GlassNav';
import './v3.css';

const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then((m) => ({ default: m.AuthModal })), {
  ssr: false,
});

/** The page's scroll container (the global shell keeps the window itself from scrolling here). */
const ScrollCtx = createContext<React.RefObject<HTMLDivElement | null> | null>(null);
export function useV3Scroll() {
  return useContext(ScrollCtx);
}

/** v3 shell: moving ambient background, glass nav, and one full-width scrolling page. */
export default function V3Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 24);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // A new page starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      setAuthMode((e as CustomEvent<{ mode: 'signin' | 'signup' }>).detail?.mode ?? 'signin');
      setShowAuth(true);
    };
    window.addEventListener('open-auth-modal', handler);
    return () => window.removeEventListener('open-auth-modal', handler);
  }, []);

  return (
    <AmbientProvider>
      {/* Fonts load at runtime (not at build), so an offline build still works - system fonts then. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800&display=swap"
        precedence="default"
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode={authMode} />
      <div className="v3-root relative h-screen w-full overflow-hidden bg-black text-white">
        <AmbientBackground />
        <GlassNav scrolled={scrolled} />
        <ScrollCtx.Provider value={scrollRef}>
          <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-contain">
            <main className="min-h-full pb-28 md:pb-16">{children}</main>
          </div>
        </ScrollCtx.Provider>
      </div>
    </AmbientProvider>
  );
}
