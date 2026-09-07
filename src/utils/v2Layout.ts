/**
 * V2 responsive layout - homepage + shell sizing (desktop first).
 *
 * lg (1024-1279): sidebar 64px + right panel 208px = ~752px center content
 * xl (1280+):     sidebar 64px + right panel 256px = ~960px center content
 *
 * Intermediate breakpoints (min-[1120px], min-[1200px]) smooth the
 * visual transition so elements scale progressively instead of jumping
 * all at once at the xl boundary.
 */

export const V2_SHELL = {
  sidebarWidthPx: 64,
  rightPanelWidthPx: 208,
  rightPanelWidthXlPx: 256,
} as const;

export const V2_SIDEBAR_VISIBLE_CLASS = 'hidden md:flex';
export const V2_RIGHT_PANEL_VISIBLE_CLASS = 'hidden md:flex';

/* Hero section chrome */

export const HERO_SECTION_CLASS =
  'relative md:rounded-b-3xl md:border-b md:border-white/[0.06] md:bg-[#080808] px-4 pb-8 pt-2 sm:px-6 sm:pb-14 sm:pt-8';

export const HERO_CONTAINER_CLASS = 'relative mx-auto w-full max-w-[1080px]';

export const HERO_LOGO_BLOCK_CLASS = 'max-w-[300px] xl:max-w-[340px]';

export const HERO_LOGO_SIZE_CLASS =
  'relative block h-9 w-auto sm:h-10 md:h-11 lg:h-10 xl:h-12 2xl:h-14';

export const HERO_TAGLINE_CLASS =
  'mt-1.5 text-[11px] font-normal leading-snug tracking-[0.04em] text-[#FAF7F2]/90 sm:mt-2 sm:text-xs';

export const HERO_SEARCH_SLOT_CLASS = 'relative mt-0 h-12 md:h-14 md:mt-6 xl:mt-8';

/* Search field widens smoothly across the lg→xl range */
export const HERO_SEARCH_WIDTH_CLASS =
  'w-[min(92vw,340px)] min-[1120px]:w-[min(92vw,365px)] xl:w-[min(92vw,400px)]';

export const HERO_SEARCH_DROPDOWN_CLASS =
  'max-h-[min(62vh,520px)] min-h-[220px] overflow-y-auto scrollbar-hide p-3';

/* CTA + stats band */

/* Band min-height grows in three steps so the fans always have room */
export const HERO_POSTER_BAND_CLASS =
  'relative mt-0 sm:mt-6 md:mt-8 min-[860px]:min-h-[200px] lg:min-h-[210px] min-[1120px]:min-h-[240px] min-[1120px]:mt-11 min-[1200px]:min-h-[270px] xl:mt-12 xl:min-h-[300px]';

/* Center block widens progressively instead of jumping 260→400px at xl */
export const HERO_CENTER_BLOCK_CLASS =
  'relative z-10 mx-auto max-w-[260px] space-y-5 px-2 text-center sm:max-w-[280px] sm:space-y-6 min-[1120px]:max-w-[330px] min-[1120px]:space-y-7 min-[1120px]:px-4 min-[1200px]:max-w-[380px] xl:max-w-[420px] xl:space-y-8 xl:px-8';

export const HERO_CTA_ROW_CLASS =
  'flex flex-wrap items-center justify-center gap-2.5 xl:gap-3';

/* CTA buttons grow in two steps */
export const HERO_CTA_BUTTON_CLASS =
  'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold transition-colors min-[1120px]:px-4 min-[1120px]:py-1.5 min-[1120px]:text-[11px] xl:px-5 xl:py-2 xl:text-sm';

export const HERO_STATS_SECTION_CLASS =
  'space-y-4 sm:space-y-5 xl:space-y-6';

export const HERO_STATS_GRID_CLASS =
  'grid grid-cols-3 gap-x-2.5 gap-y-2 text-center sm:gap-x-3 sm:gap-y-2.5 xl:gap-x-4 xl:gap-y-3';

export const HERO_STAT_CARD_CLASS =
  'rounded-lg border border-white/10 bg-white/[0.02] px-1.5 py-2 xl:px-2.5 xl:py-2.5';

export const HERO_STAT_VALUE_CLASS =
  'text-[11px] font-bold leading-tight xl:text-sm 2xl:text-base';

export const HERO_STAT_LABEL_CLASS =
  'mt-0.5 text-[7px] uppercase tracking-wide text-zinc-500 xl:text-[8px] 2xl:text-[9px]';

export const HERO_WATCHING_BADGE_WRAP_CLASS =
  'flex justify-center pt-1 sm:pt-1.5 xl:pt-2';

export const HERO_WATCHING_BADGE_CLASS =
  'inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[11px] sm:gap-3 sm:px-4 sm:py-2 sm:text-xs xl:px-5 xl:py-2.5 xl:text-sm';

/* Platform pills */

/* Pills section max-width grows progressively */
export const HERO_PILLS_SECTION_CLASS =
  'relative z-10 mx-auto mt-8 max-w-[min(100%,280px)] text-center sm:mt-10 min-[1120px]:max-w-[min(100%,400px)] xl:mt-12 xl:max-w-[520px]';

export const HERO_PILLS_ROW_CLASS =
  'flex flex-wrap items-center justify-center gap-2 xl:gap-3';

export const HERO_PILL_CLASS =
  'rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-zinc-300 xl:px-3 xl:py-1 xl:text-xs';

/* Poster fans */

export const HERO_POSTER_W = 136;
export const HERO_POSTER_H = 204;

export const HERO_POSTER_VISIBLE_CLASS = 'hidden lg:block';

export const HERO_POSTER_FAN_VISIBILITY_CLASS = 'hidden lg:flex';

export const HERO_POSTER_FAN_BOX_CLASS = 'h-[243px] w-[171px]';

/**
 * Fan scale grows in 4 steps so the 72%→100% jump is never visible:
 *   lg(1024): 0.77 → 1120px: 0.85 → 1200px: 0.93 → xl(1280): 1.00
 */
export const HERO_POSTER_FAN_SCALE_CLASS =
  'origin-center lg:scale-[0.77] min-[1120px]:scale-[0.85] min-[1200px]:scale-[0.93] xl:scale-100';

/* Vertical anchor: fans ride up slightly as they grow */
export const HERO_POSTER_TOP_CLASS =
  'top-[calc(50%-80px)] min-[1200px]:top-[calc(50%-88px)] xl:top-[calc(50%-96px)]';

/**
 * Horizontal positions use px (not rem) so they're root-font-size independent.
 * Values are linearly interpolated between lg and xl endpoints:
 *
 *   Viewport  Content  Container  50%    Left-fan-left  Right-fan-left
 *   1024px    752px    704px      352px  0px            528px
 *   1120px    848px    800px      400px  33px           600px
 *   1200px    928px    880px      440px  59px           655px
 *   1280px    960px    912px      456px  64px           688px
 *   1536px   1216px   1168px→1080 540px  124px          796px
 */
export const HERO_POSTER_LEFT_CLASS =
  'lg:left-[calc(50%-352px)] min-[1120px]:left-[calc(50%-367px)] min-[1200px]:left-[calc(50%-381px)] xl:left-[calc(50%-392px)] 2xl:left-[calc(50%-416px)]';

export const HERO_POSTER_RIGHT_CLASS =
  'lg:left-[calc(50%+176px)] min-[1120px]:left-[calc(50%+200px)] min-[1200px]:left-[calc(50%+215px)] xl:left-[calc(50%+232px)] 2xl:left-[calc(50%+256px)]';
