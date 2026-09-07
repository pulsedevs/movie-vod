'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import DynamicLayoutContent from './DynamicLayoutContent';
import { ToastProvider } from '@/components/ui/toast';
import { isFullscreenPath } from '@/utils/fullscreenPaths';

interface AppLayoutShellClientProps {
  children: ReactNode;
  initialFullscreen: boolean;
}

export default function AppLayoutShellClient({
  children,
  initialFullscreen,
}: AppLayoutShellClientProps) {
  const pathname = usePathname() ?? '';
  const fullscreen =
    isFullscreenPath(pathname) || (pathname === '' && initialFullscreen);

  if (fullscreen) {
    return (
      <ToastProvider>
        <div className="w-full max-w-[100vw] overflow-x-hidden h-screen overflow-hidden">
          {children}
        </div>
      </ToastProvider>
    );
  }

  return <DynamicLayoutContent>{children}</DynamicLayoutContent>;
}
