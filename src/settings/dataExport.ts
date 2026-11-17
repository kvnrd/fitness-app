import { supabase } from '../auth/supabase';

/**
 * Queues a data-export request. The packer is not built yet
 * (TODO: include consent hashes and matching legal_text_versions; never a raw IP).
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
