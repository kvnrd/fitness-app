import { View } from 'react-native';
import { Text } from '../../components/ui';
import {
  AI_NEEDS_HEALTH_ACTION, AI_NEEDS_HEALTH_DISMISS, AI_NEEDS_HEALTH_TITLE, PRIVACY_SAFETY_TITLE, SECTION_PARENT_OPTIONAL, SECTION_SAFETY, parentAiNeedsHealthBody,
  parentAiText, parentAttestationText, parentCoachText, parentHealthText, parentLinkSubtitle, parentRiskCard, type ParentNames,
} from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import {
  aiDisabled, canConfirm, confirmAiPrompt, confirmHint, dismissAiPrompt, setAi, setAttest, setCoach, setHealth, setRisk, type PcState,
} from '../parentConsent';
import { Checkbox } from '../ui/Checkbox';
import { NeedsHealthNotice, OptionBox, SectionCaption } from '../ui/ConsentCard';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { PrimaryCta } from '../ui/PrimaryCta';
import { RiskCard } from '../ui/RiskCard';
import { Wordmark } from '../ui/Wordmark';

export type ParentConsentProps = {
  names: ParentNames;
  state: PcState;
  onChange: (s: PcState) => void;
  busy?: boolean;
  message?: string | null;
  onConfirm: () => void;
  onBack?: () => void;
};

/**
 * Parent consent: attestation (Counsel text) + three OPTIONAL boxes (all off; Counsel's REQUIRED minor versions, no health items
 * for coach sharing) + the parent risk card (third person). "Confirm and link" needs the attestation AND the parent risk
 * checkbox; the optional boxes never gate it. [ATTORNEY]
 */
export function ParentConsentScreen({ names, state: s, onChange, busy, message, onConfirm, onBack }: ParentConsentProps) {
  const { colors, fonts } = useTheme();
  const att = parentAttestationText(names);
  return (
    <OnbScreen
      onBack={onBack}
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Confirm and link" disabled={!canConfirm(s)} busy={busy} onPress={onConfirm} />
          {!canConfirm(s) ? <FooterHint>{confirmHint(s)}</FooterHint> : null}
        </>
      }
    >
      <Wordmark />
      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 40, textTransform: 'uppercase', letterSpacing: -0.2 }}>
          {PRIVACY_SAFETY_TITLE}
        </Text>
        <Text color={colors.textSecondary} style={{ fontSize: 16, lineHeight: 24 }}>
          {parentLinkSubtitle(names)}
        </Text>
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18 }}>
        <Checkbox checked={s.attest} onChange={(v) => onChange(setAttest(s, v))} label="I confirm the parent or guardian statement">
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 23 }}>
            {att}
          </Text>
        </Checkbox>
      </View>

      <View style={{ gap: 12 }}>
        <SectionCaption>{SECTION_PARENT_OPTIONAL}</SectionCaption>
        <OptionBox title="Health data" body={parentHealthText(names)} checked={s.health} onChange={(v) => onChange(setHealth(s, v))} label="Health data" />
        <OptionBox title="AI plan" body={parentAiText(names)} checked={s.ai} disabled={aiDisabled(s)} onChange={(v) => onChange(setAi(s, v))} label="AI plan" />
        {s.aiPrompt ? (
          <NeedsHealthNotice
            title={AI_NEEDS_HEALTH_TITLE}
            body={parentAiNeedsHealthBody(names)}
            action={AI_NEEDS_HEALTH_ACTION}
            dismiss={AI_NEEDS_HEALTH_DISMISS}
            onAction={() => onChange(confirmAiPrompt(s))}
            onDismiss={() => onChange(dismissAiPrompt(s))}
          />
        ) : null}
        <OptionBox title="Coach sharing" body={parentCoachText(names)} checked={s.coach} onChange={(v) => onChange(setCoach(s, v))} label="Coach sharing" />
      </View>

      <View style={{ gap: 12 }}>
        <SectionCaption>{SECTION_SAFETY}</SectionCaption>
        <RiskCard card={parentRiskCard(names)} checked={s.risk} onChange={(v) => onChange(setRisk(s, v))} />
      </View>
      {message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
