'use client';

import { usePathname } from 'next/navigation';
import { getV2MainColumnKey } from '@/utils/v2Transitions';
import V2MainColumn from './V2MainColumn';

interface V2ShellMainSlotProps {
  children: React.ReactNode;
}

/** Keeps one animated main column across all v2 shell routes. */
export default function V2ShellMainSlot({ children }: V2ShellMainSlotProps) {
  const pathname = usePathname() ?? '';
  return <V2MainColumn columnKey={getV2MainColumnKey(pathname)}>{children}</V2MainColumn>;
}
