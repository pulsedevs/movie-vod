import HomePageV2Shell from '@/components/home/HomePageV2Shell';
import HomeRowsMain from '@/components/home/v2/HomeRowsMain';
import V2ShellMainSlot from '@/components/home/v2/V2ShellMainSlot';

/**
 * Root v2 home — sliding hero + trending rows in the middle column.
 * The original fan landing hero is preserved at `/home-preview`.
 */
export default function HomePageV2() {
  return (
    <HomePageV2Shell>
      <V2ShellMainSlot>
        <HomeRowsMain />
      </V2ShellMainSlot>
    </HomePageV2Shell>
  );
}
