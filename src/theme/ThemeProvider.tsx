import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ResolvedColors, resolveColors } from './resolve';
import {
  ACCENT_KEYS,
  AccentDefinition,
  AccentKey,
  ColorScheme,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  ThemeMode,
  accents,
  fonts,
  motion,
  neutrals,
  radius,
  space,
  type,
} from './tokens';
import { useReducedMotion } from './useReducedMotion';

export const MODE_STORAGE_KEY = 'fitness.theme.mode';
export const ACCENT_STORAGE_KEY = 'fitness.theme.accent';

const MODES: readonly ThemeMode[] = ['system', 'dark', 'light'];

export function isThemeMode(v: unknown): v is ThemeMode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v);
}

export function isAccentKey(v: unknown): v is AccentKey {
  return typeof v === 'string' && (ACCENT_KEYS as readonly string[]).includes(v);
}

export type Theme = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedScheme: ColorScheme;
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  /** Accent catalog (ordered) for a picker. */
  accents: readonly AccentDefinition[];
  colors: ResolvedColors;
  fonts: typeof fonts;
  type: typeof type;
  space: typeof space;
  radius: typeof radius;
  motion: typeof motion;
  reducedMotion: boolean;
  /** Dev preview only (screenshots): forces the resolved scheme without touching the saved mode. null = off. */
  setSchemeOverride: (scheme: ColorScheme | null) => void;
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
  const [hydrated, setHydrated] = useState(false);
  const [schemeOverride, setSchemeOverride] = useState<ColorScheme | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet([MODE_STORAGE_KEY, ACCENT_STORAGE_KEY])
      .then(([[, m], [, a]]) => {
        if (!active) return;
        if (isThemeMode(m)) setModeState(m);
        if (isAccentKey(a)) setAccentState(a);
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

  const resolvedScheme: ColorScheme = schemeOverride ?? (mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode);

  const theme = useMemo<Theme>(
    () => ({
      mode,
      setMode,
      resolvedScheme,
      accent,
      setAccent,
      accents: accentCatalog,
      colors: resolveColors(resolvedScheme, accent),
      fonts,
      type,
      space,
      radius,
      motion,
      reducedMotion,
      setSchemeOverride,
      hydrated,
    }),
    [mode, setMode, resolvedScheme, accent, setAccent, reducedMotion, hydrated],
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
