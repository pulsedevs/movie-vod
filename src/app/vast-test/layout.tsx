import type { Metadata } from 'next';

// The page itself is a client component and cannot export metadata, so the noindex lives here.
// /vast-test is an internal ad-testing page with no search value and was previously crawlable
// (no robots.txt Disallow covered it) while inheriting the root canonical.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function VastTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
