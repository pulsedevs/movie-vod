import { isV2ShellPath } from '@/utils/v2Shell';

/** Routes that use the fullscreen shell (no global header/footer). */
export function isFullscreenPath(pathname: string): boolean {
  if (!pathname) return false;
  if (isV2ShellPath(pathname)) return true;
  if (pathname.startsWith('/party/')) return true;
  // The player page: the video fills the window.
  if (pathname.startsWith('/watch/')) return true;
  return false;
}
