import { router } from 'expo-router';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';

/**
 * TODO [ATTORNEY]: no Terms document exists yet. This is an obvious placeholder (public, no data, mounted outside
 * every guard). When Counsel delivers the Terms, bundle them like the privacy policy and replace this screen.
 */
export default function TermsPlaceholderRoute() {
  const { colors } = useTheme();
  return (
    <OnbScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <Text variant="label" color={colors.danger} style={{ textTransform: 'uppercase' }}>
        Placeholder · not published
      </Text>
      <OnbTitle>Terms</OnbTitle>
      <OnbSub>The Terms are not published yet.</OnbSub>
    </OnbScreen>
  );
}
