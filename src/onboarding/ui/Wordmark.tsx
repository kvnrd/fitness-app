import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { APP_NAME } from '../../legal/text';
import { Text } from '../../components/ui';

/** FITNESS APP wordmark: accent slash mark (skewed metal parallelogram) + Barlow Condensed 800, 0.12em. */
export function Wordmark({ color }: { color?: string }) {
  const { colors, fonts } = useTheme();
  const metal = colors.accentMetal ?? [colors.accent, colors.accent, colors.accent];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityRole="header" accessible accessibilityLabel={APP_NAME}>
      <View style={{ width: 14, height: 20, transform: [{ skewX: '-14deg' }], shadowColor: colors.accent, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}>
        <Svg width={14} height={20}>
          <Defs>
            <LinearGradient id="wm" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={metal[0]} />
              <Stop offset="0.5" stopColor={metal[1]} />
              <Stop offset="1" stopColor={metal[2]} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={14} height={20} fill="url(#wm)" />
        </Svg>
      </View>
      <Text
        importantForAccessibility="no"
        style={{ fontFamily: fonts.displayHeavy, fontSize: 20, lineHeight: 24, letterSpacing: 2.4, textTransform: 'uppercase' }}
        color={color ?? colors.text}
      >
        {APP_NAME}
      </Text>
    </View>
  );
}
