import { router } from 'expo-router';
import { useState } from 'react';
import { useSession } from '../../auth/SessionProvider';
import { myAiPlanState } from '../../ai/api';
import { aiStepRoute, nextAiStep } from '../../ai/flow';
import { HealthSwitchScreen } from '../../ai/screens/HealthSwitch';
import { HEALTH_POLICY, legalTextHash, legalTexts } from '../../legal/text';
import { submitPrivacySafety } from '../../onboarding/api';
import { GENERIC_FAILURE } from '../../onboarding/copy';

function firstName(display: string | null | undefined): string | undefined {
  const n = display?.trim().split(/\s+/)[0];
  return n || undefined;
}

export default function HealthSwitchRoute() {
  const { onboarding, refreshRole, profile } = useSession();
  const teen = !!onboarding?.is_minor;
  const teenName = teen ? firstName(profile?.display_name) ?? 'Alex' : undefined;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onTurnOn() {
    setBusy(true);
    setMessage(null);
    const health = legalTexts.health();
    const ai = teen ? legalTexts.aiTeen() : legalTexts.aiAdult();
    const risk = legalTexts.riskAdult();
    const [hh, ah, rh] = await Promise.all([legalTextHash(health), legalTextHash(ai), legalTextHash(risk)]);
    const r = await submitPrivacySafety({
      health: true,
      healthVersion: health.version,
      healthHash: hh,
      ai: true,
      aiVersion: ai.version,
      aiHash: ah,
      riskVersion: risk.version,
      riskHash: rh,
      healthPolicyHash: HEALTH_POLICY.hash,
    });
    if (!r.ok) {
      setBusy(false);
      setMessage(r.reason === 'parent_consent_required' ? 'Your parent needs to turn Health data on too.' : GENERIC_FAILURE);
      return;
    }
    await refreshRole();
    const s = await myAiPlanState();
    setBusy(false);
    if (s) router.replace(aiStepRoute(nextAiStep(s)));
    else router.replace('/ai/health');
  }

  return (
    <HealthSwitchScreen
      teenName={teenName}
      onTurnOn={() => void onTurnOn()}
      onNotNow={() => router.back()}
      onBack={() => router.back()}
      busy={busy}
      message={message}
    />
  );
}
