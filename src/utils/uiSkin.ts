/**
 * The cinematic v3 UI: a glass pill nav on top, full-bleed pages, and a slowly moving "aurora"
 * background that takes its colours from the film on screen. It runs on the v2 routes and data,
 * so it needs both NEXT_PUBLIC_HOME_LAYOUT=v2 and NEXT_PUBLIC_UI=v3. Anything else = the v2 shell.
 */
export function isV3(): boolean {
  return process.env.NEXT_PUBLIC_UI === 'v3' && process.env.NEXT_PUBLIC_HOME_LAYOUT === 'v2';
}
