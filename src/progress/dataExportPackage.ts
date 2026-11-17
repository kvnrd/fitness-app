/**
 * Counsel Rev 4: "Download my data" is one ZIP of JSON/CSV plus photos,
 * generated on the server and delivered through a short-lived in-app link
 * after the photo/app lock check. Logic and lists only; no UI.
 */
export { parentCanExportTeenData, parentExportedDataNotice } from './teenWeight.ts';

export const DATA_EXPORT_FORMAT = 'zip' as const;
export const DATA_EXPORT_PAYLOADS = 'json_csv_plus_photos' as const;
export const DATA_EXPORT_DELIVERY = 'short_lived_in_app_link' as const;
export const DATA_EXPORT_LINK_TTL_MS = 15 * 60_000;
export const DATA_EXPORT_PASSWORD = false;

/**
 * Short labels for the 32b sheet. Visibility is by whether the data exists, not
 * by age, except Progress photos, which never appear for 16–17s. An adult with
 * 0 photos also hides that row. The footer stays the single security-logs line
 * (Rev 5: no separate crash-reports line while events aren't tied to the account).
 */
export const DATA_EXPORT_INCLUDED_LABELS = [
  'Account and settings',
  'Training setup',
  'Workouts, sets and PRs',
  'AI plans',
  'Health info you\'ve saved',
  'Connected health apps',
  'Progress photos',
  'Messages with your coach',
  'Your privacy choices',
  'Who received your data',
  'Purchases',
  'Your requests to us',
] as const;

export const DATA_EXPORT_INCLUDED_KEYS = [
  'account_and_settings',
  'training_setup',
  'workouts_sets_prs',
  'ai_plans',
  'health_info',
  'connected_health_apps',
  'progress_photos',
  'coach_messages',
  'privacy_choices',
  'who_received_data',
  'purchases',
  'requests',
] as const;

export const DATA_EXPORT_EXCLUDED = [
  'ip_and_device_hashes',
  'pepper',
  'encryption_keys',
  'other_people\'s_data',
  'safety_moderation_ncmec',
  'security_and_rate_limit_logs',
  'ai_system_prompts',
  'vendor_held_crash_and_analytics',
] as const;

export const DATA_EXPORT_FOOTER =
  "Some records aren't included, like security logs and other people's information. Ask us through Your privacy rights.";

export const DATA_EXPORT_NOTE =
  "A downloaded copy isn't locked or encrypted, and we can't delete it. Keep it somewhere safe.";

export const DATA_EXPORT_LEAD =
  'One ZIP file with your data and photos. Data is in common file formats (JSON and CSV).';

export const DATA_EXPORT_LEAD_WITHOUT_PHOTOS =
  'One ZIP file with your data. Data is in common file formats (JSON and CSV).';

/** Sheet lead describes the file: drop "and photos" when the photos row is hidden. */
export function dataExportIncludesPhotos(opts: { isMinor: boolean; photoCount: number }): boolean {
  return opts.isMinor !== true && opts.photoCount > 0;
}

export function dataExportLead(opts: { isMinor: boolean; photoCount: number } | { includePhotos: boolean }): string {
  const include = 'includePhotos' in opts ? opts.includePhotos : dataExportIncludesPhotos(opts);
  return include ? DATA_EXPORT_LEAD : DATA_EXPORT_LEAD_WITHOUT_PHOTOS;
}

export const DATA_EXPORT_CRASH_REPORTS_LINE = false;

export function dataExportLabelsFor(opts: {
  isMinor: boolean;
  hasConnectedApps: boolean;
  hasCoach: boolean;
  photoCount: number;
}): string[] {
  return DATA_EXPORT_INCLUDED_LABELS.filter((label) => {
    if (label === 'Progress photos') return opts.isMinor !== true && opts.photoCount > 0;
    if (label === 'Connected health apps') return opts.hasConnectedApps === true;
    if (label === 'Messages with your coach') return opts.hasCoach === true;
    return true;
  });
}

export function canIssueDataExportLink(lockPassed: boolean): boolean {
  return lockPassed === true;
}

export function dataExportLinkExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

