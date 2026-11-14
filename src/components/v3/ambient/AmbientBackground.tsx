'use client';

import { useEffect, useRef, useState } from 'react';
import { useAmbient } from './AmbientContext';
import { css, type Palette, type RGB } from './palette';

/*
 * Full-screen "aurora": slow, domain-warped noise waves in the current palette, drawn by a tiny
 * WebGL shader (no library). It renders at ~1/3 resolution (it is soft anyway) and ~30 fps, stops
 * while the tab is hidden, and draws a single still frame when the viewer prefers reduced motion.
 * Palette changes glide over ~1.5 s. No WebGL = blurred CSS blobs in the same colours.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 1.2;
  float t = uTime * 0.035;

  // Two rounds of domain warping = the flowing, wave-like bands.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t * 1.3)));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.45));
  float f = fbm(p + 2.6 * r);

  vec3 col = uBase;
  col = mix(col, uPrimary, smoothstep(0.22, 0.88, f) * 0.95);
  col = mix(col, uSecondary, smoothstep(0.3, 1.05, length(q)) * 0.7);
  col = mix(col, uAccent, smoothstep(0.6, 1.0, r.x * f * 1.6) * 0.38);

  // Light from the top, settling into the base towards the bottom, so text stays readable.
  float glow = smoothstep(1.3, 0.15, length((uv - vec2(0.55, 0.92)) * vec2(0.9, 1.5)));
  col *= mix(0.5, 1.08, glow);
  col = mix(col, uBase, smoothstep(0.62, 0.0, uv.y) * 0.5);

  // Dither: kills banding in the dark gradients.
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

const RES_SCALE = 0.34;
const FRAME_MS = 1000 / 30;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

const KEYS = ['base', 'primary', 'secondary', 'accent'] as const;

export default function AmbientBackground() {
  const { palette } = useAmbient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef<Palette>(palette);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    target.current = palette;
  }, [palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) {
      setWebgl(false);
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setWebgl(false);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setWebgl(false);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uCol = {
      base: gl.getUniformLocation(prog, 'uBase'),
      primary: gl.getUniformLocation(prog, 'uPrimary'),
      secondary: gl.getUniformLocation(prog, 'uSecondary'),
      accent: gl.getUniformLocation(prog, 'uAccent'),
    };

    // The colours on screen, eased towards target.current every frame.
    const cur: Record<(typeof KEYS)[number], RGB> = {
      base: [...target.current.base] as RGB,
      primary: [...target.current.primary] as RGB,
      secondary: [...target.current.secondary] as RGB,
      accent: [...target.current.accent] as RGB,
    };

    const resize = () => {
      const w = Math.max(1, Math.round(window.innerWidth * RES_SCALE));
      const h = Math.max(1, Math.round(window.innerHeight * RES_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const t0 = performance.now();
    let last = 0;
    let raf = 0;
    let drawn = false;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || now - last < FRAME_MS) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
      last = now;
      const k = 1 - Math.exp(-dt * 2.2);
      let moving = false;
      for (const key of KEYS) {
        const c = cur[key];
        const tc = target.current[key];
        for (let i = 0; i < 3; i++) {
          const d = tc[i] - c[i];
          if (Math.abs(d) > 0.0015) moving = true;
          c[i] += d * k;
        }
        gl.uniform3f(uCol[key], c[0], c[1], c[2]);
      }
      // Reduced motion: the waves hold still; only a palette change redraws.
      if (still.matches && !moving && drawn) return;
      drawn = true;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, still.matches ? 40 : (now - t0) / 1000 + 40);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: css(palette.base) }}>
      {webgl ? (
        <canvas ref={canvasRef} className="h-full w-full" />
      ) : (
        <div className="v3-blobs absolute inset-0">
          <span style={{ background: css(palette.primary) }} />
          <span style={{ background: css(palette.secondary) }} />
          <span style={{ background: css(palette.accent, 0.6) }} />
        </div>
      )}
    </div>
  );
}
