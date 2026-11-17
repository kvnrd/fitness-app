import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { screenRootStyle } from '../components/ScreenAtmosphere';
import { PREVIEW_SCREENS } from '../onboarding/preview/registry';
import { FullHeightContext } from '../onboarding/ui/previewMode';
import { isAuroraPreset, isThemeFamily, CARBON_BG, useTheme } from '../theme/ThemeProvider';
import { clampHue } from '../theme/auroraGen';
import type { AuroraPreset, ColorScheme, ThemeFamily } from '../theme/tokens';

/**
 * Screenshot harness. NEVER in a store build: active only when `EXPO_PUBLIC_SCREEN_PREVIEW === '1'`,
 * otherwise it redirects home. The flag is a build-time env var, so a normal production export
 * (which does not set it) still redirects. A `--dev` static export is not required. Not in the deep-link allowlist. Params: screen=<id>, scheme=dark|light, full=1 (render at full content height so a screenshot can capture the whole document; the measured height is written to <body data-full-height>). family=v2|aurora, preset=midnight|grove|berry|chrome|custom, hue=0-359.
 * Renders presentational screens with mock props from onboarding/preview/registry.tsx.
 */
const ENABLED = process.env.EXPO_PUBLIC_SCREEN_PREVIEW === '1';

export default function DevPreviewRoute() {
  if (!ENABLED) return <Redirect href="/" />;
  return <Preview />;
}

function Preview() {
  const { screen, scheme, full, family, preset, hue } = useLocalSearchParams<{
    screen?: string;
    scheme?: string;
    full?: string;
    family?: string;
    preset?: string;
    hue?: string;
  }>();
  const grow = full === '1';
  const { resolvedScheme, family: curFamily, auroraPreset, customHue, setPreviewOverride, colors } = useTheme();
  const want: ColorScheme = scheme === 'light' ? 'light' : 'dark';
  const wantFamily: ThemeFamily | undefined = isThemeFamily(family) ? family : undefined;
  const wantPreset: AuroraPreset | undefined = isAuroraPreset(preset) ? preset : undefined;
  const wantHue = hue != null ? clampHue(Number(Array.isArray(hue) ? hue[0] : hue)) : null;

  useEffect(() => {
    setPreviewOverride({
      scheme: want,
      family: wantFamily ?? null,
      preset: wantPreset ?? null,
      hue: wantHue,
    });
    return () => setPreviewOverride(null);
  }, [want, wantFamily, wantPreset, wantHue, setPreviewOverride]);

  useEffect(() => {
    if (!grow || typeof document === 'undefined') return;
    // The navigator clamps its screens to the viewport; the screenshot script opens a window taller than any screen and crops to this height.
    const t = setInterval(() => {
      if (document.fonts && document.fonts.status !== 'loaded') return; // web fonts first, or the text reflows afterwards
      const el = document.getElementById('preview-full');
      if (el) {
        const h = Math.max(
          Math.ceil(el.scrollHeight),
          Math.ceil(el.getBoundingClientRect().bottom + window.scrollY),
          Math.ceil(document.documentElement.scrollHeight),
        );
        document.body.setAttribute('data-full-height', String(h));
      }
    }, 300);
    return () => clearInterval(t);
  }, [grow]);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.background = colors.bg;
    document.documentElement.style.background = colors.bg;
    document.body.style.minHeight = '100%';
    document.documentElement.style.minHeight = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';
    const root = document.getElementById('root');
    if (root) {
      root.style.background = colors.bg;
      root.style.minHeight = '100%';
      root.style.height = '100%';
    }
    return () => {
      document.body.style.background = prevBody;
      document.documentElement.style.background = prevHtml;
    };
  }, [colors.bg]);
  const render = typeof screen === 'string' ? PREVIEW_SCREENS[screen] : undefined;
  const familyReady = !wantFamily || curFamily === wantFamily;
  const presetReady = !wantPreset || auroraPreset === wantPreset;
  const hueReady = wantHue == null || customHue === wantHue;
  if (resolvedScheme !== want || !familyReady || !presetReady || !hueReady) {
    return <View style={{ flex: 1, backgroundColor: CARBON_BG }} />;
  }
  if (!render) return <Redirect href="/" />;
  return grow ? (
    <FullHeightContext.Provider value>
      <View nativeID="preview-full" style={screenRootStyle(colors.bg)}>
        {render()}
      </View>
    </FullHeightContext.Provider>
  ) : (
    render()
  );
}
