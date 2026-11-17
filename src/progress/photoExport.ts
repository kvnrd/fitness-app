/**
 * Counsel Rev 3: export is one ZIP, saved through the system save dialog.
 * Logic and format only; no UI.
 */
import { exifPayloadHasGps, stripPhotoMetadata } from './exif.ts';

export const PHOTO_EXPORT_FORMAT = 'zip' as const;
/** No password-protected ZIP: weak protection and false security. */
export const PHOTO_EXPORT_PASSWORD = false;
/** Main path is the system save dialog, not the general share sheet. */
export const PHOTO_EXPORT_DELIVERY = 'system_save_dialog' as const;
/** A share sheet that only offers the ZIP is an acceptable fallback. */
export const PHOTO_EXPORT_SHARE_SHEET_FALLBACK = 'zip_only' as const;
/** Nothing is deleted automatically after a successful export. */
export const PHOTO_EXPORT_AUTO_DELETE = false;
/** Dates, weight, or watermarks must not be burned into the pixels. */
export const PHOTO_EXPORT_BURN_IN = false;

export type PhotoPoseLabel = 'front' | 'side' | 'back' | 'other';

export type ExportablePhoto = {
  capturedOn: string; // YYYY-MM-DD
  pose: PhotoPoseLabel;
  bytes: Uint8Array;
  mime?: string;
  weightLabel?: string | null;
};

export type PhotoExportOptions = {
  photos: ExportablePhoto[];
  showWeightOnLabels: boolean;
  exportedOn?: string; // YYYY-MM-DD
};

export type PhotoExportFile = { name: string; bytes: Uint8Array };

export type PhotoExportPlan = {
  format: 'zip';
  delivery: 'system_save_dialog';
  shareSheetFallback: 'zip_only';
  password: false;
  autoDeleteAfterExport: false;
  burnIn: false;
  files: PhotoExportFile[];
  readme: string;
};

export function exportFileName(capturedOn: string, pose: PhotoPoseLabel): string {
  const day = capturedOn.slice(0, 10);
  const tag = pose === 'other' ? 'photo' : pose;
  return `${day}-${tag}.jpg`;
}

export function exportReadme(opts: { from: string | null; to: string | null; exportedOn: string; count: number }): string {
  const range = opts.from && opts.to ? `${opts.from} to ${opts.to}` : opts.exportedOn;
  return [
    `Progress photo export (${opts.count} photo${opts.count === 1 ? '' : 's'}).`,
    `Date range: ${range}.`,
    "This copy isn't locked or encrypted.",
    'Location and device details have been stripped.',
  ].join('\n');
}

function uniqueName(used: Set<string>, base: string): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const dot = base.lastIndexOf('.');
  const stem = dot === -1 ? base : base.slice(0, dot);
  const ext = dot === -1 ? '' : base.slice(dot);
  let i = 2;
  let next = `${stem}-${i}${ext}`;
  while (used.has(next)) {
    i += 1;
    next = `${stem}-${i}${ext}`;
  }
  used.add(next);
  return next;
}

/** Build the ZIP contents (files + README). Callers write the archive and open the save dialog. */
export function planPhotoExport(opts: PhotoExportOptions): PhotoExportPlan {
  const used = new Set<string>();
  const files: PhotoExportFile[] = [];
  const days: string[] = [];
  for (const photo of opts.photos) {
    const stripped = stripPhotoMetadata(photo.bytes, photo.mime ?? 'image/jpeg');
    if (exifPayloadHasGps(stripped.bytes)) {
      throw new Error('export_metadata_not_stripped');
    }
    // Weight may appear only as an optional sidecar when the label setting is on.
    // It is never burned into the image, and is omitted when the setting is off.
    const name = uniqueName(used, exportFileName(photo.capturedOn, photo.pose));
    files.push({ name, bytes: stripped.bytes });
    if (opts.showWeightOnLabels && photo.weightLabel) {
      const side = uniqueName(used, name.replace(/\.jpg$/i, '-label.txt'));
      files.push({ name: side, bytes: new TextEncoder().encode(photo.weightLabel) });
    }
    days.push(photo.capturedOn.slice(0, 10));
  }
  days.sort();
  const exportedOn = opts.exportedOn ?? days[days.length - 1] ?? 'unknown';
  const readme = exportReadme({
    from: days[0] ?? null,
    to: days[days.length - 1] ?? null,
    exportedOn,
    count: opts.photos.length,
  });
  files.push({ name: 'README.txt', bytes: new TextEncoder().encode(readme) });
  return {
    format: PHOTO_EXPORT_FORMAT,
    delivery: PHOTO_EXPORT_DELIVERY,
    shareSheetFallback: PHOTO_EXPORT_SHARE_SHEET_FALLBACK,
    password: PHOTO_EXPORT_PASSWORD,
    autoDeleteAfterExport: PHOTO_EXPORT_AUTO_DELETE,
    burnIn: PHOTO_EXPORT_BURN_IN,
    files,
    readme,
  };
}

export function exportLeavesPhotosInPlace(): true {
  return true;
}
