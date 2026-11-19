import type { AccentKey, AuroraPreset } from './tokens.ts';
import { accents, DEFAULT_AURORA_PRESET } from './tokens.ts';

/** HSL hue (0–359) of a #RRGGBB colour, or null when it is too grey to have one. */
export function hexHue(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.08) return null;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360) % 360;
}

/**
 * How an accent swatch tints Aurora (Kevin, 2026-11-19: "Map accents to Aurora colors").
 * Champagne is the default, so it keeps the default preset (Midnight / Grove). Mono maps to the
 * neutral Chrome preset. Every other accent sets the custom wheel to the accent's own hue.
 */
export type AuroraTint = { preset: Exclude<AuroraPreset, 'custom'> } | { hue: number };

export function auroraTintForAccent(key: AccentKey): AuroraTint {
  if (key === 'champagne') return { preset: DEFAULT_AURORA_PRESET as Exclude<AuroraPreset, 'custom'> };
  if (key === 'mono') return { preset: 'chrome' };
  const hue = hexHue(accents[key].modes.dark.accent);
  return hue == null ? { preset: 'chrome' } : { hue };
}
