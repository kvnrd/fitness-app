import { View } from 'react-native';
import { Text } from '../../components/ui';
import {
  AI_NEEDS_HEALTH_ACTION, AI_NEEDS_HEALTH_BODY, AI_NEEDS_HEALTH_DISMISS, AI_NEEDS_HEALTH_TITLE, AI_TEEN_LINE, AI_TEXT_VERSION_B, HEALTH_POLICY_LINK_LABEL,
  HEALTH_TEXT_WITH_AI, PRIVACY_SAFETY_SUB_ADULT, PRIVACY_SAFETY_SUB_TEEN, PRIVACY_SAFETY_TITLE, SECTION_AI, SECTION_HEALTH, SECTION_SAFETY, adultRiskCard,
} from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import {
  aiLocked, canContinue, confirmHealthPrompt, continueHint, dismissHealthPrompt, healthLocked, setAi, setHealth, setRisk, type PsState,
} from '../privacySafety';
import { ConsentCard, NeedsHealthNotice, SectionCaption } from '../ui/ConsentCard';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { LinkButton } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { RiskCard } from '../ui/RiskCard';

export type PrivacySafetyProps = {
  state: PsState;
  onChange: (s: PsState) => void;
  onOpenHealthPolicy: () => void;
  busy?: boolean;
  /** Calm error line (generic). */
  message?: string | null;
  onContinue: () => void;
};

/**
 * Privacy & safety: ONE scrolling document with three headed sections, no expanders and no accept-all.
 * Sticky Continue is enabled only by the risk checkbox. Teen: both switches locked until the parent agreed.
 * [ATTORNEY] every text here is Counsel copy from legal/text.ts.
 */
export function PrivacySafetyScreen({ state: s, onChange, onOpenHealthPolicy, busy, message, onContinue }: PrivacySafetyProps) {
  const { colors, fonts } = useTheme();
  const teen = s.audience === 'teen';
  const hLocked = healthLocked(s);
  const aLocked = aiLocked(s);
  return (
    <OnbScreen
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Continue" disabled={!canContinue(s)} busy={busy} onPress={onContinue} />
          {!canContinue(s) ? <FooterHint>{continueHint(s)}</FooterHint> : null}
        </>
      }
    >
      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 40, textTransform: 'uppercase', letterSpacing: -0.2 }}>
          {PRIVACY_SAFETY_TITLE}
        </Text>
        <Text color={colors.textSecondary} style={{ fontSize: 16, lineHeight: 24 }}>
          {teen ? PRIVACY_SAFETY_SUB_TEEN : PRIVACY_SAFETY_SUB_ADULT}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <SectionCaption>{SECTION_HEALTH}</SectionCaption>
        <ConsentCard title="Save my health info." body={HEALTH_TEXT_WITH_AI.slice('Save my health info. '.length)} on={s.health} onChange={(v) => onChange(setHealth(s, v))} locked={hLocked} lockNote={AI_TEEN_LINE} label="Save my health info" />
        <LinkButton onPress={onOpenHealthPolicy}>{HEALTH_POLICY_LINK_LABEL}</LinkButton>
      </View>

      <View style={{ gap: 12 }}>
        <SectionCaption>{SECTION_AI}</SectionCaption>
        <ConsentCard title="Use AI to build my plan." body={AI_TEXT_VERSION_B.slice('Use AI to build my plan. '.length)} on={s.ai} onChange={(v) => onChange(setAi(s, v))} locked={aLocked} lockNote={AI_TEEN_LINE} label="Use AI to build my plan">
          {s.healthPrompt ? (
            <NeedsHealthNotice
              title={AI_NEEDS_HEALTH_TITLE}
              body={AI_NEEDS_HEALTH_BODY}
              action={AI_NEEDS_HEALTH_ACTION}
              dismiss={AI_NEEDS_HEALTH_DISMISS}
              onAction={() => onChange(confirmHealthPrompt(s))}
              onDismiss={() => onChange(dismissHealthPrompt(s))}
            />
          ) : null}
        </ConsentCard>
      </View>

      <View style={{ gap: 12 }}>
        <SectionCaption>{SECTION_SAFETY}</SectionCaption>
        <RiskCard card={adultRiskCard()} checked={s.risk} onChange={(v) => onChange(setRisk(s, v))} />
      </View>
      {message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
