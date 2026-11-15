import {
  AccentKey,
  ColorScheme,
  DEFAULT_ACCENT,
  Effects,
  Metal,
  PrRoles,
  accents,
  effects,
  neutrals,
  prTokens,
} from './tokens';

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
} & PrRoles;

/** Resolve the flat palette for a scheme + accent. Unknown accent keys fall back to the default. */
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
    ...prTokens[scheme],
  };
}
