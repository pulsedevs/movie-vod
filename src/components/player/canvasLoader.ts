// Canvas VOD: segments the backend pushed to the image CDN (TikTok) arrive wrapped as a PNG — the piece
// is base64 in zlib-compressed iTXt chunks "payload-0001", "payload-0002"… (lemurplay-backend canvas.py
// wrap()). This hls.js fragment loader unwraps anything that starts with the PNG signature and hands
// everything else (our own /vod/ segments) through untouched, so a title mid-offload plays seamlessly.
// Byte-for-byte the same scheme as the matchora site player. Returns null where the browser cannot
// unwrap (no DecompressionStream, e.g. Safari < 16.4) — those keep playing from our own segments.
import Hls from 'hls.js';

const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
const dec = new TextDecoder('latin1');

export const isPng = (u: Uint8Array): boolean => {
  if (u.length < 9) return false;
  for (let i = 0; i < 8; i++) if (u[i] !== SIG[i]) return false;
  return true;
};

const inflate = (u: Uint8Array): Promise<ArrayBuffer> =>
  new Response(new Blob([u]).stream().pipeThrough(new (globalThis as any).DecompressionStream('deflate'))).arrayBuffer();

export async function unwrap(u: Uint8Array): Promise<ArrayBuffer> {
  const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  let off = 8;
  const parts: { i: number; c: number; d: Uint8Array }[] = [];
  while (off + 12 <= u.length) {
    const s = off + 8;
    const e = s + dv.getUint32(off);
    if (e + 4 > u.length) break;
    if (dec.decode(u.subarray(off + 4, s)) === 'iTXt') {
      const z = u.indexOf(0, s);
      if (z > s && z < e && dec.decode(u.subarray(s, z)).indexOf('payload-') === 0) {
        // keyword \0, compressed flag, method, language \0, translated keyword \0, text
        const p = u.indexOf(0, u.indexOf(0, z + 3) + 1);
        parts.push({ i: parseInt(dec.decode(u.subarray(s + 8, z)), 10), c: u[z + 1], d: u.subarray(p + 1, e) });
      }
    }
    off = e + 4;
  }
  if (!parts.length) throw new Error('canvas piece: no payload');
  parts.sort((a, b) => a.i - b.i);
  const bufs = await Promise.all(parts.map((x) => (x.c ? inflate(x.d) : Promise.resolve(x.d.buffer.slice(x.d.byteOffset, x.d.byteOffset + x.d.byteLength)))));
  let b64 = '';
  for (const buf of bufs) b64 += dec.decode(new Uint8Array(buf));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j++) out[j] = bin.charCodeAt(j);
  return out.buffer;
}

// A segment url the backend wrote as "<image-CDN url>#<our-box url>" (see vod.py _fb): the CDN copy to try
// first, and the same segment on our box to fall back to if the CDN fails (a banned/expired account). The
// '#' is a URL fragment, so the browser never sends it to the CDN. Returns the two, or {primary} with no
// fallback for a plain url.
export function splitFallback(url: string): { primary: string; fallback: string } {
  const h = (url || '').indexOf('#http');
  return h < 0 ? { primary: url, fallback: '' } : { primary: url.slice(0, h), fallback: url.slice(h + 1) };
}

export function makeCanvasLoader(): any | null {
  const Base = (Hls as any).DefaultConfig?.loader;
  if (!Base || typeof (globalThis as any).DecompressionStream === 'undefined') return null;
  return class CanvasLoader extends Base {
    load(ctx: any, cfg: any, cb: any) {
      const ok = cb.onSuccess;
      const { primary, fallback } = splitFallback(ctx.url);
      ctx.url = primary;                       // fetch the clean CDN url (never the '#…' part)
      let triedFallback = false;
      const done = (r: any, st: any, c: any, n: any) => {
        // CDN pieces are PNG-wrapped; our box serves the raw segment — isPng passes the raw one through.
        const u = r && r.data instanceof ArrayBuffer ? new Uint8Array(r.data) : null;
        if (!u || !isPng(u)) return ok(r, st, c, n);
        unwrap(u).then(
          (b) => { if (this.stats && this.stats.aborted) return; r.data = b; ok(r, st, c, n); },
          (e) => { if (this.stats && this.stats.aborted) return; cb.onError({ code: 0, text: String((e && e.message) || e) }, c, n, st); },
        );
      };
      const onErr = (e: any, c: any, n: any, st: any) => {
        // CDN segment failed (ban, expired link, blocked host): fetch the same piece from our box, once.
        if (fallback && !triedFallback && !(this.stats && this.stats.aborted)) {
          triedFallback = true;
          ctx.url = fallback;
          super.load(ctx, cfg, { ...cb, onSuccess: done, onError: cb.onError });
          return;
        }
        cb.onError(e, c, n, st);
      };
      super.load(ctx, cfg, { ...cb, onSuccess: done, onError: onErr });
    }
  };
}
