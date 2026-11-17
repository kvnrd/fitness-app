import { Switch, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  PHOTO_OPT_IN_COLLECT,
  PHOTO_OPT_IN_COLLECT_LABEL,
  PHOTO_OPT_IN_CONTINUE,
  PHOTO_OPT_IN_FOOTER,
  PHOTO_OPT_IN_HEALTH_NOTE_LINK,
  PHOTO_OPT_IN_HEALTH_NOTE_PREFIX,
  PHOTO_OPT_IN_INTRO,
  PHOTO_OPT_IN_NOT_NOW,
  PHOTO_OPT_IN_OFF,
  PHOTO_OPT_IN_OFF_LABEL,
  PHOTO_OPT_IN_SWITCH,
  PHOTO_OPT_IN_TITLE,
  PHOTO_OPT_IN_WHO,
  PHOTO_OPT_IN_WHO_LABEL,
  PHOTO_OPT_IN_WHY,
  PHOTO_OPT_IN_WHY_LABEL,
} from '../phase5bCopy.ts';
import { DEFAULT_PHOTO_OPT_IN_CHECKED } from '../photoConsent.ts';
import { CopyBlock, EqualActions, SheetCard } from './sheet.tsx';

export function PhotoOptInSheet({
  switchOn = DEFAULT_PHOTO_OPT_IN_CHECKED,
  onSwitchChange,
  onNotNow,
  onContinue,
  onOpenHealthPolicy,
}: {
  switchOn?: boolean;
  onSwitchChange: (on: boolean) => void;
  onNotNow: () => void;
  onContinue: () => void;
  onOpenHealthPolicy?: () => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <SheetCard>
      <Text variant="title" accessibilityRole="header">
        {PHOTO_OPT_IN_TITLE}
      </Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {PHOTO_OPT_IN_INTRO}
      </Text>
      <CopyBlock label={PHOTO_OPT_IN_COLLECT_LABEL} body={PHOTO_OPT_IN_COLLECT} />
      <CopyBlock label={PHOTO_OPT_IN_WHY_LABEL} body={PHOTO_OPT_IN_WHY} />
      <CopyBlock label={PHOTO_OPT_IN_WHO_LABEL} body={PHOTO_OPT_IN_WHO} />
      <CopyBlock label={PHOTO_OPT_IN_OFF_LABEL} body={PHOTO_OPT_IN_OFF} />
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
        {PHOTO_OPT_IN_HEALTH_NOTE_PREFIX}{' '}
        <Text
          color={colors.accentInk}
          onPress={onOpenHealthPolicy}
          accessibilityRole="link"
          accessibilityLabel={PHOTO_OPT_IN_HEALTH_NOTE_LINK}
          style={{ fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 }}
        >
          {PHOTO_OPT_IN_HEALTH_NOTE_LINK}
        </Text>
        .
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text color={colors.text} style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16 }}>
          {PHOTO_OPT_IN_SWITCH}
        </Text>
        <Switch value={switchOn} onValueChange={onSwitchChange} accessibilityLabel={PHOTO_OPT_IN_SWITCH} />
      </View>
      <EqualActions left={PHOTO_OPT_IN_NOT_NOW} right={PHOTO_OPT_IN_CONTINUE} onLeft={onNotNow} onRight={onContinue} />
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>
        {PHOTO_OPT_IN_FOOTER}
      </Text>
    </SheetCard>
  );
}
