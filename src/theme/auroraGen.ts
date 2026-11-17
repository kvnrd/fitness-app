/** Port of aurora-v4/src/gen.py: hue → OKLCH palette with sRGB clamp and AA lightness walks. */
import type { ColorScheme, Metal } from './tokens.ts';

export type AuroraGenScores = {
  text: number;
  mut: number;
  ink: number;
  cta: number;
  grad: number;
};

export type AuroraGenPalette = {
  page: string;
  bg: string;
  text: string;
  mut: string;
  faint: string;
  glass: string;
  glassBorder: string;
  glows: Metal;
  glowAlpha: number;
  accentMetal: Metal;
  accent: string;
  accentText: string;
  accentInk: string;
  track: string;
  rowOn: string;
  inputFill: string;
  tabOn: string;
  tabOnText: string;
  grain: number;
  grainBlend: 'screen' | 'multiply';
  scores: AuroraGenScores;
};

function enc(x: number): number {
  const y = Math.max(0, Math.min(1, x));
  return y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055;
}

/** Python 3 round-half-even, so generated hex matches gen.py. */
function pyRound(n: number): number {
  const f = Math.floor(n);
  const frac = n - f;
  if (frac < 0.5) return f;
  if (frac > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

function oklchRgb(L: number, C: number, h: number): [number, number, number] {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, bb];
}

function inGamut(rgb: [number, number, number]): boolean {
  return rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);
}

function okHex(L: number, C: number, h: number): string {
  let c = C;
  while (c > 0 && !inGamut(oklchRgb(L, c, h % 360))) c -= 0.004;
  const [r, g, b] = oklchRgb(L, Math.max(c, 0), h % 360);
  const ch = (v: number) => {
    const n = Math.max(0, Math.min(255, pyRound(enc(v) * 255)));
    return n.toString(16).toUpperCase().padStart(2, '0');
  };
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

export function hx(h: string): [number, number, number] {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function lum(c: [number, number, number]): number {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = c;
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [lum(hx(a)), lum(hx(b))].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

function over(fg: string, a: number, bg: string): string {
  const f = hx(fg);
  const b = hx(bg);
  const ch = (i: number) => Math.max(0, Math.min(255, pyRound(a * f[i] + (1 - a) * b[i])));
  return `#${[0, 1, 2].map((i) => ch(i).toString(16).toUpperCase().padStart(2, '0')).join('')}`;
}

function grounds(bg: string, blobs: string[], blobA: number, glassRgb: string, glassA: number): string[] {
  const gs = [bg, ...blobs.map((c) => over(c, blobA * 0.6, bg))];
  return [...gs, ...gs.map((g) => over(glassRgb, glassA, g))];
}

function clampL(L0: number, C: number, h: number, step: number, pred: (c: string) => boolean): [string, number] {
  let L = L0;
  let c = okHex(L, C, h);
  for (let i = 0; i < 100; i++) {
    c = okHex(L, C, h);
    if (pred(c)) return [c, Math.round(L * 1000) / 1000];
    L = Math.min(Math.max(L + step, 0), 1);
  }
  return [c, Math.round(L * 1000) / 1000];
}

/** Custom palette from a hue in 0–359. Matches aurora-v4/src/gen.py `palette()`. */
export function generateAuroraPalette(hue: number, scheme: ColorScheme = 'dark'): AuroraGenPalette {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const d = scheme === 'dark';
  let bg: string;
  let page: string;
  let text: string;
  let blobs: Metal;
  let blobA: number;
  let G: string[];
  let mut: string;
  let ink: string;
  let grad: Metal;
  let accent: string;
  let at: string;
  let glass: string;
  let gb: string;
  let rowOn: string;
  let inp: string;
  let track: string;
  let tabOn: string;
  let tabOnText: string;
  let grain: number;
  let blend: 'screen' | 'multiply';

  if (d) {
    bg = okHex(0.15, 0.03, h);
    page = okHex(0.11, 0.02, h);
    text = okHex(0.97, 0.012, h);
    blobs = [okHex(0.62, 0.17, h - 35), okHex(0.5, 0.16, h + 25), okHex(0.68, 0.14, h + 60)];
    blobA = 0.42;
    G = grounds(bg, [...blobs], blobA, '#FFFFFF', 0.06);
    const passes = (c: string, t = 4.5) => Math.min(...G.map((g) => contrastRatio(c, g))) >= t;
    [mut] = clampL(0.76, 0.03, h, 0.01, passes);
    [ink] = clampL(0.8, 0.12, h, 0.01, passes);
    grad = [okHex(0.88, 0.09, h - 30), okHex(0.76, 0.15, h), okHex(0.7, 0.16, h + 35)];
    [accent] = clampL(0.76, 0.14, h, 0.01, (c) => contrastRatio(c, '#000000') >= 4.5);
    at = '#000000';
    glass = 'rgba(255,255,255,0.06)';
    gb = 'rgba(255,255,255,0.13)';
    rowOn = okHex(0.22, 0.04, h);
    inp = 'rgba(255,255,255,0.10)';
    track = 'rgba(255,255,255,0.12)';
    tabOn = text;
    tabOnText = bg;
    grain = 0.066;
    blend = 'screen';
  } else {
    bg = okHex(0.95, 0.015, h);
    page = okHex(0.89, 0.02, h);
    text = okHex(0.2, 0.02, h);
    blobs = [okHex(0.8, 0.1, h - 35), okHex(0.86, 0.09, h + 25), okHex(0.82, 0.08, h + 60)];
    blobA = 0.48;
    G = grounds(bg, [...blobs], blobA, '#FFFFFF', 0.62);
    const passes = (c: string, t = 4.5) => Math.min(...G.map((g) => contrastRatio(c, g))) >= t;
    [mut] = clampL(0.5, 0.03, h, -0.01, passes);
    [ink] = clampL(0.5, 0.12, h, -0.01, passes);
    grad = (
      [
        [0.52, 0.12, -30],
        [0.48, 0.13, 0],
        [0.45, 0.12, 35],
      ] as const
    ).map(([L, C, dh]) => clampL(L, C, h + dh, -0.01, (c) => contrastRatio(c, bg) >= 3.2)[0]) as unknown as Metal;
    [accent] = clampL(0.5, 0.12, h, -0.01, (c) => contrastRatio(c, '#FFFFFF') >= 4.5);
    at = '#FFFFFF';
    glass = 'rgba(255,255,255,0.62)';
    gb = 'rgba(255,255,255,0.9)';
    rowOn = '#FFFFFF';
    inp = 'rgba(0,0,0,0.06)';
    track = 'rgba(0,0,0,0.10)';
    tabOn = text;
    tabOnText = '#FFFFFF';
    grain = 0.045;
    blend = 'multiply';
  }

  // gen.py aliases faint to mut. Named Berry/Chrome light presets use a walked 3:1 faint instead.
  return {
    page,
    bg,
    text,
    mut,
    faint: mut,
    glass,
    glassBorder: gb,
    glows: blobs,
    glowAlpha: blobA,
    accentMetal: grad,
    accent,
    accentText: at,
    accentInk: ink,
    track,
    rowOn,
    inputFill: inp,
    tabOn,
    tabOnText,
    grain,
    grainBlend: blend,
    scores: {
      text: Math.min(...G.map((g) => contrastRatio(text, g))),
      mut: Math.min(...G.map((g) => contrastRatio(mut, g))),
      ink: Math.min(...G.map((g) => contrastRatio(ink, g))),
      cta: contrastRatio(accent, at),
      grad: Math.min(...grad.map((c) => contrastRatio(c, bg))),
    },
  };
}

export function clampHue(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 0 || n > 359) return null;
  return n;
}
