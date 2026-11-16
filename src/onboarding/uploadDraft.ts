import { deviceSetupStore } from './deviceStorage';
import { saveTrainingSetup } from './api';
import { draftUploadPayload } from './setupSteps';

/**
 * Upload a linked 16-17's device-only steps 6-8 draft (takeForUpload → saveTrainingSetup; the device copy is deleted
 * ONLY on success). Idempotent and shared by the gate's sync (app start / link flip) and the Goal step.
 * A failed attempt is not retried until the next app start; the gate then stops waiting for it. [ATTORNEY] Counsel #4
 */
const inflight = new Map<string, Promise<boolean>>();
const gaveUp = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeDraftUpload = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/** Is there a device draft the gate should wait for? false after a failed attempt (retried on next launch). */
export async function hasUploadableDraft(uid: string): Promise<boolean> {
  if (gaveUp.has(uid)) return false;
  return (await deviceSetupStore.loadDraft(uid)) !== null;
}

export function runDraftUpload(uid: string): Promise<boolean> {
  const have = inflight.get(uid);
  if (have) return have;
  const p = (async () => {
    let ok = false;
    try {
      ok = await deviceSetupStore.takeForUpload(uid, async (d) => saveTrainingSetup(draftUploadPayload(d)));
    } catch {
      ok = false;
    }
    if (!ok && (await deviceSetupStore.loadDraft(uid))) gaveUp.add(uid);
    inflight.delete(uid);
    emit();
    return ok;
  })();
  inflight.set(uid, p);
  return p;
}
