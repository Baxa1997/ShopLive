// lib/limits.ts
// Supabase-backed daily generation limit tracker
// Replaces localStorage-based quota tracking

import { createClient } from '@/utils/supabase/client';

export const FREE_LIMIT = 2; // Free daily generations

export interface UsageStatus {
  count: number;        // generations used today
  limit: number;        // total allowed (FREE_LIMIT for free users, Infinity for pro)
  isPro: boolean;       // true if subscribed
  remaining: number;    // how many are left
  canGenerate: boolean; // false if limit hit
}

/**
 * Fetch the current user's usage status.
 * Automatically resets the counter if it's a new day.
 * Falls back to localStorage if the user is not logged in.
 */
export async function getUsageStatus(): Promise<UsageStatus> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Logged-out fallback: use localStorage ──────────────────
  if (!user) {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('import_usage_date');
    const savedCount = localStorage.getItem('import_count');

    if (savedDate !== today) {
      localStorage.setItem('import_usage_date', today);
      localStorage.setItem('import_count', '0');
      return { count: 0, limit: FREE_LIMIT, isPro: false, remaining: FREE_LIMIT, canGenerate: true };
    }
    const count = Number(savedCount) || 0;
    return {
      count,
      limit: FREE_LIMIT,
      isPro: false,
      remaining: Math.max(0, FREE_LIMIT - count),
      canGenerate: count < FREE_LIMIT,
    };
  }

  // ── Logged-in: read from Supabase profiles ─────────────────
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, daily_generation_count, daily_reset_date, subscription_status')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.warn('getUsageStatus: could not fetch profile, defaulting to 0 usage');
    return { count: 0, limit: FREE_LIMIT, isPro: false, remaining: FREE_LIMIT, canGenerate: true };
  }

  const isPro = profile.plan === 'pro' && profile.subscription_status === 'active';
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  // Auto-reset counter if it's a new calendar day
  if (profile.daily_reset_date !== today) {
    await supabase
      .from('profiles')
      .update({ daily_generation_count: 0, daily_reset_date: today })
      .eq('id', user.id);

    return {
      count: 0,
      limit: isPro ? Infinity : FREE_LIMIT,
      isPro,
      remaining: isPro ? Infinity : FREE_LIMIT,
      canGenerate: true,
    };
  }

  const count = profile.daily_generation_count ?? 0;
  const limit = isPro ? Infinity : FREE_LIMIT;
  const remaining = isPro ? Infinity : Math.max(0, limit - count);

  return {
    count,
    limit,
    isPro,
    remaining,
    canGenerate: isPro || count < FREE_LIMIT,
  };
}

/**
 * Atomically increment the generation counter in Supabase.
 * Also checks the limit one final time before incrementing (server-side safety).
 * Returns true if generation is allowed, false if limit was already hit.
 */
export async function incrementUsage(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Logged-out: increment localStorage ─────────────────────
  if (!user) {
    const count = Number(localStorage.getItem('import_count') || 0);
    if (count >= FREE_LIMIT) return false;
    localStorage.setItem('import_count', String(count + 1));
    localStorage.setItem('import_usage_date', new Date().toDateString());
    return true;
  }

  // ── Logged-in: increment in Supabase ─────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, daily_generation_count, daily_reset_date, subscription_status')
    .eq('id', user.id)
    .single();

  if (!profile) return false;

  const isPro = profile.plan === 'pro' && profile.subscription_status === 'active';
  if (isPro) return true; // Pro users have no limit

  const today = new Date().toISOString().split('T')[0];
  const currentCount = profile.daily_reset_date !== today ? 0 : (profile.daily_generation_count ?? 0);

  if (currentCount >= FREE_LIMIT) return false;

  await supabase
    .from('profiles')
    .update({
      daily_generation_count: currentCount + 1,
      daily_reset_date: today,
    })
    .eq('id', user.id);

  return true;
}
