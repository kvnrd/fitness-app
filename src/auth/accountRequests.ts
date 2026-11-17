import { analyticsInstallId } from '../onboarding/deviceStorage';
import { supabase } from './supabase';

/**
 * Account deletion / data export REQUESTS. These only enqueue a row via the SECURITY DEFINER RPCs
 * (public.request_account_deletion / public.request_data_export) for the signed-in user.
 *
 * Actually deleting the Auth user (auth.admin.deleteUser) and fulfilling the export is a
 * server/admin job using the service role. It is NOT, and must never be, a client action.
 * What is retained after deletion (consent/audit records) is a question for Counsel.
 */
export type RequestResult = { ok: true; requestId: string | null } | { ok: false; message: string };

async function call(fn: 'request_account_deletion' | 'request_data_export'): Promise<RequestResult> {
  if (!supabase) return { ok: false, message: 'Not available right now.' };
  try {
    const { data, error } = await supabase.rpc(fn);
    if (error) return { ok: false, message: 'Could not submit the request. Please try again.' };
    return { ok: true, requestId: typeof data === 'string' ? data : null };
  } catch {
    return { ok: false, message: 'Could not submit the request. Please try again.' };
  }
}

export async function requestAccountDeletion(): Promise<RequestResult> {
  const result = await call('request_account_deletion');
  if (result.ok) await analyticsInstallId.reset().catch(() => {});
  return result;
}
export const requestDataExport = () => call('request_data_export');
