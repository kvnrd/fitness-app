import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { loadConsents } from '../../auth/consents';
import { useSession } from '../../auth/SessionProvider';
import {
  HEALTH_POLICY,
  HEALTH_REASK_DOWNLOAD_FIRST,
  HEALTH_REASK_TURN_OFF,
  HEALTH_REASK_TURN_OFF_TITLE,
  HEALTH_REASK_TURN_OFF_WARN,
  legalTextHash,
  legalTexts,
} from '../../legal/text';
import { submitPrivacySafety } from '../../onboarding/api';
import { GENERIC_FAILURE } from '../../onboarding/copy';
import { HealthReaskScreen } from '../../settings/screens/HealthReask';
import { requestDataExport } from '../../settings/dataExport';

export default function HealthReaskRoute() {
  const { user, onboarding, refreshRole } = useSession();
  const teen = !!onboarding?.is_minor;
  const waitingForParent = teen && !!onboarding?.health_reask_parent_due && !onboarding?.health_reask_self_due;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(health: boolean, keepAi: boolean) {
    if (busy || !user) return;
    setBusy(true);
    setMessage(null);
    const healthText = legalTexts.health();
    const ai = teen ? legalTexts.aiTeen() : legalTexts.aiAdult();
    const risk = legalTexts.riskAdult();
    const [hh, ah, rh] = await Promise.all([legalTextHash(healthText), legalTextHash(ai), legalTextHash(risk)]);
    let aiOn = false;
    if (keepAi) {
      const c = await loadConsents(user.id);
      aiOn = c.ok && (c.state.ai_vendor.self || c.state.ai_vendor.parent);
    }
    const r = await submitPrivacySafety({
      health,
      healthVersion: healthText.version,
      healthHash: hh,
      ai: health && aiOn,
      aiVersion: ai.version,
      aiHash: ah,
      riskVersion: risk.version,
      riskHash: rh,
      healthPolicyHash: HEALTH_POLICY.hash,
    });
    if (!r.ok) {
      setBusy(false);
      setMessage(r.reason === 'parent_consent_required' ? 'Your parent needs to confirm Health data too.' : GENERIC_FAILURE);
      return;
    }
    await refreshRole();
    setBusy(false);
    if (router.canGoBack()) router.back();
    else router.replace('/settings/privacy');
  }

  function onTurnOff() {
    Alert.alert(HEALTH_REASK_TURN_OFF_TITLE, HEALTH_REASK_TURN_OFF_WARN, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: HEALTH_REASK_DOWNLOAD_FIRST,
        onPress: () => {
          void requestDataExport().then((ok) => {
            setMessage(
              ok
                ? 'We recorded your download request. You can still turn Health data off below.'
                : 'Download is a placeholder until the export packer ships. You can still turn Health data off.',
            );
          });
        },
      },
      { text: HEALTH_REASK_TURN_OFF, style: 'destructive', onPress: () => void submit(false, false) },
    ]);
  }

  return (
    <HealthReaskScreen
      variant={waitingForParent ? 'waiting_parent' : teen ? 'teen' : 'adult'}
      onConfirm={() => void submit(true, true)}
      onTurnOff={onTurnOff}
      onBack={() => router.back()}
      busy={busy}
      message={message}
    />
  );
}
