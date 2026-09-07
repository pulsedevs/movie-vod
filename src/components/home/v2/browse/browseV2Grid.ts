/** Grid tuned for the v2 middle column — dense posters via auto-fill.
 *  ~3 cols on mobile, ~6 at md/lg, ~8 at xl, more at 2xl. */
export const BROWSE_V2_GRID_CLASS =
  'grid w-full gap-2 sm:gap-2.5 grid-cols-3 sm:[grid-template-columns:repeat(auto-fill,minmax(108px,1fr))] xl:[grid-template-columns:repeat(auto-fill,minmax(118px,1fr))]';

/** Tighter grid for the detail-page right panel (~256px). */
export const DETAIL_PANEL_GRID_CLASS =
  'grid w-full gap-1 [grid-template-columns:repeat(auto-fill,minmax(72px,1fr))]';

/** Hero search dropdown — compact posters (5–6 per row). */
export const SEARCH_RESULTS_GRID_CLASS =
  'grid w-full grid-cols-4 gap-2 sm:grid-cols-6';
