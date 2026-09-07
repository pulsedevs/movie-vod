import { headers } from 'next/headers';
import { ReactNode } from 'react';
import AppLayoutShellClient from './AppLayoutShellClient';
import { isFullscreenPath } from '@/utils/fullscreenPaths';

export default async function AppLayoutShell({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  const initialFullscreen = isFullscreenPath(pathname);

  return (
    <AppLayoutShellClient initialFullscreen={initialFullscreen}>
      {children}
    </AppLayoutShellClient>
  );
}
