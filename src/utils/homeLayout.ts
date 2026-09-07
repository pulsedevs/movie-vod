export type HomeLayout = 'classic' | 'v2';

export function getHomeLayout(): HomeLayout {
  return process.env.NEXT_PUBLIC_HOME_LAYOUT === 'v2' ? 'v2' : 'classic';
}
