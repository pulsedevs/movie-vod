import type { Metadata } from 'next';
import HomePageV2Shell from '@/components/home/HomePageV2Shell';
import V2ShellMainSlot from '@/components/home/v2/V2ShellMainSlot';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HomePreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomePageV2Shell>
      <V2ShellMainSlot>{children}</V2ShellMainSlot>
    </HomePageV2Shell>
  );
}
