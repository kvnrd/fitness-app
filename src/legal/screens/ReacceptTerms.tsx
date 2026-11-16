import { View } from 'react-native';
import { PolicyScreen } from '../../components/PolicyScreen';
import { Text } from '../../components/ui';
import {
  TERMS,
  TERMS_CHECKBOX_TEXT,
  TERMS_REACCEPT_SUB,
  TERMS_REACCEPT_TITLE,
  TERMS_REACCEPT_WAITING,
  isProductionBuild,
} from '../text';
import { TERMS_DOC } from '../policies/policies.generated';
import { Checkbox } from '../../onboarding/ui/Checkbox';
import { FooterHint, OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { LinkButton } from '../../onboarding/ui/OnbText';
import { useTheme } from '../../theme/ThemeProvider';

const DRAFT_NOTE =
  'This is a pre-production draft (v0.1-draft). Placeholders such as [Company] are still open. You will be asked to accept again before launch.';

export function ReacceptTermsScreen({
  checked,
  onChecked,
  onOpenTerms,
  onAccept,
  onOpenPrivacy,
  busy,
  message,
  waitingForParent = false,
}: {
  checked: boolean;
  onChecked: (v: boolean) => void;
  onOpenTerms: () => void;
  onAccept: () => void;
  onOpenPrivacy?: () => void;
  busy?: boolean;
  message?: string | null;
  waitingForParent?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      contentGap={20}
      footer={
        waitingForParent ? (
          message ? <FooterHint>{message}</FooterHint> : null
        ) : (
          <>
            <PrimaryCta label="Accept and continue" onPress={onAccept} disabled={!checked} busy={busy} />
            {!checked ? <FooterHint>Check the box to continue.</FooterHint> : null}
            {message ? <FooterHint>{message}</FooterHint> : null}
          </>
        )
      }
    >
      <View style={{ gap: 8 }}>
        {!isProductionBuild ? (
          <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Draft · {TERMS.version}
          </Text>
        ) : null}
        <OnbTitle>{TERMS_REACCEPT_TITLE}</OnbTitle>
        <OnbSub>{waitingForParent ? TERMS_REACCEPT_WAITING : TERMS_REACCEPT_SUB}</OnbSub>
      </View>
      {!isProductionBuild && !waitingForParent ? (
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          {DRAFT_NOTE}
        </Text>
      ) : null}
      <LinkButton onPress={onOpenTerms}>Read the Terms of Service</LinkButton>
      {onOpenPrivacy ? <LinkButton onPress={onOpenPrivacy}>Settings › Privacy</LinkButton> : null}
      {waitingForParent ? null : (
        <Checkbox checked={checked} onChange={onChecked} label={TERMS_CHECKBOX_TEXT}>
          <Text color={colors.text} style={{ fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 }}>
            {TERMS_CHECKBOX_TEXT}
          </Text>
        </Checkbox>
      )}
    </OnbScreen>
  );
}

/** Used when the preview should show the full document with the pre-production banner. */
export function TermsDocumentScreen() {
  return (
    <PolicyScreen
      doc={TERMS_DOC}
      note="This is a pre-production draft. Placeholders such as [Company] are still open. Anything you accept now will have to be accepted again before launch."
    />
  );
}
