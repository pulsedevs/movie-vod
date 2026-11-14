import HomePageV2Shell from '@/components/home/HomePageV2Shell';
import V2ShellMainSlot from '@/components/home/v2/V2ShellMainSlot';
import V3Shell from '@/components/v3/V3Shell';
import { getHomeLayout } from '@/utils/homeLayout';
import { isV3 } from '@/utils/uiSkin';

/** Wraps production routes in the v2 shell when `NEXT_PUBLIC_HOME_LAYOUT=v2`
 *  (the v3 shell when `NEXT_PUBLIC_UI=v3` as well). */
export default function V2ProductionShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (getHomeLayout() !== 'v2') {
    return children;
  }

  if (isV3()) {
    return <V3Shell>{children}</V3Shell>;
  }

  return (
    <HomePageV2Shell>
      <V2ShellMainSlot>{children}</V2ShellMainSlot>
    </HomePageV2Shell>
  );
}
