'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import AppLayoutShellClient from './AppLayoutShellClient';
import { isFullscreenPath } from '@/utils/fullscreenPaths';

interface ConditionalLayoutWrapperProps {
  children: ReactNode;
}

/** @deprecated Use AppLayoutShell — kept for compatibility */
const ConditionalLayoutWrapper: React.FC<ConditionalLayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname() ?? '';
  return (
    <AppLayoutShellClient initialFullscreen={isFullscreenPath(pathname)}>
      {children}
    </AppLayoutShellClient>
  );
};

export default ConditionalLayoutWrapper;
