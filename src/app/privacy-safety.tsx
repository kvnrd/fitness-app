import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { loadConsents } from '../auth/consents';
import { useSession } from '../auth/SessionProvider';
import { HEALTH_POLICY, legalTextHash, legalTexts } from '../legal/text';
import { submitPrivacySafety, uploadWeightGoal } from '../onboarding/api';
import { GENERIC_FAILURE } from '../onboarding/copy';
import { deviceSetupStore } from '../onboarding/deviceStorage';
import { initPs, submission } from '../onboarding/privacySafety';
import { PrivacySafetyScreen } from '../onboarding/screens/PrivacySafety';
import { uploadWeightAfterPrivacy } from '../onboarding/weightUpload';

/**
 * Privacy & safety (adult and teen). Continue → submit_privacy_safety with the exact versions + SHA-256 of the texts shown
 * + the health policy hash. Then, only if health is on and an adult weight goal is on the device, upload it through the
 * health-record function and delete the device copy on success; health off keeps it on the device. [ATTORNEY]
 */
export default function PrivacySafetyRoute() {
  const { user, onboarding, refreshRole } = useSession();
  const teen = !!onboarding?.is_minor;
  const [ps, setPs] = useState(() => initPs(teen ? 'teen' : 'adult'));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Teen: a switch is unlocked only if the parent already granted that scope.
  useEffect(() => {
    if (!teen || !user) return;
    let alive = true;
    void loadConsents(user.id).then((r) => {
      if (alive && r.ok) setPs((s) => ({ ...s, parentGrants: { health: r.state.health_data.parent, ai: r.state.ai_vendor.parent } }));
    });
    return () => {
      alive = false;
    };
  }, [teen, user]);

  async function onContinue() {
    const sub = submission(ps);
    if (!sub || busy || !user) return;
    setBusy(true);
    setMessage(null);
    const health = legalTexts.health();
    const ai = teen ? legalTexts.aiTeen() : legalTexts.aiAdult();
    const risk = legalTexts.riskAdult(); // the teen sees the same notice as adults
    const [hh, ah, rh] = await Promise.all([legalTextHash(health), legalTextHash(ai), legalTextHash(risk)]);
    const r = await submitPrivacySafety({
      health: sub.health,
      healthVersion: health.version,
      healthHash: hh,
      ai: sub.ai,
      aiVersion: ai.version,
      aiHash: ah,
      riskVersion: risk.version,
      riskHash: rh,
      healthPolicyHash: HEALTH_POLICY.hash,
    });
    if (!r.ok) {
      setBusy(false);
      setMessage(r.reason === 'parent_consent_required' ? 'Your parent needs to agree before health or AI can turn on. Leave them off to continue.' : GENERIC_FAILURE);
      return;
    }
    await uploadWeightAfterPrivacy(deviceSetupStore, user.id, { healthOn: sub.health, isMinor: teen }, uploadWeightGoal).catch(() => 'failed'); // kept on device if it fails
    await refreshRole(); // privacy_done flips → the gate opens the app
    setBusy(false);
  }

  return <PrivacySafetyScreen state={ps} onChange={setPs} onOpenHealthPolicy={() => router.push('/legal/health-privacy')} busy={busy} message={message} onContinue={() => void onContinue()} />;
}
