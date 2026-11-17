/** Device helper: synced Apple Health / Garmin weight goes through the same server gate as manual entry. */
export const SYNCED_WEIGHT_SOURCES = ['apple_health', 'garmin'] as const;
export type SyncedWeightSource = (typeof SYNCED_WEIGHT_SOURCES)[number];

export function isSyncedWeightSource(source: string): source is SyncedWeightSource {
  return (SYNCED_WEIGHT_SOURCES as readonly string[]).includes(source);
}

/** RPC name used to write a synced weigh-in. The function rejects when health consent is off. */
export const INGEST_SYNCED_WEIGHT_RPC = 'ingest_synced_weight' as const;
