import { memo, useId, type ReactNode } from 'react';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { background, type ColorScheme } from '../theme/tokens';
import { GRAIN_DATA_URI } from './bgGrainDataUri';

const GRAIN = require('../../assets/bg-grain-256.png');

/** Ellipse radial: Chrome ignores SVG2 rx/ry, so also set r + gradientTransform (SVG 1.1). */
function ellipseGradient(cx: number, cy: number, rx: number, ry: number) {
  const r = rx || ry || 1;
  const sy = rx ? ry / rx : 1;
  return {
    gradientUnits: 'userSpaceOnUse' as const,
    cx,
    cy,
    r,
    rx,
    ry,
    gradientTransform: `translate(${cx} ${cy}) scale(1 ${sy}) translate(${-cx} ${-cy})`,
  };
}

/** Split an rgba()/hex color so SVG can use opaque stopColor + stopOpacity (more reliable on web). */
function svgStop(color: string, opacity = 1): { stopColor: string; stopOpacity: number } {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const a = m[4] === undefined ? 1 : Number(m[4]);
    return { stopColor: `rgb(${m[1]},${m[2]},${m[3]})`, stopOpacity: a * opacity };
  }
  return { stopColor: color, stopOpacity: opacity };
}



/** Viewport-filling root. On web, 100vh covers tall capture windows so the theme
 *  canvas never gives way to the default light page background. */
export function screenRootStyle(backgroundColor: string): ViewStyle {
  return {
    flex: 1,
    flexGrow: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : '100%',
    backgroundColor,
  };
}

/** ScrollView contentContainer: grow to the parent height with the same canvas. */
export function screenScrollContentStyle(backgroundColor: string): ViewStyle {
  return {
    flexGrow: 1,
    minHeight: '100%',
    backgroundColor,
  };
}

/**
 * Static screen background: accent glow + vignette + grain. Three layers, no animation,
 * pointerEvents none. Mount once behind the navigator. Re-renders only on mode/accent/size change.
 */
function ScreenAtmosphereImpl() {
  const { colors, family, resolvedScheme: scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const uid = useId().replace(/:/g, '');
  const glowId = `v2-bg-glow-${uid}`;
  const g = background.glow;
  const layerW = width - g.insetX * 2;
  const glowColor = colors.bgGlow;
  const vignette = background.vignette[scheme];

  return (
    <View pointerEvents="none" style={styles.layer}>
      {/* Glow: ellipse 50%×50% at 30% 45% of the layer, alpha → 0 at 70%. Aurora uses the three blob glows instead. */}
      {family === 'aurora' ? null : <Svg
        pointerEvents="none"
        width={layerW}
        height={g.layerHeight}
        style={{ position: 'absolute', top: g.layerTop, left: g.insetX }}
      >
        <Defs>
          <RadialGradient
            id={glowId}
            {...ellipseGradient(layerW * g.atX, g.layerHeight * g.atY, layerW * g.radiusX, g.layerHeight * g.radiusY)}
          >
            <Stop offset={0} {...svgStop(glowColor)} />
            <Stop offset={g.stop} {...svgStop(glowColor, 0)} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={layerW} height={g.layerHeight} fill={`url(#${glowId})`} />
      </Svg>}

      {family === 'aurora' && colors.effects.glows ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {colors.effects.glows.map((c, i) => {
            const pos = [
              { top: -80, left: -90, size: 320 },
              { top: 140, left: 230, size: 260 },
              { top: 560, left: 60, size: 300 },
            ][i] ?? { top: 200, left: 40, size: 280 };
            const id = `${glowId}-blob-${i}`;
            const stop = svgStop(c, colors.effects.glowAlpha);
            return (
              <Svg key={id} pointerEvents="none" width={pos.size} height={pos.size} style={{ position: 'absolute', top: pos.top, left: pos.left }}>
                <Defs>
                  <RadialGradient id={id} cx="50%" cy="50%" r="50%">
                    <Stop offset={0} stopColor={stop.stopColor} stopOpacity={stop.stopOpacity} />
                    <Stop offset={1} stopColor={stop.stopColor} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={pos.size} height={pos.size} fill={`url(#${id})`} />
              </Svg>
            );
          })}
        </View>
      ) : null}

      {/* Vignette: two elliptical radials, percentages of the screen box */}
      <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {vignette.map((v, i) => (
            <RadialGradient
              key={i}
              id={`v2-bg-vig-${uid}-${i}`}
              {...ellipseGradient(v.cx * width, v.cy * height, v.rx * width, v.ry * height)}
            >
              {v.stops.map((st, j) => (
                <Stop key={j} offset={st.at} {...svgStop(st.color)} />
              ))}
            </RadialGradient>
          ))}
        </Defs>
        {vignette.map((_, i) => (
          <Rect key={i} x={0} y={0} width={width} height={height} fill={`url(#v2-bg-vig-${uid}-${i})`} />
        ))}
      </Svg>

      <Grain scheme={scheme} />
    </View>
  );
}

function Grain({ scheme }: { scheme: ColorScheme }) {
  const { colors } = useTheme();
  const opacity = colors.effects.grainOpacity ?? background.grain.opacity[scheme];
  const mixBlendMode = (colors.effects.grainBlend ?? background.grain.blend[scheme]) as 'screen' | 'multiply';

  if (Platform.OS === 'web') {
    const style = {
      ...StyleSheet.absoluteFill,
      backgroundImage: `url("${GRAIN_DATA_URI}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: `${background.grain.tile}px ${background.grain.tile}px`,
      opacity,
      mixBlendMode,
    } as ViewStyle;
    return <View pointerEvents="none" style={style} />;
  }

  const style = {
    ...StyleSheet.absoluteFill,
    opacity,
    mixBlendMode,
  } as ImageStyle;

  return <ImageBackground source={GRAIN} resizeMode="repeat" pointerEvents="none" style={style} />;
}

const styles = StyleSheet.create({
  // No zIndex here: the shell wraps the navigator in a zIndex:1 sibling so this
  // stays behind content on web (a zIndex:0 absolute layer can paint over in-flow siblings).
  layer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});

export const ScreenAtmosphere = memo(ScreenAtmosphereImpl);

/**
 * Opaque screen root: solid canvas + atmosphere behind children.
 * Use this on every tab and stack screen so inactive transparent scenes
 * cannot show through each other (especially on web).
 */
export function ScreenBackground({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={screenRootStyle(colors.bg)}>
      <ScreenAtmosphere />
      <View style={[screenRootStyle('transparent'), { zIndex: 1 }]}>{children}</View>
    </View>
  );
}
