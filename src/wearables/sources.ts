/** Phase 5b wearables: Apple Health (HealthKit) and Garmin Connect only. */
export const WEARABLE_SOURCES = ['apple_health', 'garmin'] as const;
export type WearableSource = (typeof WEARABLE_SOURCES)[number];

export const WEARABLE_READ_TYPES = ['workouts', 'heart_rate', 'steps', 'active_energy', 'body_weight'] as const;
export type WearableReadType = (typeof WEARABLE_READ_TYPES)[number];

export const OTHER_WEARABLES_AVAILABLE = false as const;

export function isSupportedWearable(source: string): source is WearableSource {
  return (WEARABLE_SOURCES as readonly string[]).includes(source);
}
