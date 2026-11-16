import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { PREVIEW_SCREENS } from '../onboarding/preview/registry';
import { CARBON_BG, useTheme } from '../theme/ThemeProvider';

/**
 * Screenshot harness. NEVER in production: active only when `__DEV__ && EXPO_PUBLIC_SCREEN_PREVIEW === '1'`,
 * otherwise it redirects home. Not in the deep-link allowlist. Params: screen=<id>, scheme=dark|light.
 * Renders presentational screens with mock props from onboarding/preview/registry.tsx.
 */
const ENABLED = __DEV__ && process.env.EXPO_PUBLIC_SCREEN_PREVIEW === '1';

export default function DevPreviewRoute() {
  if (!ENABLED) return <Redirect href="/" />;
  return <Preview />;
}

function Preview() {
  const { screen, scheme } = useLocalSearchParams<{ screen?: string; scheme?: string }>();
  const { resolvedScheme, setSchemeOverride } = useTheme();
  const want = scheme === 'light' ? 'light' : 'dark';
  useEffect(() => {
    setSchemeOverride(want);
    return () => setSchemeOverride(null);
  }, [want, setSchemeOverride]);
  const render = typeof screen === 'string' ? PREVIEW_SCREENS[screen] : undefined;
  if (resolvedScheme !== want) return <View style={{ flex: 1, backgroundColor: CARBON_BG }} />;
  if (!render) return <Redirect href="/" />;
  return render();
}
