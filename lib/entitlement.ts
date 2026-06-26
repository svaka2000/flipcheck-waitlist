import { createClient } from '@/lib/supabase/server';

/**
 * True if the signed-in user has an active/trialing Pro subscription.
 * Reads under RLS with the user's own session (no service role needed).
 * Returns false safely if the `subscriptions` table doesn't exist yet (pre-Stripe phase).
 */
export async function isProForUser(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1);
    if (error) return false;
    return !!(data && data.length > 0);
  } catch {
    return false;
  }
}
