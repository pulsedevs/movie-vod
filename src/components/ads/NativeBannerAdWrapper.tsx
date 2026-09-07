'use client';

import dynamic from 'next/dynamic';

// Loaded client-side only: the ad script writes into the DOM, which breaks SSR hydration.
const NativeBannerAd = dynamic(() => import('./NativeBannerAd'), { ssr: false });

interface NativeBannerAdWrapperProps {
  className?: string;
}

/**
 * In-content banner slot used on home, browse, search and the player.
 *
 * Renders the native banner ad. The load still respects NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED
 * and the user's Ads toggle (see NativeBannerAd), so it stays gated.
 *
 * The self-hosted offers bar lives at @/components/promo/OffersBanner if this needs swapping back.
 */
export default function NativeBannerAdWrapper({ className }: NativeBannerAdWrapperProps) {
  return <NativeBannerAd className={className} />;
}
