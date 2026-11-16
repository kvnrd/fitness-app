import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { SecondaryButton } from '../ui/SecondaryButton';

/** Obviously-unfinished stand-in so the root gate compiles. UI job B replaces each route that renders this. */
export function ComingInJobB({ name, onSignOut }: { name: string; onSignOut?: () => void }) {
  const { colors } = useTheme();
  return (
    <OnbScreen centerContent>
      <Text variant="label" color={colors.danger} style={{ textTransform: 'uppercase' }}>
        Placeholder · {name}
      </Text>
      <OnbTitle>Coming in job B</OnbTitle>
      <OnbSub>This screen is not built yet.</OnbSub>
      {onSignOut ? <SecondaryButton label="Sign out" onPress={onSignOut} /> : null}
    </OnbScreen>
  );
}
