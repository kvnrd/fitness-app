import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { PREVIEW_SCREENS } from '../onboarding/preview/registry';
import { FullHeightContext } from '../onboarding/ui/previewMode';
import { CARBON_BG, useTheme } from '../theme/ThemeProvider';

/**
 * Screenshot harness. NEVER in production: active only when `__DEV__ && EXPO_PUBLIC_SCREEN_PREVIEW === '1'`,
 * otherwise it redirects home. Not in the deep-link allowlist. Params: screen=<id>, scheme=dark|light, full=1 (render at full content height so a screenshot can capture the whole document; the measured height is written to <body data-full-height>).
 * Renders presentational screens with mock props from onboarding/preview/registry.tsx.
 */
const ENABLED = __DEV__ && process.env.EXPO_PUBLIC_SCREEN_PREVIEW === '1';

export default function DevPreviewRoute() {
  if (!ENABLED) return <Redirect href="/" />;
  return <Preview />;
}

function Preview() {
  const { screen, scheme, full } = useLocalSearchParams<{ screen?: string; scheme?: string; full?: string }>();
  const grow = full === '1';
  const { resolvedScheme, setSchemeOverride } = useTheme();
  const want = scheme === 'light' ? 'light' : 'dark';
  useEffect(() => {
    setSchemeOverride(want);
    return () => setSchemeOverride(null);
  }, [want, setSchemeOverride]);
  useEffect(() => {
    if (!grow || typeof document === 'undefined') return;
    // The navigator clamps its screens to the viewport; the screenshot script opens a window taller than any screen and crops to this height.
    const t = setInterval(() => {
      if (document.fonts && document.fonts.status !== 'loaded') return; // web fonts first, or the text reflows afterwards
      const el = document.getElementById('preview-full'); // set by OnbScreen in full mode: height:auto, so it is the real content height
      if (el) document.body.setAttribute('data-full-height', String(Math.ceil(el.getBoundingClientRect().bottom + window.scrollY)));
    }, 300);
    return () => clearInterval(t);
  }, [grow]);
  const render = typeof screen === 'string' ? PREVIEW_SCREENS[screen] : undefined;
  if (resolvedScheme !== want) return <View style={{ flex: 1, backgroundColor: CARBON_BG }} />;
  if (!render) return <Redirect href="/" />;
  return grow ? <FullHeightContext.Provider value><View style={{ minHeight: 844 }}>{render()}</View></FullHeightContext.Provider> : render();
}
