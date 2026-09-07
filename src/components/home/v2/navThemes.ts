/** Shared jewel-tone palette for v2 sidebar + library tabs */
export type NavTheme = {
  icon: string;
  iconActive: string;
  bgRest: string;
  bgActive: string;
  bgHover: string;
  bgActiveHover: string;
  label: string;
};

export const navThemes = {
  brand: {
    icon: '#f87171',
    iconActive: '#fca5a5',
    bgRest: 'rgba(239, 68, 68, 0.12)',
    bgActive: 'rgba(239, 68, 68, 0.22)',
    bgHover: 'rgba(239, 68, 68, 0.28)',
    bgActiveHover: 'rgba(239, 68, 68, 0.36)',
    label: '#fecaca',
  },
  home: {
    icon: '#fbbf24',
    iconActive: '#fcd34d',
    bgRest: 'rgba(245, 158, 11, 0.1)',
    bgActive: 'rgba(245, 158, 11, 0.2)',
    bgHover: 'rgba(245, 158, 11, 0.26)',
    bgActiveHover: 'rgba(245, 158, 11, 0.34)',
    label: '#fde68a',
  },
  movies: {
    icon: '#fb923c',
    iconActive: '#fdba74',
    bgRest: 'rgba(249, 115, 22, 0.1)',
    bgActive: 'rgba(249, 115, 22, 0.2)',
    bgHover: 'rgba(249, 115, 22, 0.26)',
    bgActiveHover: 'rgba(249, 115, 22, 0.34)',
    label: '#fed7aa',
  },
  tv: {
    icon: '#a78bfa',
    iconActive: '#c4b5fd',
    bgRest: 'rgba(139, 92, 246, 0.1)',
    bgActive: 'rgba(139, 92, 246, 0.2)',
    bgHover: 'rgba(139, 92, 246, 0.26)',
    bgActiveHover: 'rgba(139, 92, 246, 0.34)',
    label: '#ddd6fe',
  },
  anime: {
    icon: '#f472b6',
    iconActive: '#f9a8d4',
    bgRest: 'rgba(236, 72, 153, 0.1)',
    bgActive: 'rgba(236, 72, 153, 0.2)',
    bgHover: 'rgba(236, 72, 153, 0.26)',
    bgActiveHover: 'rgba(236, 72, 153, 0.34)',
    label: '#fbcfe8',
  },
  parties: {
    icon: '#22d3ee',
    iconActive: '#67e8f9',
    bgRest: 'rgba(6, 182, 212, 0.1)',
    bgActive: 'rgba(6, 182, 212, 0.2)',
    bgHover: 'rgba(6, 182, 212, 0.26)',
    bgActiveHover: 'rgba(6, 182, 212, 0.34)',
    label: '#a5f3fc',
  },
  library: {
    icon: '#34d399',
    iconActive: '#6ee7b7',
    bgRest: 'rgba(16, 185, 129, 0.1)',
    bgActive: 'rgba(16, 185, 129, 0.2)',
    bgHover: 'rgba(16, 185, 129, 0.26)',
    bgActiveHover: 'rgba(16, 185, 129, 0.34)',
    label: '#a7f3d0',
  },
} satisfies Record<string, NavTheme>;
