import type { TextStyle } from 'react-native';

/**
 * v2 theme tokens — Carbon / Concrete neutrals, 7 accents, Brushed Gold for PRs.
 * Pure data + types. The React provider lives elsewhere; `resolveColors` is in ./resolve.
 * Source of truth: theme_accents.json (all accent roles are WCAG AA in both modes).
 */

// ───────────────────────── Modes & keys ─────────────────────────

export type ThemeMode = 'system' | 'dark' | 'light';
export type ColorScheme = 'dark' | 'light';

export const ACCENT_KEYS = ['champagne', 'volt', 'orange', 'blue', 'red', 'cyan', 'mono'] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

export const DEFAULT_MODE: ThemeMode = 'system';
export const DEFAULT_ACCENT: AccentKey = 'champagne';

// ───────────────────────── Neutrals ─────────────────────────

export type Neutrals = {
  bg: string;
  surfaceSunken: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  heat: string;
  danger: string;
};

export type Effects = {
  grainOpacity: number;
  glowAlpha: number;
};

export const neutrals: Record<ColorScheme, Neutrals> = {
  // Carbon
  dark: {
    bg: '#070708',
    surfaceSunken: '#0C0C0E',
    surface: '#131416',
    surfaceRaised: '#1C1D20',
    border: '#25272B',
    borderStrong: '#3A3D42',
    text: '#F4F5F6',
    textSecondary: '#B4B7BC',
    textMuted: '#8D9198',
    placeholder: '#676B72',
    heat: '#FF7A1A',
    danger: '#FF5A4E',
  },
  // Concrete
  light: {
    bg: '#E9EAEC',
    surfaceSunken: '#DDDFE2',
    surface: '#F7F7F8',
    surfaceRaised: '#ECEDEF',
    border: '#D6D8DC',
    borderStrong: '#B9BCC2',
    text: '#0D0E10',
    textSecondary: '#43464C',
    textMuted: '#575B62',
    placeholder: '#8A8E95',
    heat: '#AB4101',
    danger: '#BB2A24',
  },
};

export const effects: Record<ColorScheme, Effects> = {
  dark: { grainOpacity: 0.06, glowAlpha: 0.22 },
  light: { grainOpacity: 0.05, glowAlpha: 0.2 },
};

// ───────────────────────── Background (Phase 1b: glow + grain + vignette) ─────────────────────────

export type BgStrength = 'subtle' | 'medium';
export const DEFAULT_BG_STRENGTH: BgStrength = 'medium';

type Stop = { color: string; at: number };
type Vignette = { rx: number; ry: number; cx: number; cy: number; stops: Stop[] };

/** `--v2-bg-*` tokens. Glow colour is composed from the accent fill + alpha (see `composeGlow`). */
export const background = {
  glowAlpha: {
    subtle: { dark: 0.12, light: 0.1 },
    medium: { dark: 0.24, light: 0.20 },
  } satisfies Record<BgStrength, Record<ColorScheme, number>>,
  glow: {
    layerTop: -160,
    layerHeight: 520,
    insetX: -80,
    radiusX: 0.5,
    radiusY: 0.5,
    atX: 0.3,
    atY: 0.45,
    stop: 0.7,
  },
  grain: {
    opacity: { dark: 0.066, light: 0.045 } satisfies Record<ColorScheme, number>,
    /** Fallback when mixBlendMode is unreliable: no blend, slightly lower opacity. */
    opacityNoBlend: { dark: 0.04, light: 0.03 } satisfies Record<ColorScheme, number>,
    blend: { dark: 'screen', light: 'multiply' } as Record<ColorScheme, 'screen' | 'multiply'>,
    /** Visual tile size, matches Paper `background-size: 180px`. */
    tile: 180,
    /** PNG resolution (assets/bg-grain-256.png). */
    assetSize: 256,
  },
  vignette: {
    dark: [
      { rx: 1.2, ry: 0.8, cx: 0.5, cy: 0, stops: [{ color: 'rgba(255,255,255,0.035)', at: 0 }, { color: 'rgba(255,255,255,0)', at: 0.55 }] },
      { rx: 1.4, ry: 1.0, cx: 0.5, cy: 0.4, stops: [{ color: 'rgba(0,0,0,0)', at: 0.6 }, { color: 'rgba(0,0,0,0.55)', at: 1 }] },
    ],
    light: [
      { rx: 1.2, ry: 0.8, cx: 0.5, cy: 0, stops: [{ color: 'rgba(255,255,255,0.7)', at: 0 }, { color: 'rgba(255,255,255,0)', at: 0.6 }] },
      { rx: 1.4, ry: 1.0, cx: 0.5, cy: 0.4, stops: [{ color: 'rgba(30,34,40,0)', at: 0.65 }, { color: 'rgba(30,34,40,0.10)', at: 1 }] },
    ],
  } as Record<ColorScheme, Vignette[]>,
};

/** Compose the glow colour from an accent hex (#RRGGBB) and alpha, e.g. rgba(217,192,138,0.22). */
export function composeGlow(accentHex: string, alpha: number): string {
  const h = accentHex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ───────────────────────── Accents ─────────────────────────

export type Metal = readonly [string, string, string];

/** Per-mode accent roles. `heat`/`danger` are only set where the accent overrides the neutrals. */
export type AccentRoles = {
  accent: string; // solid fill
  accentText: string; // label on a solid accent fill
  accentInk: string; // accent-coloured text / icons on surfaces
  accentKeyline: string | null; // hairline/outline (light mode "outline" strategy)
  accentLine: string; // progress bars, rules, focus rings
  accentSoft: string; // tinted background
  accentMetal?: Metal;
  heat?: string;
  danger?: string;
};

export type AccentDefinition = {
  key: AccentKey;
  name: string;
  seed: string | null;
  modes: Record<ColorScheme, AccentRoles>;
};

const champagneMetal: Metal = ['#E7D4AC', '#D9C08A', '#C9B07B'];

export const accents: Record<AccentKey, AccentDefinition> = {
  champagne: {
    key: 'champagne',
    name: 'Champagne',
    seed: '#D9C08A',
    modes: {
      dark: {
        accent: '#D9C08A',
        accentText: '#000000',
        accentInk: '#D9C08A',
        accentKeyline: null,
        accentLine: '#D9C08A',
        accentSoft: 'rgba(217,192,138,0.16)',
        accentMetal: champagneMetal,
      },
      light: {
        accent: '#D9C08A',
        accentText: '#000000',
        accentInk: '#77602C',
        accentKeyline: '#77602C',
        accentLine: '#77602C',
        accentSoft: 'rgba(217,192,138,0.30)',
        accentMetal: champagneMetal,
      },
    },
  },
  volt: {
    key: 'volt',
    name: 'Volt',
    seed: '#C8FF3D',
    modes: {
      dark: {
        accent: '#C8FF3D',
        accentText: '#000000',
        accentInk: '#C8FF3D',
        accentKeyline: null,
        accentLine: '#C8FF3D',
        accentSoft: 'rgba(200,255,61,0.16)',
      },
      light: {
        accent: '#C8FF3D',
        accentText: '#000000',
        accentInk: '#516B00',
        accentKeyline: '#516B00',
        accentLine: '#516B00',
        accentSoft: 'rgba(81,107,0,0.12)',
      },
    },
  },
  orange: {
    key: 'orange',
    name: 'Signal Orange',
    seed: '#FF6B1A',
    modes: {
      dark: {
        accent: '#FF6B1A',
        accentText: '#000000',
        accentInk: '#FF6B1A',
        accentKeyline: null,
        accentLine: '#FF6B1A',
        accentSoft: 'rgba(255,107,26,0.16)',
        heat: '#CF9C00',
        danger: '#D665DE',
      },
      light: {
        accent: '#FF6B1A',
        accentText: '#000000',
        accentInk: '#AB4100',
        accentKeyline: '#AB4100',
        accentLine: '#AB4100',
        accentSoft: 'rgba(171,65,0,0.12)',
        heat: '#7E5D00',
        danger: '#9A38A1',
      },
    },
  },
  blue: {
    key: 'blue',
    name: 'Electric Blue',
    seed: '#4D94FF',
    modes: {
      dark: {
        accent: '#4D94FF',
        accentText: '#000000',
        accentInk: '#4D94FF',
        accentKeyline: null,
        accentLine: '#4D94FF',
        accentSoft: 'rgba(77,148,255,0.16)',
      },
      light: {
        accent: '#4D94FF',
        accentText: '#000000',
        accentInk: '#165FC5',
        accentKeyline: '#165FC5',
        accentLine: '#165FC5',
        accentSoft: 'rgba(22,95,197,0.12)',
      },
    },
  },
  red: {
    key: 'red',
    name: 'Hot Red',
    seed: '#FF453A',
    modes: {
      dark: {
        accent: '#FF453A',
        accentText: '#000000',
        accentInk: '#FF453A',
        accentKeyline: null,
        accentLine: '#FF453A',
        accentSoft: 'rgba(255,69,58,0.16)',
        heat: '#CF9C00',
        danger: '#D665DE',
      },
      light: {
        accent: '#FF453A',
        accentText: '#000000',
        accentInk: '#C9000A',
        accentKeyline: '#C9000A',
        accentLine: '#C9000A',
        accentSoft: 'rgba(201,0,10,0.12)',
        heat: '#7E5D00',
        danger: '#9A38A1',
      },
    },
  },
  cyan: {
    key: 'cyan',
    name: 'Ice Cyan',
    seed: '#2EE6E6',
    modes: {
      dark: {
        accent: '#2EE6E6',
        accentText: '#000000',
        accentInk: '#2EE6E6',
        accentKeyline: null,
        accentLine: '#2EE6E6',
        accentSoft: 'rgba(46,230,230,0.16)',
      },
      light: {
        accent: '#2EE6E6',
        accentText: '#000000',
        accentInk: '#006E6E',
        accentKeyline: '#006E6E',
        accentLine: '#006E6E',
        accentSoft: 'rgba(0,110,110,0.12)',
      },
    },
  },
  mono: {
    key: 'mono',
    name: 'Mono',
    seed: null,
    modes: {
      dark: {
        accent: '#F4F5F6',
        accentText: '#070708',
        accentInk: '#F4F5F6',
        accentKeyline: null,
        accentLine: '#F4F5F6',
        accentSoft: 'rgba(244,245,246,0.10)',
      },
      light: {
        accent: '#0D0E10',
        accentText: '#F7F7F8',
        accentInk: '#0D0E10',
        accentKeyline: null,
        accentLine: '#0D0E10',
        accentSoft: 'rgba(13,14,16,0.10)',
      },
    },
  },
};

// ───────────────────────── Personal records (Brushed Gold) ─────────────────────────
// Reserved for PRs / achievements. Never the app accent.

export type PrRoles = {
  pr: string;
  prText: string;
  prInk: string;
  prKeyline: string | null;
  prSoft: string;
  prMetal: Metal;
};

const prMetal: Metal = ['#F2D495', '#C9A24A', '#A27900'];

export const prTokens: Record<ColorScheme, PrRoles> = {
  dark: {
    pr: '#C9A24A',
    prText: '#000000',
    prInk: '#C9A24A',
    prKeyline: null,
    prSoft: 'rgba(201,162,74,0.16)',
    prMetal,
  },
  light: {
    pr: '#C9A24A',
    prText: '#000000',
    prInk: '#7E5E00',
    prKeyline: '#7E5E00',
    prSoft: 'rgba(126,94,0,0.12)',
    prMetal,
  },
};

// ───────────────────────── Space / radius ─────────────────────────

/** Numeric keys 1–10 plus named aliases (same values). */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpaceKey = keyof typeof space;

export const radius = {
  chip: 4,
  tile: 8,
  input: 8,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;

// ───────────────────────── Typography ─────────────────────────

/** Font-face names; must match the keys passed to `useFonts` in the root layout. */
export const fonts = {
  display: 'BarlowCondensed_600SemiBold',
  displayBold: 'BarlowCondensed_700Bold',
  displayHeavy: 'BarlowCondensed_800ExtraBold',
  body: 'InterTight_400Regular',
  bodyMedium: 'InterTight_500Medium',
  bodySemi: 'InterTight_600SemiBold',
  bodyBold: 'InterTight_700Bold',
} as const;

export type FontKey = keyof typeof fonts;

/** Type scale in px. */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const type = {
  stamp: { fontFamily: fonts.displayHeavy, fontSize: 64, lineHeight: 60, letterSpacing: -0.5 },
  hero: { fontFamily: fonts.displayHeavy, fontSize: 48, lineHeight: 46, letterSpacing: -0.2 },
  title: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 34 },
  heading: { fontFamily: fonts.bodySemi, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  metric: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 34, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

// ───────────────────────── Motion ─────────────────────────

export const motion = {
  fast: 120,
  base: 220,
  slow: 360,
  themeCrossfade: 260,
  /** Cubic-bezier control points [x1, y1, x2, y2] — pass to `Easing.bezier(...)`. */
  easing: {
    standard: [0.2, 0, 0, 1],
    exit: [0.3, 0, 1, 1],
  },
  /** Max duration when Reduce Motion is on (opacity-only / instant, no scale/translate). */
  reducedMax: 120,
} as const;
