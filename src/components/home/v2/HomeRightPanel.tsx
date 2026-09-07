'use client';

import { V2_RIGHT_PANEL_VISIBLE_CLASS } from '@/utils/v2Layout';
import LibraryPanelInner from './LibraryPanelInner';

export default function HomeRightPanel() {
  return (
    <aside
      className={`v2-panel-shadow-left relative ${V2_RIGHT_PANEL_VISIBLE_CLASS} w-52 xl:w-64 shrink-0 h-full bg-[#0b0b0b] border-l border-white/[0.04] overflow-hidden`}
    >
      <LibraryPanelInner />
    </aside>
  );
}
