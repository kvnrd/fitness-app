export type NativeAgeStatus = 'sharing' | 'declined' | 'unavailable' | 'verification_required' | 'revoked';

/** Exactly what the native side may return: status and bounds, nothing else. */
export interface NativeAgeResult {
  status: NativeAgeStatus;
  lower: number | null;
  upper: number | null;
}

export interface StoreAgeSignalNative {
  requestAgeRange(gates: number[]): Promise<NativeAgeResult>;
}
