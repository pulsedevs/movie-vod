'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import HomeSidebar from './v2/HomeSidebar';
import HomeRightPanel from './v2/HomeRightPanel';
import HomeV2BottomNav from './v2/HomeV2BottomNav';
import HomeV2MobileHeader from './v2/HomeV2MobileHeader';
import HeaderAdToggle from '@/components/ads/HeaderAdToggle';
import AndroidAppBanner from '@/components/promo/AndroidAppBanner';

const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(m => ({ default: m.AuthModal })), { ssr: false });
const MobileLibraryDrawer = dynamic(() => import('./v2/MobileLibraryDrawer'), { ssr: false });
const DesktopDiscordButton = dynamic(() => import('./v2/DesktopDiscordButton'), { ssr: false });

interface HomePageV2ShellProps {
  children: React.ReactNode;
}

export default function HomePageV2Shell({ children }: HomePageV2ShellProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mePanelOpen, setMePanelOpen] = useState(false);
  // On movie/tv detail (player) pages the Discord/Ads buttons live INSIDE the player
  // (top-right), so hide the shell's floating pair there to avoid overlapping the banner.
  const pathname = usePathname();
  const onDetailPage = /^\/(movie|tv)\//.test(pathname || '');

  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent<{ mode: 'signin' | 'signup' }>).detail?.mode ?? 'signin';
      setAuthMode(mode);
      setShowAuth(true);
    };
    window.addEventListener('open-auth-modal', handler);
    return () => window.removeEventListener('open-auth-modal', handler);
  }, []);

  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BoredFlix',
    description:
      'Stream free movies and TV shows online in HD, Full HD and 4K. No sign-up required.',
    url: domain,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${domain}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'BoredFlix',
      url: domain,
    },
  };

  return (
    <>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialMode={authMode} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <HomeV2MobileHeader />
      <main className="flex h-screen overflow-hidden bg-[#080808] w-full">
        <HomeSidebar />
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {/* Desktop app banner — its own row above the content, nothing overlaps it */}
          <div className="hidden md:block shrink-0">
            <AndroidAppBanner />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden relative">
            {children}

            {/* Desktop floating action buttons — upper-right of main column.
                Hidden on detail/player pages, where they render inside the player instead. */}
            {!onDetailPage && (
              <div className="hidden md:flex absolute top-3 right-14 z-30 items-center gap-2">
                <DesktopDiscordButton />
                <HeaderAdToggle />
              </div>
            )}
          </div>
          <HomeV2BottomNav mePanelOpen={mePanelOpen} onMePress={() => setMePanelOpen(true)} />
        </div>
        <HomeRightPanel />
        <MobileLibraryDrawer open={mePanelOpen} onClose={() => setMePanelOpen(false)} />
      </main>
    </>
  );
}
