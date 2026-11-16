import { supabase } from '../auth/supabase';

/**
 * Counsel Q5: no paywall, price, or purchase prompt for a 16-17 user until an active, verified
 * contracting parent is linked (the server also blocks the purchase itself: public.purchases trigger).
 * Fails CLOSED: any error, or no backend, means "don't show a paywall".
 */
export async function canShowPaywall(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('can_purchase');
    return !error && data === true;
  } catch {
    return false;
  }
}
