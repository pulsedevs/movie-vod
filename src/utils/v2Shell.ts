import { getHomeLayout } from '@/utils/homeLayout';

/** Whether the current URL should use the 3-column v2 shell (sidebar + main + library). */
export function isV2ShellPath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname === '/home-preview' || pathname.startsWith('/home-preview/')) return true;
  if (pathname.startsWith('/movie-preview/') || pathname.startsWith('/tv-preview/')) return true;
  if (getHomeLayout() !== 'v2') return false;
  if (pathname === '/') return true;
  return (
    pathname.startsWith('/browse/') ||
    pathname === '/library' ||
    pathname.startsWith('/movie/') ||
    pathname.startsWith('/tv/')
  );
}

/** Base path for v2 shell links (`/home-preview` in preview, `` when v2 is live at `/`). */
export function getV2BaseFromPathname(pathname: string): string {
  if (pathname.startsWith('/home-preview')) return '/home-preview';
  if (getHomeLayout() === 'v2') return '';
  return '/home-preview';
}

/** Build a nav href that keeps the user inside the v2 shell. */
export function toV2Href(pathname: string, route: string): string {
  const base = getV2BaseFromPathname(pathname);
  if (route === '/' || route === '') return base || '/';
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return `${base}${normalized}`;
}

export function isV2NavActive(pathname: string, route: string): boolean {
  const href = toV2Href(pathname, route);

  if (route === '/') {
    return pathname === href || pathname === `${href}/`;
  }

  if (route === '/browse/movies') {
    return pathname === href || pathname.startsWith(`${href}/`) || /\/movie\/\d+/.test(pathname);
  }

  if (route === '/browse/tv') {
    return pathname === href || pathname.startsWith(`${href}/`) || /\/tv\/\d+/.test(pathname);
  }

  if (route === '/browse/anime') {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (route === '/library') {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
