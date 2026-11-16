import { useEffect, useRef } from 'react';
import { loadConsents } from '../auth/consents';
import { useSession } from '../auth/SessionProvider';
import { uploadWeightGoal } from './api';
import { uploadWeightAfterPrivacy } from './weightUpload';
import { deviceSetupStore } from './deviceStorage';
import { shouldUploadDraft } from './routing';
import { runDraftUpload } from './uploadDraft';

/**
 * Mounted by the root gate for a signed-in user with a profile. Renders nothing.
 *  - On launch: purgeExpired (day 14 from the ACCOUNT's created_at; falls back to the draft's first save).
 *  - On launch and whenever `linked` flips true for a 16-17: upload the device draft; refresh the gate on success.
 * [ATTORNEY] Counsel phase3-review #4.
 */
export function OnboardingSync() {
  const { user, profile, onboarding, refreshRole } = useSession();
  const uid = user?.id ?? null;
  const created = profile?.created_at ? Date.parse(profile.created_at) : NaN;
  const purged = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || purged.current === uid) return;
    purged.current = uid;
    void deviceSetupStore.purgeExpired(uid, Date.now(), Number.isFinite(created) ? created : undefined).catch(() => {});
  }, [uid, created]);

  const linked = !!onboarding && onboarding.is_minor && onboarding.linked;
  useEffect(() => {
    if (!uid || !linked) return;
    let alive = true;
    void (async () => {
      const have = await deviceSetupStore.loadDraft(uid);
      if (!alive || !shouldUploadDraft(onboarding, have !== null)) return;
      if (await runDraftUpload(uid)) await refreshRole();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, linked]);

  // An adult's weight goal that is still on the device goes up as soon as health is on (also if they turn it on later in
  // Your choices) and the device copy is deleted only after the upload succeeded. Health off → it never leaves the device.
  const adultDone = !!onboarding && !onboarding.is_minor && onboarding.privacy_done;
  useEffect(() => {
    if (!uid || !adultDone) return;
    let alive = true;
    void (async () => {
      const r = await loadConsents(uid);
      if (!alive || !r.ok) return;
      await uploadWeightAfterPrivacy(deviceSetupStore, uid, { healthOn: r.state.health_data.self, isMinor: false }, uploadWeightGoal).catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, [uid, adultDone]);
  return null;
}
