import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { PRIVACY_DOWNLOAD_LABEL } from '../../legal/text.ts';
import {
  DATA_EXPORT_FOOTER,
  DATA_EXPORT_NOTE,
  dataExportLabelsFor,
  dataExportLead,
} from '../dataExportPackage.ts';
import { EqualActions, SheetCard } from './sheet.tsx';

export const DATA_EXPORT_BACK = 'Back' as const;
export const DATA_EXPORT_SAVE_ZIP = 'Save ZIP file' as const;

export function DataExportSheet({
  isMinor,
  hasConnectedApps,
  hasCoach,
  photoCount,
  hasHealthInfo,
  onBack,
  onSave,
}: {
  isMinor: boolean;
  hasConnectedApps: boolean;
  hasCoach: boolean;
  photoCount: number;
  hasHealthInfo: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const { colors, fonts } = useTheme();
  const labels = dataExportLabelsFor({ isMinor, hasConnectedApps, hasCoach, photoCount, hasHealthInfo });
  const lead = dataExportLead({ isMinor, photoCount });
  return (
    <SheetCard>
      <Text variant="title" accessibilityRole="header">{PRIVACY_DOWNLOAD_LABEL}</Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{lead}</Text>
      <View style={{ gap: 0 }}>
        {labels.map((label, i) => (
          <View key={label} style={{ paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
            <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{label}</Text>
          </View>
        ))}
      </View>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>{DATA_EXPORT_FOOTER}</Text>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>{DATA_EXPORT_NOTE}</Text>
      <EqualActions equal left={DATA_EXPORT_BACK} right={DATA_EXPORT_SAVE_ZIP} onLeft={onBack} onRight={onSave} />
    </SheetCard>
  );
}
