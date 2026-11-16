import type { DeviceSetupStore, UploadResult, WeightGoal } from './deviceSetupStore.ts';

/**
 * After Privacy & safety: the adult weight goal leaves the device ONLY when the health switch is on, and the device
 * copy is deleted ONLY after the upload succeeded. Health off (or a minor) → it stays on the device.
 * 'none' = nothing was stored; 'kept' = health off / not allowed; 'uploaded' = sent and deleted; 'failed' = upload failed, copy kept.
 * [ATTORNEY] Counsel: weight stays on device until health_data is on.
 */
export type WeightUploadOutcome = 'none' | 'kept' | 'uploaded' | 'failed';

export async function uploadWeightAfterPrivacy(
  store: Pick<DeviceSetupStore, 'loadWeightGoal' | 'takeWeightForUpload'>,
  uid: string,
  opts: { healthOn: boolean; isMinor: boolean },
  upload: (g: WeightGoal) => Promise<UploadResult>,
): Promise<WeightUploadOutcome> {
  const stored = await store.loadWeightGoal(uid);
  if (!stored) return 'none';
  if (!opts.healthOn || opts.isMinor) return 'kept';
  return (await store.takeWeightForUpload(uid, { healthOn: true }, upload)) ? 'uploaded' : 'failed';
}
