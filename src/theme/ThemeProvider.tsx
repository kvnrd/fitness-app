import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ResolvedColors, resolveTheme } from './resolve';
import {
  ACCENT_KEYS,
  AURORA_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_AURORA_PRESET,
  DEFAULT_CUSTOM_HUE,
  DEFAULT_FAMILY,
  DEFAULT_MODE,
  THEME_FAMILIES,
  accents,
  auroraRadius,
  fonts,
  minControlSize,
  motion,
  neutrals,
  space,
  type,
  v2Radius,
  type AccentDefinition,
  type AccentKey,
  type AuroraPreset,
  type ColorScheme,
  type ResolvedRadius,
  type ThemeFamily,
  type ThemeMode,
} from './tokens';
import { clampHue } from './auroraGen';
import { useReducedMotion } from './useReducedMotion';

export const MODE_STORAGE_KEY = 'fitness.theme.mode';
export const ACCENT_STORAGE_KEY = 'fitness.theme.accent';
export const FAMILY_STORAGE_KEY = 'fitness.theme.family';
export const AURORA_PRESET_STORAGE_KEY = 'fitness.theme.auroraPreset';
export const CUSTOM_HUE_STORAGE_KEY = 'fitness.theme.customHue';

const MODES: readonly ThemeMode[] = ['system', 'dark', 'light'];

export function isThemeMode(v: unknown): v is ThemeMode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v);
}

export function isAccentKey(v: unknown): v is AccentKey {
  return typeof v === 'string' && (ACCENT_KEYS as readonly string[]).includes(v);
}

export function isThemeFamily(v: unknown): v is ThemeFamily {
  return typeof v === 'string' && (THEME_FAMILIES as readonly string[]).includes(v);
}

export function isAuroraPreset(v: unknown): v is AuroraPreset {
  return typeof v === 'string' && (AURORA_PRESETS as readonly string[]).includes(v);
}

export type ThemePreviewOverride = {
  scheme?: ColorScheme | null;
  family?: ThemeFamily | null;
  preset?: AuroraPreset | null;
  hue?: number | null;
};

export type Theme = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedScheme: ColorScheme;
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  family: ThemeFamily;
  setFamily: (family: ThemeFamily) => void;
  auroraPreset: AuroraPreset;
  setAuroraPreset: (preset: AuroraPreset) => void;
  customHue: number;
  setCustomHue: (hue: number) => void;
  /** Accent catalog (ordered) for a picker. */
  accents: readonly AccentDefinition[];
  colors: ResolvedColors;
  fonts: typeof fonts;
  type: typeof type;
  space: typeof space;
  radius: ResolvedRadius;
  minControlSize: number;
  motion: typeof motion;
  reducedMotion: boolean;
  /** Dev preview only (screenshots): forces the resolved scheme without touching the saved mode. null = off. */
  schemeOverride: ColorScheme | null;
  setSchemeOverride: (scheme: ColorScheme | null) => void;
  /** Dev preview only: forces family / preset / hue without touching storage. */
  setPreviewOverride: (next: ThemePreviewOverride | null) => void;
  /** False until persisted mode/accent have been read from storage. */
  hydrated: boolean;
};

const accentCatalog: readonly AccentDefinition[] = ACCENT_KEYS.map((k) => accents[k]);

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const reducedMotion = useReducedMotion();
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [accent, setAccentState] = useState<AccentKey>(DEFAULT_ACCENT);
  const [family, setFamilyState] = useState<ThemeFamily>(DEFAULT_FAMILY);
  const [auroraPreset, setPresetState] = useState<AuroraPreset>(DEFAULT_AURORA_PRESET);
  const [customHue, setHueState] = useState<number>(DEFAULT_CUSTOM_HUE);
  const [hydrated, setHydrated] = useState(false);
  const [schemeOverride, setSchemeOverride] = useState<ColorScheme | null>(null);
  const [previewOverride, setPreviewOverrideState] = useState<ThemePreviewOverride | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet([MODE_STORAGE_KEY, ACCENT_STORAGE_KEY, FAMILY_STORAGE_KEY, AURORA_PRESET_STORAGE_KEY, CUSTOM_HUE_STORAGE_KEY])
      .then((pairs) => {
        if (!active) return;
        const map = Object.fromEntries(pairs);
        if (isThemeMode(map[MODE_STORAGE_KEY])) setModeState(map[MODE_STORAGE_KEY]);
        if (isAccentKey(map[ACCENT_STORAGE_KEY])) setAccentState(map[ACCENT_STORAGE_KEY]);
        // Appearance no longer offers Classic v2 (Kevin, 2026-11-19), so a stored 'v2' falls back to Aurora.
        if (map[FAMILY_STORAGE_KEY] === 'aurora') setFamilyState('aurora');
        if (isAuroraPreset(map[AURORA_PRESET_STORAGE_KEY])) setPresetState(map[AURORA_PRESET_STORAGE_KEY]);
        const hue = map[CUSTOM_HUE_STORAGE_KEY];
        const parsed = hue != null ? clampHue(Number(hue)) : null;
        if (parsed != null) setHueState(parsed);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    if (!isThemeMode(next)) return;
    setModeState(next);
    AsyncStorage.setItem(MODE_STORAGE_KEY, next).catch(() => {});
  }, []);

  const setAccent = useCallback((next: AccentKey) => {
    if (!isAccentKey(next)) return;
    setAccentState(next);
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, next).catch(() => {});
  }, []);

  const setFamily = useCallback((next: ThemeFamily) => {
    if (!isThemeFamily(next)) return;
    setFamilyState(next);
    AsyncStorage.setItem(FAMILY_STORAGE_KEY, next).catch(() => {});
  }, []);

  const setAuroraPreset = useCallback((next: AuroraPreset) => {
    if (!isAuroraPreset(next)) return;
    setPresetState(next);
    AsyncStorage.setItem(AURORA_PRESET_STORAGE_KEY, next).catch(() => {});
    setFamilyState('aurora');
    AsyncStorage.setItem(FAMILY_STORAGE_KEY, 'aurora').catch(() => {});
  }, []);

  const setCustomHue = useCallback((next: number) => {
    const hue = clampHue(next);
    if (hue == null) return;
    setHueState(hue);
    AsyncStorage.setItem(CUSTOM_HUE_STORAGE_KEY, String(hue)).catch(() => {});
    setPresetState('custom');
    AsyncStorage.setItem(AURORA_PRESET_STORAGE_KEY, 'custom').catch(() => {});
    setFamilyState('aurora');
    AsyncStorage.setItem(FAMILY_STORAGE_KEY, 'aurora').catch(() => {});
  }, []);

  const setPreviewOverride = useCallback((next: ThemePreviewOverride | null) => {
    setPreviewOverrideState(next);
    if (next?.scheme !== undefined) setSchemeOverride(next.scheme);
  }, []);

  const resolvedScheme: ColorScheme =
    (previewOverride?.scheme ?? schemeOverride) ?? (mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode);

  const resolvedFamily = previewOverride?.family ?? family;
  const resolvedPreset = previewOverride?.preset ?? auroraPreset;
  const resolvedHue = previewOverride?.hue ?? customHue;

  const theme = useMemo<Theme>(
    () => ({
      mode,
      setMode,
      resolvedScheme,
      accent,
      setAccent,
      family: resolvedFamily,
      setFamily,
      auroraPreset: resolvedPreset,
      setAuroraPreset,
      customHue: resolvedHue,
      setCustomHue,
      accents: accentCatalog,
      colors: resolveTheme(resolvedScheme, resolvedFamily, accent, resolvedPreset, resolvedHue),
      fonts,
      type,
      space,
      radius: resolvedFamily === 'aurora' ? auroraRadius : v2Radius,
      minControlSize,
      motion,
      reducedMotion,
      schemeOverride,
      setSchemeOverride,
      setPreviewOverride,
      hydrated,
    }),
    [
      mode,
      setMode,
      resolvedScheme,
      accent,
      setAccent,
      resolvedFamily,
      setFamily,
      resolvedPreset,
      setAuroraPreset,
      resolvedHue,
      setCustomHue,
      reducedMotion,
      schemeOverride,
      setPreviewOverride,
      hydrated,
    ],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Carbon background, used before the theme is hydrated. */
export const CARBON_BG = neutrals.dark.bg;

export { useReducedMotion };
