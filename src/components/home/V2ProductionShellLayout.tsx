import HomePageV2Shell from '@/components/home/HomePageV2Shell';
import V2ShellMainSlot from '@/components/home/v2/V2ShellMainSlot';
import { getHomeLayout } from '@/utils/homeLayout';

/** Wraps production routes in the v2 shell when `NEXT_PUBLIC_HOME_LAYOUT=v2`. */
export default function V2ProductionShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (getHomeLayout() !== 'v2') {
    return children;
  }

  return (
    <HomePageV2Shell>
      <V2ShellMainSlot>{children}</V2ShellMainSlot>
    </HomePageV2Shell>
  );
}
