// filepath: c:\Users\Adel\Desktop\my-movie-app\src\components\layout\DynamicLayoutContent.tsx
"use client";

import React, { useState, useEffect, ReactNode, useCallback } from 'react'; // Import useCallback
import { usePathname } from 'next/navigation'; // Import usePathname
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
//import SurfSharkBanner from '@/components/ads/SurfSharkBanner';
import { ToastProvider } from '@/components/ui/toast';
//import PromotionalOverlay from '@/components/ads/PromotionalOverlay';


interface DynamicLayoutContentProps {
  children: ReactNode;
}

const DynamicLayoutContent: React.FC<DynamicLayoutContentProps> = ({ children }) => {
  const [isTopBannerEffectivelyVisible, setIsTopBannerEffectivelyVisible] = useState(false); // Changed to false by default
  const pathname = usePathname(); // Get current pathname

  // Memoize handleBannerHidden using useCallback
  const handleBannerHidden = useCallback(() => {
    setIsTopBannerEffectivelyVisible(false);
  }, []); // Empty dependency array as setIsTopBannerEffectivelyVisible is stable

  useEffect(() => {
    const root = document.documentElement.style;
    if (isTopBannerEffectivelyVisible) {
      root.setProperty('--surfshark-banner-height-mobile', '50px'); // Value from globals.css
      root.setProperty('--surfshark-banner-height-desktop', '48px'); // Value from globals.css
    } else {
      root.setProperty('--surfshark-banner-height-mobile', '0px');
      root.setProperty('--surfshark-banner-height-desktop', '0px');
    }
  }, [isTopBannerEffectivelyVisible]);

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden relative">        {/* Render SurfSharkBanner and pass the handler */} 
        {/* The banner itself will manage its initial visibility based on its internal logic (delay, frequency capping) */} 
        {/* It will call onBannerHidden if it decides not to show, or when dismissed by the user  
        <SurfSharkBanner delay={1000} onBannerHidden={handleBannerHidden} />*/}
      
        <Header /> {/* Header reads CSS vars for its top offset */}
        
        {/* 
          The main content padding needs to account for the header height AND the top banner height.
          Both header and banner heights are controlled by CSS variables.
          Header.tsx positions itself using `top: var(--surfshark-banner-height-mobile)` or `top: var(--surfshark-banner-height-desktop)`.
          The main content then needs `padding-top` to be `calc(var(--header-height-mobile) + var(--surfshark-banner-height-mobile))` and similar for desktop.
        */}
        <main 
          className="min-h-screen p-4 w-full overflow-x-hidden flex-1 pb-[var(--bottom-nav-height)]"
          style={{
            // Fallback for SSR / no-JS. Dynamic adjustment via <style jsx> is preferred for client-side.
            paddingTop: `calc(var(--header-height-mobile) + var(--surfshark-banner-height-mobile))` 
          }}
        >
          <style jsx>{`
            main {
              padding-top: calc(var(--header-height-mobile) + var(--surfshark-banner-height-mobile));
            }
            @media (min-width: 768px) { /* md breakpoint */
              main {
                padding-top: calc(var(--header-height-desktop) + var(--surfshark-banner-height-desktop));
              }
            }
          `}</style>
          {children}
        </main>        <Footer />          {/* Other overlays/banners that are not part of the main layout flow
        {pathname !== '/' && <PromotionalOverlay delay={20000} autoHide={10000} testing={true} />} */}
       
     
      </div>
    </ToastProvider>
  );
};

export default DynamicLayoutContent;
