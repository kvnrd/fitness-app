import { supabase } from '../auth/supabase';
import { canIssueDataExportLink } from '../progress/dataExportPackage.ts';

/**
 * Queues a "Download my data" request and, when the lock check has passed,
 * asks the server for a short-lived in-app link. The packer lives on the server
 * (`prepare_data_export` / `fetch_data_export`). Parent export of a teen stays
 * behind PARENT_CAN_EXPORT_TEEN_DATA.
 */
export async function requestDataExport(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('request_data_export');
    return !error;
  } catch {
    return false;
  }
}

export async function prepareDataExportLink(lockPassed: boolean): Promise<{ token: string; expiresAt: string } | null> {
  if (!supabase || !canIssueDataExportLink(lockPassed)) return null;
  try {
    const { data, error } = await supabase.rpc('prepare_data_export', { p_lock_passed: true });
    if (error || !data || typeof data !== 'object') return null;
    const token = (data as { token?: string }).token;
    const expiresAt = (data as { expires_at?: string }).expires_at;
    if (!token || !expiresAt) return null;
    return { token, expiresAt };
  } catch {
    return null;
  }
}
