/**
 * Official Aurora presets, mapped from `--aurora-*` tokens.
 *
 * Berry light and Chrome light have no v4 mockups. Their tokens come from
 * aurora-v4/src/gen.py (hues 6° and 222°) plus the walked 3:1 faint values in
 * the token map. They are flagged `unreviewed`.
 *
 * Chrome dark is the hand-tuned silver. Do not substitute gen.py at the Chrome
 * hue — that output is a vivid cyan, not this preset.
 */
import { generateAuroraPalette } from './auroraGen.ts';
import { DEFAULT_CUSTOM_HUE, type AuroraPreset, type ColorScheme, type Metal } from './tokens.ts';

export type GrainBlend = 'screen' | 'multiply';

export type AuroraPalette = {
  key: string;
  name: string;
  scheme: ColorScheme;
  /** True for generated light palettes that have no reviewed mockup. */
  unreviewed?: boolean;
  page: string;
  bg: string;
  text: string;
  textSecondary: string;
  /** Decorative only (dividers, disabled hints, placeholder icons). Not for copy. ≥ 3:1. */
  faint: string;
  glass: string;
  glassBorder: string;
  accent: string;
  accentText: string;
  accentInk: string;
  track: string;
  rowOn: string;
  inputFill: string;
  tabOn: string;
  tabOnText: string;
  glows: Metal;
  accentMetal: Metal;
  pr: string;
  prText: string;
  prInk: string;
  heat: string;
  danger: string;
  glowAlpha: number;
  grain: number;
  grainBlend: GrainBlend;
};

export const AURORA_UNREVIEWED_NOTE: Record<'berry-light' | 'chrome-light', string> = {
  'berry-light': 'Berry light is generated (gen.py, hue 6°) and is unreviewed — there is no v4 mockup.',
  'chrome-light': 'Chrome light is generated (gen.py, hue 222°) and is unreviewed — there is no v4 mockup.',
};

export const midnight: AuroraPalette = {
  key: 'midnight',
  name: 'Midnight',
  scheme: 'dark',
  page: '#04060E',
  bg: '#070A16',
  text: '#F1F4FF',
  textSecondary: '#AEB6D4',
  faint: '#8890AE',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(200,210,255,0.13)',
  accent: '#8FA3FF',
  accentText: '#000000',
  accentInk: '#A9BAFF',
  track: 'rgba(255,255,255,0.12)',
  rowOn: '#141A33',
  inputFill: 'rgba(255,255,255,0.10)',
  tabOn: '#F1F4FF',
  tabOnText: '#070A16',
  glows: ['#3B5BFF', '#6D4AFF', '#1FA2FF'],
  accentMetal: ['#A9C1FF', '#7C93FF', '#9B7BFF'],
  pr: '#C9A24A',
  prText: '#000000',
  prInk: '#C9A24A',
  heat: '#FE8132',
  danger: '#FE7E70',
  glowAlpha: 0.42,
  grain: 0.066,
  grainBlend: 'screen',
};

export const grove: AuroraPalette = {
  key: 'grove',
  name: 'Grove',
  scheme: 'light',
  page: '#DCDFD2',
  bg: '#EEF0E8',
  text: '#161A12',
  textSecondary: '#4A5244',
  faint: '#5E6657',
  glass: 'rgba(255,255,250,0.62)',
  glassBorder: 'rgba(255,255,250,0.92)',
  accent: '#3F5A1A',
  accentText: '#FFFFFF',
  accentInk: '#3F5A1A',
  track: 'rgba(22,26,18,0.10)',
  rowOn: '#FFFFFA',
  inputFill: 'rgba(22,26,18,0.06)',
  tabOn: '#161A12',
  tabOnText: '#FFFFFF',
  glows: ['#A8BC86', '#E3CF7A', '#86B08A'],
  accentMetal: ['#3F5F14', '#4E6B1E', '#7A5A12'],
  pr: '#A98326',
  prText: '#000000',
  prInk: '#775900',
  heat: '#A13E05',
  danger: '#B4221D',
  glowAlpha: 0.5,
  grain: 0.045,
  grainBlend: 'multiply',
};

export const berry: AuroraPalette = {
  key: 'berry',
  name: 'Berry',
  scheme: 'dark',
  page: '#0B0409',
  bg: '#12070E',
  text: '#FFF1F6',
  textSecondary: '#D6B0C2',
  faint: '#A88596',
  glass: 'rgba(255,230,240,0.07)',
  glassBorder: 'rgba(255,200,225,0.14)',
  accent: '#FF6F9B',
  accentText: '#000000',
  accentInk: '#FF9DBB',
  track: 'rgba(255,255,255,0.12)',
  rowOn: '#2A1020',
  inputFill: 'rgba(255,255,255,0.10)',
  tabOn: '#FFF1F6',
  tabOnText: '#12070E',
  glows: ['#E0479E', '#7A2E8E', '#FF6B6B'],
  accentMetal: ['#FF8FA8', '#FF5C8A', '#C774FF'],
  pr: '#C9A24A',
  prText: '#000000',
  prInk: '#C9A24A',
  heat: '#FE8132',
  danger: '#FE7E70',
  glowAlpha: 0.4,
  grain: 0.066,
  grainBlend: 'screen',
};

export const chrome: AuroraPalette = {
  key: 'chrome',
  name: 'Chrome',
  scheme: 'dark',
  page: '#030506',
  bg: '#06090B',
  text: '#F2F7FA',
  textSecondary: '#A9B6BE',
  faint: '#7F8C94',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(220,240,250,0.14)',
  accent: '#DDEBF0',
  accentText: '#000000',
  accentInk: '#A6D8E8',
  track: 'rgba(255,255,255,0.12)',
  rowOn: '#121A1F',
  inputFill: 'rgba(255,255,255,0.10)',
  tabOn: '#F2F7FA',
  tabOnText: '#06090B',
  glows: ['#7FA9BA', '#2F4C5A', '#BFDCE6'],
  accentMetal: ['#FFFFFF', '#C9DEE6', '#7FB9CC'],
  pr: '#C9A24A',
  prText: '#000000',
  prInk: '#C9A24A',
  heat: '#FE8132',
  danger: '#FE7E70',
  glowAlpha: 0.3,
  grain: 0.07,
  grainBlend: 'screen',
};

/** Generated, unreviewed. No v4 mockup. */
export const berryLight: AuroraPalette = {
  key: 'berry-light',
  name: 'Berry',
  scheme: 'light',
  unreviewed: true,
  page: '#E7D6D9',
  bg: '#F8EBED',
  text: '#1E1215',
  textSecondary: '#735C60',
  faint: '#88797B',
  glass: 'rgba(255,255,255,0.62)',
  glassBorder: 'rgba(255,255,255,0.9)',
  accent: '#9A4159',
  accentText: '#FFFFFF',
  accentInk: '#9A4159',
  track: 'rgba(0,0,0,0.10)',
  rowOn: '#FFFFFF',
  inputFill: 'rgba(0,0,0,0.06)',
  tabOn: '#1E1215',
  tabOnText: '#FFFFFF',
  glows: ['#E3A6DC', '#FEC0B4', '#E8BA8D'],
  accentMetal: ['#934B83', '#973752', '#8A3917'],
  pr: '#A98326',
  prText: '#000000',
  prInk: '#7A5B05',
  heat: '#A64003',
  danger: '#BB2A24',
  glowAlpha: 0.48,
  grain: 0.045,
  grainBlend: 'multiply',
};

/** Generated, unreviewed. No v4 mockup. Do not use gen.py dark at hue 222 for Chrome dark. */
export const chromeLight: AuroraPalette = {
  key: 'chrome-light',
  name: 'Chrome',
  scheme: 'light',
  unreviewed: true,
  page: '#CDDEE4',
  bg: '#E4F1F6',
  text: '#0B181D',
  textSecondary: '#516770',
  faint: '#718086',
  glass: 'rgba(255,255,255,0.62)',
  glassBorder: 'rgba(255,255,255,0.9)',
  accent: '#026E89',
  accentText: '#FFFFFF',
  accentInk: '#0A6B84',
  track: 'rgba(0,0,0,0.10)',
  rowOn: '#FFFFFF',
  inputFill: 'rgba(0,0,0,0.06)',
  tabOn: '#0B181D',
  tabOnText: '#FFFFFF',
  glows: ['#68D3C8', '#ADD6FD', '#BBBEF7'],
  accentMetal: ['#067976', '#0A6880', '#245496'],
  pr: '#A98326',
  prText: '#000000',
  prInk: '#7E5E00',
  heat: '#AB4101',
  danger: '#BB2A24',
  glowAlpha: 0.48,
  grain: 0.045,
  grainBlend: 'multiply',
};

/** Midnight and Grove are a dark/light pair. Berry and Chrome each have a light mode. */
export function auroraPaletteFor(preset: AuroraPreset, scheme: ColorScheme, customHue = DEFAULT_CUSTOM_HUE): AuroraPalette {
  if (preset === 'midnight' || preset === 'grove') return scheme === 'light' ? grove : midnight;
  if (preset === 'berry') return scheme === 'light' ? berryLight : berry;
  if (preset === 'chrome') return scheme === 'light' ? chromeLight : chrome;
  const g = generateAuroraPalette(customHue, scheme);
  const pr = scheme === 'light' ? grove : midnight;
  return {
    key: `custom-${customHue}-${scheme}`,
    name: 'Custom',
    scheme,
    page: g.page,
    bg: g.bg,
    text: g.text,
    textSecondary: g.mut,
    faint: g.faint,
    glass: g.glass,
    glassBorder: g.glassBorder,
    accent: g.accent,
    accentText: g.accentText,
    accentInk: g.accentInk,
    track: g.track,
    rowOn: g.rowOn,
    inputFill: g.inputFill,
    tabOn: g.tabOn,
    tabOnText: g.tabOnText,
    glows: g.glows,
    accentMetal: g.accentMetal,
    pr: pr.pr,
    prText: pr.prText,
    prInk: pr.prInk,
    heat: pr.heat,
    danger: pr.danger,
    glowAlpha: g.glowAlpha,
    grain: g.grain,
    grainBlend: g.grainBlend,
  };
}

/** Hue shown on the Appearance wheel for a named preset (Custom uses the live hue). */
export const AURORA_PRESET_HUE: Record<Exclude<AuroraPreset, 'custom'>, number> = {
  midnight: 273,
  grove: 273,
  berry: 6,
  chrome: 222,
};

export const AURORA_PRESET_SWATCHES: { key: Exclude<AuroraPreset, 'custom'>; name: string; metal: Metal }[] = [
  { key: 'midnight', name: 'Midnight', metal: midnight.accentMetal },
  { key: 'grove', name: 'Grove', metal: grove.accentMetal },
  { key: 'berry', name: 'Berry', metal: berry.accentMetal },
  { key: 'chrome', name: 'Chrome', metal: chrome.accentMetal },
];
