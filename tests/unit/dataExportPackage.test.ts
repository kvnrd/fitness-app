import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_EXPORT_CRASH_REPORTS_LINE,
  DATA_EXPORT_DELIVERY,
  DATA_EXPORT_EXCLUDED,
  DATA_EXPORT_FOOTER,
  DATA_EXPORT_LEAD,
  DATA_EXPORT_LEAD_WITHOUT_PHOTOS,
  dataExportLead,
  DATA_EXPORT_FORMAT,
  DATA_EXPORT_INCLUDED_KEYS,
  DATA_EXPORT_LINK_TTL_MS,
  DATA_EXPORT_PASSWORD,
  canIssueDataExportLink,
  dataExportLabelsFor,
  dataExportLinkExpired,
  parentCanExportTeenData,
  parentExportedDataNotice,
} from '../../src/progress/dataExportPackage.ts';
import { PARENT_CAN_EXPORT_TEEN_DATA } from '../../src/progress/phase5Flags.ts';
import { PARENT_HEALTH_DELETION_NOTICE_AFTER_DATE, parentCausedHealthDeletionNotice, turningHealthOffDeletesHealthCopy } from '../../src/progress/teenWeight.ts';
import { PARENT_PRIVACY_CHANGE_LOCK_SCREEN, parentHealthDeletionLockScreenPreview } from '../../src/settings/lockScreenPreview.ts';

test('Download my data is one ZIP of JSON/CSV plus photos, via a short-lived lock-gated link', () => {
  assert.equal(DATA_EXPORT_FORMAT, 'zip');
  assert.equal(DATA_EXPORT_DELIVERY, 'short_lived_in_app_link');
  assert.equal(DATA_EXPORT_PASSWORD, false);
  assert.equal(DATA_EXPORT_LINK_TTL_MS, 15 * 60_000);
  assert.equal(canIssueDataExportLink(false), false);
  assert.equal(canIssueDataExportLink(true), true);
  const expires = new Date('2026-11-16T12:15:00Z');
  assert.equal(dataExportLinkExpired(expires, new Date('2026-11-16T12:14:59Z')), false);
  assert.equal(dataExportLinkExpired(expires, new Date('2026-11-16T12:15:00Z')), true);
});

test('the included and excluded sets match Counsel Rev 4, and inapplicable rows are hidden', () => {
  for (const k of [
    'account_and_settings', 'training_setup', 'workouts_sets_prs', 'ai_plans', 'health_info',
    'connected_health_apps', 'progress_photos', 'coach_messages', 'privacy_choices',
    'who_received_data', 'purchases', 'requests',
  ]) {
    assert.ok((DATA_EXPORT_INCLUDED_KEYS as readonly string[]).includes(k));
  }
  for (const k of [
    'ip_and_device_hashes', 'pepper', 'encryption_keys', "other_people's_data",
    'safety_moderation_ncmec', 'security_and_rate_limit_logs', 'ai_system_prompts',
    'vendor_held_crash_and_analytics',
  ]) {
    assert.ok((DATA_EXPORT_EXCLUDED as readonly string[]).includes(k));
  }
  const teenEmpty = dataExportLabelsFor({ isMinor: true, hasConnectedApps: false, hasCoach: false, photoCount: 0 });
  assert.equal(teenEmpty.includes('Progress photos'), false);
  assert.equal(teenEmpty.includes('Connected health apps'), false);
  assert.equal(teenEmpty.includes('Messages with your coach'), false);
  assert.ok(teenEmpty.includes('Account and settings'));
  // Existence, not age, except photos, which never appear for 16–17s.
  const teenWithData = dataExportLabelsFor({ isMinor: true, hasConnectedApps: true, hasCoach: true, photoCount: 4 });
  assert.equal(teenWithData.includes('Progress photos'), false);
  assert.ok(teenWithData.includes('Connected health apps'));
  assert.ok(teenWithData.includes('Messages with your coach'));
  const adultNoPhotos = dataExportLabelsFor({ isMinor: false, hasConnectedApps: false, hasCoach: false, photoCount: 0 });
  assert.equal(adultNoPhotos.includes('Progress photos'), false);
  assert.equal(adultNoPhotos.includes('Connected health apps'), false);
  const adult = dataExportLabelsFor({ isMinor: false, hasConnectedApps: true, hasCoach: true, photoCount: 3 });
  assert.ok(adult.includes('Progress photos'));
  assert.equal(DATA_EXPORT_CRASH_REPORTS_LINE, false);
  assert.equal(DATA_EXPORT_FOOTER, "Some records aren't included, like security logs and other people's information. Ask us through Your privacy rights.");
  assert.equal(/crash/i.test(DATA_EXPORT_FOOTER), false);
  assert.equal(PARENT_CAN_EXPORT_TEEN_DATA, false);
  assert.equal(parentCanExportTeenData(), false);
  assert.equal(parentExportedDataNotice(), 'Your parent downloaded a copy of your data.');
});

test('Rev 4 Health-off copy covers all saved health info and AI planning', () => {
  assert.match(turningHealthOffDeletesHealthCopy('teen'), /AI planning/);
  assert.match(turningHealthOffDeletesHealthCopy('teen'), /saved health info, including your weight/);
  assert.match(turningHealthOffDeletesHealthCopy('parent', 'Sam'), /deletes Sam's saved health info/);
  const requestAt = new Date(Date.UTC(2026, 10, 16));
  const withDate = parentCausedHealthDeletionNotice({ requestAt, guaranteed: true, now: requestAt });
  assert.match(withDate, /by 2026-12-16/);
  assert.match(withDate, /AI planning is off too/);
  assert.equal(/ask your parent/i.test(withDate), false);
  const without = parentCausedHealthDeletionNotice({ requestAt, guaranteed: false, now: requestAt });
  assert.equal(/by 2026-12-16/.test(without), false);
  assert.match(without, /within 30 days/);
  const after = parentCausedHealthDeletionNotice({ requestAt, guaranteed: true, now: new Date(Date.UTC(2026, 11, 16)) });
  assert.equal(after, PARENT_HEALTH_DELETION_NOTICE_AFTER_DATE);
  assert.equal(/from the app|will be gone|by 2026-12-16/.test(after), false);
  assert.equal(parentHealthDeletionLockScreenPreview(), 'Your parent changed a privacy setting.');
  assert.equal(parentHealthDeletionLockScreenPreview(), PARENT_PRIVACY_CHANGE_LOCK_SCREEN);
  assert.equal(/health|weight|AI/i.test(parentHealthDeletionLockScreenPreview()), false);
});

test('the Download my data lead drops “and photos” when the photos row is hidden', () => {
  assert.equal(
    dataExportLead({ includePhotos: true }),
    'One ZIP file with your data and photos. Data is in common file formats (JSON and CSV).',
  );
  assert.equal(dataExportLead({ includePhotos: true }), DATA_EXPORT_LEAD);
  assert.equal(
    dataExportLead({ includePhotos: false }),
    'One ZIP file with your data. Data is in common file formats (JSON and CSV).',
  );
  assert.equal(dataExportLead({ includePhotos: false }), DATA_EXPORT_LEAD_WITHOUT_PHOTOS);
  assert.equal(dataExportLead({ isMinor: true, photoCount: 4 }), DATA_EXPORT_LEAD_WITHOUT_PHOTOS);
  assert.equal(dataExportLead({ isMinor: false, photoCount: 0 }), DATA_EXPORT_LEAD_WITHOUT_PHOTOS);
  assert.equal(dataExportLead({ isMinor: false, photoCount: 2 }), DATA_EXPORT_LEAD);
  assert.equal(/and photos/.test(DATA_EXPORT_LEAD_WITHOUT_PHOTOS), false);
});
