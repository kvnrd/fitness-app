import { auroraPaletteFor, type AuroraPalette } from './auroraPalettes.ts';
import {
  DEFAULT_ACCENT,
  DEFAULT_BG_STRENGTH,
  DEFAULT_CUSTOM_HUE,
  DEFAULT_FAMILY,
  accents,
  background,
  composeGlow,
  effects,
  neutrals,
  prTokens,
  type AccentKey,
  type AuroraPreset,
  type ColorScheme,
  type Effects,
  type Metal,
  type PrRoles,
  type ThemeFamily,
} from './tokens.ts';

export type ResolvedColors = {
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
  accent: string;
  accentText: string;
  accentInk: string;
  accentKeyline: string | null;
  accentLine: string;
  accentSoft: string;
  accentMetal: Metal | null;
  /** Alias of `accentInk` — the coach's voice uses the accent ink, not Brushed Gold. */
  coach: string;
  effects: Effects;
  /** Phase 1b: composed glow colour (accent fill RGB, not accentInk) at medium strength. */
  bgGlow: string;
  bgGlowSubtle: string;
  /** Outer wash. Aurora sets this apart from `bg`; v2 equals `bg`. */
  page: string;
  /** Decorative only (dividers, disabled hints, placeholder icons). Never use for copy. */
  faint: string;
  glass: string;
  glassBorder: string;
  inputFill: string;
  tabOn: string;
  tabOnText: string;
  track: string;
  /** Set when the resolved Aurora palette has no reviewed mockup (Berry light, Chrome light). */
  unreviewed?: boolean;
} & PrRoles;

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fromAurora(p: AuroraPalette): ResolvedColors {
  const prSoft = hexAlpha(p.pr, p.scheme === 'dark' ? 0.16 : 0.12);
  return {
    bg: p.bg,
    surfaceSunken: p.inputFill,
    surface: p.rowOn,
    surfaceRaised: p.rowOn,
    border: p.glassBorder,
    borderStrong: p.glassBorder,
    text: p.text,
    textSecondary: p.textSecondary,
    // Copy muted stays secondary so existing textMuted usages remain AA. Use `faint` for decoration.
    textMuted: p.textSecondary,
    placeholder: p.textSecondary,
    heat: p.heat,
    danger: p.danger,
    accent: p.accent,
    accentText: p.accentText,
    accentInk: p.accentInk,
    accentKeyline: p.scheme === 'light' ? p.accentInk : null,
    accentLine: p.accentInk,
    accentSoft: hexAlpha(p.accent, p.scheme === 'dark' ? 0.16 : 0.2),
    accentMetal: p.accentMetal,
    coach: p.accentInk,
    effects: {
      grainOpacity: p.grain,
      glowAlpha: p.glowAlpha,
      grainBlend: p.grainBlend,
      glass: p.glass,
      glows: p.glows,
    },
    bgGlow: composeGlow(p.accent, p.glowAlpha),
    bgGlowSubtle: composeGlow(p.accent, p.glowAlpha * 0.5),
    page: p.page,
    faint: p.faint,
    glass: p.glass,
    glassBorder: p.glassBorder,
    inputFill: p.inputFill,
    tabOn: p.tabOn,
    tabOnText: p.tabOnText,
    track: p.track,
    unreviewed: p.unreviewed || undefined,
    pr: p.pr,
    prText: p.prText,
    prInk: p.prInk,
    prKeyline: p.scheme === 'light' ? p.prInk : null,
    prSoft,
    prMetal: p.accentMetal,
  };
}

/** Resolve the flat palette for a scheme + accent. Unknown accent keys fall back to the default. v2 only. */
export function resolveColors(scheme: ColorScheme, accentKey: AccentKey): ResolvedColors {
  const n = neutrals[scheme];
  const def = accents[accentKey] ?? accents[DEFAULT_ACCENT];
  const { heat, danger, accentMetal, ...roles } = def.modes[scheme];

  return {
    ...n,
    ...roles,
    heat: heat ?? n.heat,
    danger: danger ?? n.danger,
    accentMetal: accentMetal ?? null,
    coach: roles.accentInk,
    effects: effects[scheme],
    bgGlow: composeGlow(roles.accent, background.glowAlpha[DEFAULT_BG_STRENGTH][scheme]),
    bgGlowSubtle: composeGlow(roles.accent, background.glowAlpha.subtle[scheme]),
    ...prTokens[scheme],
    page: n.bg,
    faint: n.border,
    glass: n.surface,
    glassBorder: n.border,
    inputFill: n.surface,
    tabOn: roles.accent,
    tabOnText: roles.accentText,
    track: n.surfaceSunken,
  };
}

export function resolveTheme(
  scheme: ColorScheme,
  family: ThemeFamily = DEFAULT_FAMILY,
  accentKey: AccentKey = DEFAULT_ACCENT,
  auroraPreset: AuroraPreset = 'midnight',
  customHue: number = DEFAULT_CUSTOM_HUE,
): ResolvedColors {
  if (family === 'aurora') return fromAurora(auroraPaletteFor(auroraPreset, scheme, customHue));
  return resolveColors(scheme, accentKey);
}
