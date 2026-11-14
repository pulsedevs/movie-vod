/** Colours for the ambient background, as 0..1 RGB (what the shader takes). */
export type RGB = [number, number, number];

export interface Palette {
  /** Near-black floor the waves sit on. */
  base: RGB;
  /** The dominant colour of the image - the big slow waves. */
  primary: RGB;
  /** A second colour, a different hue where the image has one. */
  secondary: RGB;
  /** A brighter highlight, used sparingly. */
  accent: RGB;
}

/** Before any film has set the mood: deep indigo and teal. */
export const DEFAULT_PALETTE: Palette = {
  base: [0.02, 0.025, 0.045],
  primary: [0.16, 0.14, 0.34],
  secondary: [0.05, 0.22, 0.27],
  accent: [0.42, 0.3, 0.62],
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l, l, l];
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
}

/** Same hue, set to a given lightness, saturation clamped into a pleasant range. */
function tone(c: RGB, l: number, sMin = 0.35, sMax = 0.85): RGB {
  const [h, s] = rgbToHsl(c[0], c[1], c[2]);
  return hslToRgb(h, Math.min(sMax, Math.max(sMin, s)), l);
}

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
};

/**
 * The image's dominant colours, turned into a dark, rich palette. The image is drawn tiny
 * (64x36), pixels are binned by hue (24 bins) weighted by how colourful they are, and the two
 * heaviest bins far enough apart in hue become primary and secondary. Needs a CORS-readable
 * image (image.tmdb.org sends Access-Control-Allow-Origin: *).
 */
export function extractPalette(url: string): Promise<Palette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const w = 64;
        const h = 36;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0, w, h);
        const px = ctx.getImageData(0, 0, w, h).data;

        const BINS = 24;
        const bins = Array.from({ length: BINS }, () => ({ w: 0, r: 0, g: 0, b: 0, s: 0 }));
        let lumSum = 0;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i] / 255;
          const g = px[i + 1] / 255;
          const b = px[i + 2] / 255;
          const [hh, s, l] = rgbToHsl(r, g, b);
          lumSum += l;
          if (l < 0.07 || l > 0.94) continue; // black bars and blown highlights carry no mood
          const weight = 0.05 + s * (1 - Math.abs(l - 0.5) * 1.4);
          if (weight <= 0) continue;
          const bin = bins[Math.min(BINS - 1, Math.floor(hh * BINS))];
          bin.w += weight;
          bin.r += r * weight;
          bin.g += g * weight;
          bin.b += b * weight;
          bin.s += s * weight;
        }

        const ranked = bins
          .map((bin, i) => ({
            hue: (i + 0.5) / BINS,
            w: bin.w,
            sat: bin.w ? bin.s / bin.w : 0,
            c: (bin.w ? [bin.r / bin.w, bin.g / bin.w, bin.b / bin.w] : [0, 0, 0]) as RGB,
          }))
          .filter((x) => x.w > 0)
          .sort((a, b) => b.w - a.w);

        if (!ranked.length) {
          resolve(DEFAULT_PALETTE);
          return;
        }
        const first = ranked[0];
        const second = ranked.find((x) => hueGap(x.hue, first.hue) > 0.1 && x.w > first.w * 0.12);
        const accentSrc =
          ranked
            .filter((x) => x !== first && x.w > first.w * 0.05)
            .sort((a, b) => b.sat - a.sat)[0] ?? first;

        // A dark image keeps a darker mood; a bright one gets a little more light.
        const lift = Math.min(0.06, Math.max(-0.04, (lumSum / (px.length / 4) - 0.3) * 0.2));
        const primary = tone(first.c, 0.3 + lift);
        const secondary = second
          ? tone(second.c, 0.26 + lift)
          : hslToRgb((rgbToHsl(...first.c)[0] + 0.08) % 1, 0.5, 0.2 + lift);
        const accent = tone(accentSrc.c, 0.5, 0.5, 0.95);
        const base = tone(first.c, 0.035, 0.3, 0.6);
        resolve({ base, primary, secondary, accent });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** CSS rgb() for a palette colour (the no-WebGL fallback). */
export function css(c: RGB, alpha = 1): string {
  const [r, g, b] = c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
