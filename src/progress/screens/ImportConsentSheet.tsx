import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  IMPORT_CONSENT_AGREE,
  IMPORT_CONSENT_BODY,
  IMPORT_CONSENT_CANCEL,
  IMPORT_CONSENT_TITLE,
} from '../phase5bCopy.ts';
import { EqualActions, SheetCard } from './sheet.tsx';

export function ImportConsentSheet({ onCancel, onAgree }: { onCancel: () => void; onAgree: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <SheetCard>
      <Text variant="title" accessibilityRole="header">
        {IMPORT_CONSENT_TITLE}
      </Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {IMPORT_CONSENT_BODY}
      </Text>
      <EqualActions
        left={IMPORT_CONSENT_CANCEL}
        right={IMPORT_CONSENT_AGREE}
        onLeft={onCancel}
        onRight={onAgree}
      />
    </SheetCard>
  );
}
