import { ACCENT_KEYS, DEFAULT_ACCENT, type AccentKey } from '../theme/tokens.ts';

/**
 * Preferences (Setup step 8): units and accent. Pure.
 * Accent ids on the wire (server allowlist) map to the theme's AccentKey; hex values live only in theme/tokens.
 */
export const UNITS = ['lb', 'kg'] as const;
export type Units = (typeof UNITS)[number];
export const DISTANCES = ['mi', 'km'] as const;
export type Distance = (typeof DISTANCES)[number];

export const DEFAULT_UNITS: Units = 'lb';
export const DEFAULT_DISTANCE: Distance = 'mi';

/** Wire id -> theme key. Keep in the same order as ACCENT_KEYS. */
export const ACCENT_ID_TO_KEY = {
  champagne: 'champagne',
  volt: 'volt',
  signal_orange: 'orange',
  electric_blue: 'blue',
  hot_red: 'red',
  ice_cyan: 'cyan',
  mono: 'mono',
} as const satisfies Record<string, AccentKey>;
export type AccentId = keyof typeof ACCENT_ID_TO_KEY;
export const ACCENT_IDS = Object.keys(ACCENT_ID_TO_KEY) as AccentId[];
export const DEFAULT_ACCENT_ID: AccentId = 'champagne';

// Guard against drift: every theme accent must have a wire id.
const mapped = new Set<string>(Object.values(ACCENT_ID_TO_KEY));
if (ACCENT_KEYS.some((k) => !mapped.has(k)) || ACCENT_ID_TO_KEY[DEFAULT_ACCENT_ID] !== DEFAULT_ACCENT) {
  throw new Error('prefs: accent ids out of sync with theme tokens');
}

const HEX = /^#[0-9A-Fa-f]{6}$/;
export const isAccentValue = (v: unknown): v is string => typeof v === 'string' && (ACCENT_IDS.includes(v as AccentId) || HEX.test(v));
export const accentKeyFor = (v: string): AccentKey | null => (ACCENT_IDS.includes(v as AccentId) ? ACCENT_ID_TO_KEY[v as AccentId] : null);

export type Prefs = { units: Units; distance: Distance; accent: string };
export const defaultPrefs = (): Prefs => ({ units: DEFAULT_UNITS, distance: DEFAULT_DISTANCE, accent: DEFAULT_ACCENT_ID });

/** Normalise a custom colour to upper-case #RRGGBB; ids pass through; anything else falls back to the default. */
export function cleanAccent(v: string): string {
  if (ACCENT_IDS.includes(v as AccentId)) return v;
  return HEX.test(v) ? v.toUpperCase() : DEFAULT_ACCENT_ID;
}
