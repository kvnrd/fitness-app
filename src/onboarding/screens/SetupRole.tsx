import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { COACH_REQUEST_NOTE } from '../copy';
import { TextField } from '../ui/Field';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { OptionCard, Tag } from '../ui/OptionCard';
import { PrimaryCta } from '../ui/PrimaryCta';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StepHeader } from '../ui/StepHeader';

export type RoleProps = {
  role: 'athlete' | 'coach';
  onRole: (r: 'athlete' | 'coach') => void;
  /** Optional coach invite code (memory only; no server call takes it yet). */
  coachInvite: string;
  onCoachInvite: (v: string) => void;
  /** "Have a code from your coach?" */
  codeOpen: boolean;
  onToggleCode: () => void;
  trainerCode: string;
  onTrainerCode: (v: string) => void;
  onApplyCode: () => void;
  /** One generic message for every failure; a distinct calm one for rate limiting. Never says whether a coach exists. */
  codeMessage?: { kind: 'ok' | 'error'; text: string } | null;
  busy?: boolean;
  message?: string | null;
  onContinue: () => void;
  onRequestCoach: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

/** Setup · Step 4 of 8 (adults only). Skip = athlete. [ATTORNEY] adult attestation wording is chrome under the coach CTA. */
export function RoleScreen(p: RoleProps) {
  const { colors, fonts } = useTheme();
  const coach = p.role === 'coach';
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      footer={
        <>
          <PrimaryCta label={coach ? 'Request coach access' : 'Continue'} busy={p.busy} onPress={coach ? p.onRequestCoach : p.onContinue} />
          {coach ? (
            <>
              <FooterHint>Usually reviewed within 1 business day</FooterHint>
              <FooterHint>{COACH_REQUEST_NOTE}</FooterHint>
            </>
          ) : null}
        </>
      }
    >
      <StepHeader eyebrow="Setup" current={4} />
      <View style={{ gap: 10 }}>
        <OnbTitle>How will you use it?</OnbTitle>
        <OnbSub>You can change this later in Profile.</OnbSub>
      </View>
      <View style={{ gap: 16, marginTop: 8 }}>
        <OptionCard title="I’m training" description="Follow your coach’s program and log every set." icon="flash-outline" selected={!coach} onPress={() => p.onRole('athlete')}>
          {!coach ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
              {!p.codeOpen ? (
                <Pressable onPress={p.onToggleCode} accessibilityRole="button" accessibilityLabel="Have a code from your coach?" hitSlop={8}>
                  <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 14, textDecorationLine: 'underline' }}>
                    Have a code from your coach?
                  </Text>
                </Pressable>
              ) : (
                <View style={{ gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TextField
                    label="Coach code · optional"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={p.trainerCode}
                    onChangeText={(v) => p.onTrainerCode(v.toUpperCase().slice(0, 24))}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    maxLength={24}
                    returnKeyType="done"
                    onSubmitEditing={p.onApplyCode}
                  />
                  <SecondaryButton label="Apply code" onPress={p.onApplyCode} disabled={p.busy || !p.trainerCode.trim()} />
                  {p.codeMessage ? (
                    <Text accessibilityLiveRegion="polite" variant="small" color={p.codeMessage.kind === 'error' ? colors.danger : colors.textSecondary}>
                      {p.codeMessage.text}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          ) : null}
        </OptionCard>
        <OptionCard
          title="I’m a coach"
          description={coach ? 'Build programs for your athletes.' : 'Build programs for your athletes. Needs an invite code or verification.'}
          icon="clipboard-outline"
          badge={<Tag>Verified only</Tag>}
          selected={coach}
          onPress={() => p.onRole('coach')}
        >
          {coach ? (
            <View style={{ marginHorizontal: 16, marginBottom: 16, paddingTop: 14, gap: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TextField
                label="Invite code · optional"
                placeholder="FA-7Q2K-…"
                value={p.coachInvite}
                onChangeText={(v) => p.onCoachInvite(v.slice(0, 40))}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                maxLength={40}
                helper="From your gym or head coach. Speeds up approval."
              />
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.accentInk} />
                <Text color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
                  We verify every coach before Studio unlocks. Until then you can train as normal.
                </Text>
              </View>
            </View>
          ) : null}
        </OptionCard>
      </View>
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
