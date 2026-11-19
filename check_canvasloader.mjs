// Offline check of the Canvas VOD fragment loader: what the backend wraps (lemurplay-backend canvas.py
// wrap) is what the player unwraps, byte for byte; a non-PNG segment is handed through untouched; a broken
// PNG is an error, not a hang. The backend does the wrapping (Python), so the fixtures come from it.
//   node check_canvasloader.mjs
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '..', 'lemurplay-backend');

// Compile the real TS loader to JS so we test the shipped file, not a copy.
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-'));
let r = spawnSync('npx', ['tsc', 'src/components/player/canvasLoader.ts', '--outDir', out,
  '--module', 'esnext', '--target', 'es2020', '--moduleResolution', 'bundler', '--skipLibCheck'],
  { cwd: here, encoding: 'utf8', shell: true });
const mod = path.join(out, 'canvasLoader.js');
if (!fs.existsSync(mod)) { console.error('tsc did not emit the loader\n', r.stdout, r.stderr); process.exit(1); }
// the emitted file imports hls.js (for makeCanvasLoader); unwrap/isPng do not need it, but the import must
// resolve from node — point it at the installed package.
const hlsUrl = 'file:///' + path.join(here, 'node_modules', 'hls.js', 'dist', 'hls.mjs').replace(/\\/g, '/');
let js = fs.readFileSync(mod, 'utf8').replace(/from ['"]hls\.js['"]/g, `from '${hlsUrl}'`);
fs.writeFileSync(mod, js);
const { unwrap, isPng, makeCanvasLoader, splitFallback } = await import('file://' + mod.replace(/\\/g, '/'));

let fails = 0;
const expect = (what, ok, got) => { if (!ok) fails++; console.log(`${ok ? 'ok ' : 'BAD'} ${what}${ok ? '' : ': ' + JSON.stringify(got)}`); };

function wrap(buf) {
  // call the backend's canvas.wrap on these exact bytes, via stdin -> stdout (base64 both ways)
  const py = 'import sys,base64;sys.path.insert(0,sys.argv[1]);import canvas;' +
    'raw=base64.b64decode(sys.stdin.buffer.read());sys.stdout.buffer.write(base64.b64encode(canvas.wrap(raw)))';
  const res = spawnSync('python', ['-c', py, backend], { input: Buffer.from(buf).toString('base64'), encoding: 'utf8', maxBuffer: 64 << 20 });
  if (res.status !== 0) { console.error('wrap failed', res.stderr); process.exit(1); }
  return new Uint8Array(Buffer.from(res.stdout, 'base64'));
}

expect('loader builds (DecompressionStream present in node)', typeof makeCanvasLoader() === 'function');

for (const n of [1, 100, 1024, 250000, 3_000_000]) {
  const payload = new Uint8Array(n);
  for (let i = 0; i < n; i++) payload[i] = (i * 73 + 11) & 0xff;
  const png = wrap(payload);
  expect(`wrapped ${n}B looks like a PNG`, isPng(png), Array.from(png.slice(0, 8)));
  const back = new Uint8Array(await unwrap(png));
  let same = back.length === n;
  for (let i = 0; same && i < n; i++) same = back[i] === payload[i];
  expect(`round-trips ${n}B exactly`, same, { got: back.length, want: n });
}

// a real TS segment (not a PNG) must pass straight through isPng=false
const ts = new Uint8Array([0x47, 0x40, 0x11, 0x10, 1, 2, 3, 4, 5, 6]);
expect('a .ts segment is not treated as a piece', !isPng(ts));

// a broken PNG rejects instead of hanging
let threw = false;
try { await unwrap(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])); } catch { threw = true; }
expect('a PNG with no payload chunks rejects', threw);

// the '#' fallback split (backend wrote "<cdn url>#<box url>")
const cdn = 'https://p16-ad-site-sign-sg.tiktokcdn.com/x~tplv.image?lk3s=a&x-expires=1&x-signature=b%2Fc';
const box = 'https://cdn2.gmmds.space/vod/v/PID/src.mp4/seg-5-f1-v1.m4s';
let s = splitFallback(cdn + '#' + box);
expect('splitFallback: primary is the CDN url, clean', s.primary === cdn, s.primary);
expect('splitFallback: fallback is the box url', s.fallback === box, s.fallback);
s = splitFallback(box);
expect('splitFallback: a plain url has no fallback', s.primary === box && s.fallback === '', s);
s = splitFallback(cdn);
expect('splitFallback: a CDN url with query but no fallback is left whole', s.primary === cdn && s.fallback === '', s);

console.log(fails ? `${fails} FAILED` : 'all good');
process.exit(fails ? 1 : 0);
