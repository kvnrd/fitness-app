import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { SheetCard, EqualActions, CopyBlock } from './sheet.tsx';
import {
  COACH_SHARE_FOOTER,
  COACH_SHARE_OFF_LABEL,
  COACH_SHARE_WHAT,
  COACH_SHARE_WHAT_LABEL,
  COACH_SHARE_WHO_LABEL,
  COACH_SHARE_WHY_LABEL,
  coachShareIntro,
  coachShareOff,
  coachShareTitle,
  coachShareWho,
  coachShareWhy,
  PHOTO_OPT_IN_CONTINUE,
  PHOTO_OPT_IN_NOT_NOW,
} from '../phase5bCopy.ts';

export function CoachShareSheet({
  coachFirst,
  onNotNow,
  onContinue,
}: {
  coachFirst: string;
  onNotNow: () => void;
  onContinue: () => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <SheetCard>
      <Text variant="title" accessibilityRole="header">{coachShareTitle(coachFirst)}</Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {coachShareIntro(coachFirst)}
      </Text>
      <CopyBlock label={COACH_SHARE_WHAT_LABEL} body={COACH_SHARE_WHAT} />
      <CopyBlock label={COACH_SHARE_WHY_LABEL} body={coachShareWhy(coachFirst)} />
      <CopyBlock label={COACH_SHARE_WHO_LABEL} body={coachShareWho(coachFirst)} />
      <CopyBlock label={COACH_SHARE_OFF_LABEL} body={coachShareOff(coachFirst)} />
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13 }}>{COACH_SHARE_FOOTER}</Text>
      <EqualActions equal left={PHOTO_OPT_IN_NOT_NOW} right={PHOTO_OPT_IN_CONTINUE} onLeft={onNotNow} onRight={onContinue} />
    </SheetCard>
  );
}
