'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Film, Tv, Star, Library, LucideIcon } from 'lucide-react';
import { PROVIDERS } from '@/config/providers';
import { navThemes, type NavTheme } from './navThemes';
import { isV2NavActive, toV2Href } from '@/utils/v2Shell';
import { V2_SIDEBAR_VISIBLE_CLASS } from '@/utils/v2Layout';

const itemSpring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.8 };

const labelVariants = {
  idle:   { opacity: 0, x: -8 },
  active: { opacity: 0, x: -8 },
  hover:  { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
};

// ── Nav rows ──────────────────────────────────────────────────────────────────

function NavRow({
  href,
  label,
  icon: Icon,
  theme,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  theme: NavTheme;
  isActive?: boolean;
}) {
  const state = isActive ? 'active' : 'idle';
  return (
    <li>
      <Link href={href} className="block outline-none" aria-current={isActive ? 'page' : undefined}>
        <motion.div
          className="flex items-center h-11 mx-1.5 rounded-xl overflow-hidden"
          initial={false}
          animate={state}
          whileHover="hover"
          variants={{
            idle:   { width: 48, backgroundColor: 'rgba(0,0,0,0)' },
            active: { width: 48, backgroundColor: theme.bgActive },
            hover:  { width: 168, backgroundColor: isActive ? theme.bgActiveHover : theme.bgHover, transition: itemSpring },
          }}
        >
          <span className="flex w-12 shrink-0 items-center justify-center">
            <Icon className="w-4 h-4" style={{ color: isActive ? theme.iconActive : theme.icon }} />
          </span>
          <motion.span
            className="whitespace-nowrap pr-3 overflow-hidden text-xs font-medium"
            style={{ color: theme.label }}
            variants={labelVariants}
          >
            {label}
          </motion.span>
        </motion.div>
      </Link>
    </li>
  );
}

// ── Provider icons ────────────────────────────────────────────────────────────

const NetflixIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <rect width="24" height="24" rx="5" fill="#000" />
    <path
      d="M4.5 3 L4.5 21 L8.5 21 L8.5 10.5 L15.5 21 L19.5 21 L19.5 3 L15.5 3 L15.5 13.5 L8.5 3 Z"
      fill="#E50914"
    />
  </svg>
);

const MaxIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <rect width="24" height="24" rx="4" fill="#002BE7" />
    <text x="12" y="16.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="white" fontFamily="Arial,sans-serif" letterSpacing="0.3">max</text>
  </svg>
);

const DisneyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <rect width="24" height="24" rx="4" fill="#0C1C5B" />
    <text x="12" y="13.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="white" fontFamily="Arial,sans-serif">D+</text>
  </svg>
);

const PrimeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <rect width="24" height="24" rx="4" fill="#00A8E0" />
    <path d="M6 15.5C8.5 17.5 15.5 17.5 18 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 7l2.5 4.5H9.5L12 7z" fill="white"/>
  </svg>
);


function ProviderRow({
  label,
  icon: Icon,
  href,
  bgColor,
  color,
}: {
  label: string;
  icon: React.FC;
  href: string;
  bgColor: string;
  color: string;
}) {
  const hoverLabelVariants = {
    idle:   { opacity: 0, x: -8 },
    active: { opacity: 0, x: -8 },
    hover:  { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <li>
      <Link href={href} className="block outline-none">
        <motion.div
          className="flex items-center h-11 mx-1.5 rounded-xl overflow-hidden"
          initial={false}
          animate="idle"
          whileHover="hover"
          variants={{
            idle:  { width: 48, backgroundColor: 'rgba(0,0,0,0)' },
            hover: { width: 168, backgroundColor: bgColor, transition: itemSpring },
          }}
        >
          <span className="flex w-12 shrink-0 items-center justify-center">
            <Icon />
          </span>
          <motion.span
            className="whitespace-nowrap pr-3 overflow-hidden text-xs font-semibold"
            style={{ color }}
            variants={hoverLabelVariants}
          >
            {label}
          </motion.span>
        </motion.div>
      </Link>
    </li>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function HomeSidebar() {
  const pathname = usePathname();

  const navItems: { route: string; label: string; icon: LucideIcon; theme: NavTheme }[] = [
    { route: '/',              label: 'Home',    icon: Home,    theme: navThemes.home },
    { route: '/browse/movies', label: 'Movies',  icon: Film,    theme: navThemes.movies },
    { route: '/browse/tv',     label: 'TV',      icon: Tv,      theme: navThemes.tv },
    { route: '/browse/anime',  label: 'Anime',   icon: Star,    theme: navThemes.anime },
    { route: '/library',       label: 'Library', icon: Library, theme: navThemes.library },
  ];

  const providerIcons: Record<string, React.FC> = {
    netflix: NetflixIcon,
    max:     MaxIcon,
    disney:  DisneyIcon,
    prime:   PrimeIcon,
  };

  const providers = PROVIDERS.map((p) => ({
    label:   p.name,
    icon:    providerIcons[p.slug],
    href:    `/browse/provider/${p.slug}`,
    bgColor: p.bgColor,
    color:   p.color,
  }));

  return (
    <aside className={`v2-panel-shadow-right ${V2_SIDEBAR_VISIBLE_CLASS} flex-col w-16 shrink-0 h-full bg-[#0b0b0b] border-r border-white/[0.04] py-4 overflow-visible`}>
      <ul className="space-y-1.5">
        {navItems.map(({ route, label, icon, theme }) => (
          <NavRow
            key={label}
            href={toV2Href(pathname, route)}
            label={label}
            icon={icon}
            theme={theme}
            isActive={isV2NavActive(pathname, route)}
          />
        ))}
        {providers.map((p) => (
          <ProviderRow key={p.label} label={p.label} icon={p.icon} href={p.href} bgColor={p.bgColor} color={p.color} />
        ))}
      </ul>
    </aside>
  );
}
