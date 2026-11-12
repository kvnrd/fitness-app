import { TextStyle } from 'react-native';

/**
 * "Iron & Chalk" — see docs/design.md.
 * Black base, chalk for primary/complete, oxide reserved for the coach's voice.
 */
export const colors = {
  bg: '#000000', // Pitch
  surface: '#16181B', // Iron
  surfaceRaised: '#1E2125',
  surfaceSunken: '#0C0D0F',
  border: '#2B2E33', // Knurl
  borderStrong: '#3A3E44',
  text: '#EEEAE3', // Chalk
  textSecondary: '#8F8C86', // Dust
  textMuted: '#64625E',
  placeholder: '#4A4844',
  accent: '#EEEAE3', // primary action = chalk
  accentText: '#000000',
  accentSoft: 'rgba(238, 234, 227, 0.07)',
  coach: '#C7B08C', // Oxide — anything the trainer said
  danger: '#E5806B',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 6,
  lg: 10,
  pill: 999,
} as const;

export const fonts = {
  display: 'BigShouldersDisplay_800ExtraBold',
  displayBlack: 'BigShouldersDisplay_900Black',
  body: 'Archivo_400Regular',
  bodyMedium: 'Archivo_500Medium',
  bodySemi: 'Archivo_600SemiBold',
} as const;

// Scale: 12 / 14 / 16 / 20 / 28 / 44 / 76
export const type = {
  stamp: { fontFamily: fonts.displayBlack, fontSize: 76, lineHeight: 72, letterSpacing: -0.5 },
  hero: { fontFamily: fonts.displayBlack, fontSize: 44, lineHeight: 44, letterSpacing: -0.2 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30 },
  heading: { fontFamily: fonts.bodySemi, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  metric: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
