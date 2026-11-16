import { supabase } from '../auth/supabase';

/**
 * Tell the server that store age-signal sharing was revoked. The RPC stores a boolean flag only
 * and must never raise an age. Nothing personal is sent from the client.
 */
export async function reportStoreSignalRevoked(): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('report_store_signal_revoked');
}
