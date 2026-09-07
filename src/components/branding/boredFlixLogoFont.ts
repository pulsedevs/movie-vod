import { Outfit } from 'next/font/google';

export const boredFlixLogoFont = Outfit({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

/** Hero taglines, subtitles — same family as wordmark, lighter weight */
export const boredFlixTaglineFont = Outfit({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

/** Use on a wrapper so SVG <text> can resolve Outfit */
export const LOGO_FONT_FAMILY = boredFlixLogoFont.style.fontFamily;
