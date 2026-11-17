import { supabase } from '../auth/supabase';
import { TERMS, termsAcceptanceCounts } from './text';

export type LatestTerms = {
  version: string;
  hash: string | null;
  at: string;
  preProduction: boolean;
};

export async function myLatestTerms(): Promise<LatestTerms | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('my_latest_terms');
    if (error || !data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    return {
      version: typeof d.version === 'string' ? d.version : '',
      hash: typeof d.hash === 'string' ? d.hash : null,
      at: typeof d.at === 'string' ? d.at : '',
      preProduction: d.pre_production === true,
    };
  } catch {
    return null;
  }
}

export async function acceptTerms(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('accept_terms', { p_version: TERMS.version, p_text_hash: TERMS.hash });
    return !error;
  } catch {
    return false;
  }
}

export function needsTermsReaccept(latest: LatestTerms | null): boolean {
  if (!latest) return true;
  return !termsAcceptanceCounts(latest.version, latest.hash);
}
