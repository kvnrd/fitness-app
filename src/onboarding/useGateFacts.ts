import { useEffect, useState } from 'react';
import { deviceFlags } from './deviceStorage';
import { hasUploadableDraft, subscribeDraftUpload } from './uploadDraft';

/** Device-side facts for the root gate (see routing.nextOnboardingRoute). `loaded` is false until both were read for this user. */
export function useGateFacts(uid: string | null, active: boolean): { loaded: boolean; goalDone: boolean; hasDeviceDraft: boolean } {
  const [facts, setFacts] = useState<{ uid: string | null; goalDone: boolean; hasDeviceDraft: boolean }>({ uid: null, goalDone: false, hasDeviceDraft: false });
  useEffect(() => {
    if (!uid || !active) return;
    let alive = true;
    const read = async () => {
      const [goalDone, hasDeviceDraft] = await Promise.all([deviceFlags.goalDone(uid).catch(() => false), hasUploadableDraft(uid).catch(() => false)]);
      if (alive) setFacts({ uid, goalDone, hasDeviceDraft });
    };
    void read();
    const off1 = deviceFlags.subscribe(() => void read());
    const off2 = subscribeDraftUpload(() => void read());
    return () => {
      alive = false;
      off1();
      off2();
    };
  }, [uid, active]);
  return { loaded: !active || (!!uid && facts.uid === uid), goalDone: facts.uid === uid && facts.goalDone, hasDeviceDraft: facts.uid === uid && facts.hasDeviceDraft };
}
