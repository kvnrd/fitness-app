import { Platform, TextStyle } from 'react-native';

/**
 * Design tokens. Dark, restrained, one accent.
 * The accent is per-trainer in the future (white-label), so components
 * read it from here rather than hard-coding it.
 */
export const colors = {
  bg: '#0A0A0B',
  surface: '#131315',
  surfaceRaised: '#1B1B1E',
  surfaceSunken: '#0E0E10',
  border: '#232327',
  borderStrong: '#2F2F34',
  text: '#F4F4F5',
  textSecondary: '#A1A1A8',
  textMuted: '#6B6B73',
  accent: '#D4FF4F',
  accentText: '#0A0A0B',
  accentSoft: 'rgba(212, 255, 79, 0.12)',
  success: '#5EE6A0',
  danger: '#FF6B6B',
  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

const display = Platform.select({
  ios: 'System',
  android: 'sans-serif-condensed',
  default: '"Inter Tight", "SF Pro Display", -apple-system, system-ui, sans-serif',
});

const body = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'Inter, "SF Pro Text", -apple-system, system-ui, sans-serif',
});

export const type = {
  hero: { fontFamily: display, fontSize: 40, lineHeight: 44, fontWeight: '700', letterSpacing: -1.2 },
  title: { fontFamily: display, fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6 },
  heading: { fontFamily: display, fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontFamily: body, fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontFamily: body, fontSize: 16, lineHeight: 23, fontWeight: '600' },
  small: { fontFamily: body, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontFamily: body, fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  metric: { fontFamily: display, fontSize: 22, lineHeight: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
