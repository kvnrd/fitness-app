import { View } from 'react-native';
import { Text } from '../../components/ui';
import { DOB_HINT_OFF, DOB_PRIVACY_NOTE, DOB_SUB, DOB_TITLE } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import type { DateParts } from '../dob';
import { DobEntry } from '../ui/DobEntry';
import { InfoNote } from '../ui/InfoNote';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { StepHeader } from '../ui/StepHeader';
import { Wordmark } from '../ui/Wordmark';

/**
 * Screen 3 (Account · Step 1 of 8). Neutral on purpose: no defaults, no age hint, no thresholds.
 * `valid` comes from dob.ts (a real, past calendar date); it says nothing about eligibility.
 */
export function DobScreen(p: { value: DateParts; onChange: (v: DateParts) => void; valid: boolean; busy?: boolean; message?: string | null; onContinue: () => void; onBack?: () => void }) {
  const { colors } = useTheme();
  return (
    <OnbScreen
      onBack={p.onBack}
      footer={
        <>
          <PrimaryCta label="Continue" disabled={!p.valid} busy={p.busy} onPress={p.onContinue} />
          {!p.valid ? <FooterHint>{DOB_HINT_OFF}</FooterHint> : null}
        </>
      }
    >
      <StepHeader eyebrow="Account" current={1} />
      <Wordmark />
      <View style={{ gap: 10 }}>
        <OnbTitle>{DOB_TITLE}</OnbTitle>
        <OnbSub>{DOB_SUB}</OnbSub>
      </View>
      <DobEntry value={p.value} onChange={p.onChange} />
      <InfoNote compact>{DOB_PRIVACY_NOTE}</InfoNote>
      {p.message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
