/** Grid tuned for the v2 middle column — dense posters via auto-fill.
 *  ~3 cols on mobile, ~6 at md/lg, ~8 at xl, more at 2xl. */
export const BROWSE_V2_GRID_CLASS =
  'grid w-full gap-2 sm:gap-2.5 grid-cols-3 sm:[grid-template-columns:repeat(auto-fill,minmax(108px,1fr))] xl:[grid-template-columns:repeat(auto-fill,minmax(118px,1fr))]';

/** v3 browse pages: posters about the size of the home rows' (~136px on phones, ~200px on desktop),
 *  with room for their hover lift. */
export const BROWSE_V3_GRID_CLASS =
  'grid w-full gap-x-3 gap-y-5 pt-2 grid-cols-3 sm:[grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] sm:gap-x-4 md:[grid-template-columns:repeat(auto-fill,minmax(170px,1fr))] md:gap-x-5 md:gap-y-6 xl:[grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]';

/** Tighter grid for the detail-page right panel (~256px). */
export const DETAIL_PANEL_GRID_CLASS =
  'grid w-full gap-1 [grid-template-columns:repeat(auto-fill,minmax(72px,1fr))]';

/** Hero search dropdown — compact posters (5–6 per row). */
export const SEARCH_RESULTS_GRID_CLASS =
  'grid w-full grid-cols-4 gap-2 sm:grid-cols-6';
