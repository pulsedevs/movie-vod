'use client';

const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-current" aria-hidden>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

export default function DesktopDiscordButton() {
  return (
    <a
      href="https://discord.gg/VHDedCcbGY"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join our Discord community"
      className="relative overflow-hidden flex items-center gap-2 h-[30px] px-4 rounded-full border border-[#5865F2]/45 text-[10px] font-bold tracking-wide select-none transition-all duration-[180ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-[1.06] active:scale-[0.94]"
      style={{
        background: 'linear-gradient(135deg, rgba(88,101,242,0.32) 0%, rgba(67,56,202,0.18) 100%)',
        color: '#c7d2fe',
        boxShadow: '0 0 14px rgba(88,101,242,0.22), inset 0 1px 0 rgba(255,255,255,0.09)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 28px rgba(88,101,242,0.55), 0 0 8px rgba(88,101,242,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(88,101,242,0.85)';
        (e.currentTarget as HTMLAnchorElement).style.color = '#e0e7ff';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 14px rgba(88,101,242,0.22), inset 0 1px 0 rgba(255,255,255,0.09)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(88,101,242,0.45)';
        (e.currentTarget as HTMLAnchorElement).style.color = '#c7d2fe';
      }}
    >
      {/* Shimmer sweep */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
        style={{ animation: 'shimmer 3s ease-in-out infinite' }}
      />
      {/* Glow pulse */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(88,101,242,0.18) 0%, transparent 70%)',
          animation: 'discord-glow-pulse 2.8s ease-in-out infinite',
        }}
      />
      <DiscordLogo />
      <span className="relative z-10">Join Discord</span>
    </a>
  );
}
