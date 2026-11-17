import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import { PHOTOS_TAB } from '../phase5bCopy.ts';

export const PROGRESS_CHIPS_TEEN = ['Week', 'Weight', 'Strength', 'Cardio'] as const;
export const PROGRESS_CHIPS_ADULT = ['Week', 'Weight', 'Strength', 'Cardio', PHOTOS_TAB] as const;
export type ProgressChip = (typeof PROGRESS_CHIPS_ADULT)[number];

export function progressChipsFor(isMinor: boolean): readonly ProgressChip[] {
  return isMinor ? PROGRESS_CHIPS_TEEN : PROGRESS_CHIPS_ADULT;
}

export function ProgressChips({
  isMinor,
  selected,
  onSelect,
}: {
  isMinor: boolean;
  selected: ProgressChip;
  onSelect: (chip: ProgressChip) => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const chips = progressChipsFor(isMinor);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {chips.map((chip) => {
        const on = chip === selected;
        return (
          <Pressable
            key={chip}
            onPress={() => onSelect(chip)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={chip}
            style={{
              minHeight: minControlSize,
              paddingHorizontal: 14,
              justifyContent: 'center',
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: on ? colors.accentInk : colors.border,
              backgroundColor: on ? colors.surfaceSunken : 'transparent',
            }}
          >
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>{chip}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
