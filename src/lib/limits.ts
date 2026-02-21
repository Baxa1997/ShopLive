// lib/limits.ts
// Supabase-backed generation limit tracker with three-tier system:
// 1. Anonymous users: 2 free generations (localStorage)
// 2. Logged-in free users: 4 total generations (2 anonymous + 2 bonus after sign-up)
// 3. Pro users: Unlimited generations

import { createClient } from '@/utils/supabase/client';

/** Limit for anonymous (not logged-in) users */
export const ANON_FREE_LIMIT = 2;

/** Total limit for logged-in free users (they get 2 more on top of anonymous) */
export const LOGGED_IN_FREE_LIMIT = 2;

/** @deprecated — kept for backward compat; equals ANON_FREE_LIMIT */
export const FREE_LIMIT = ANON_FREE_LIMIT;

export interface UsageStatus {
  count: number;           // generations used today
  limit: number;           // total allowed for current tier
  isPro: boolean;          // true if subscribed to pro plan
  isLoggedIn: boolean;     // true if Supabase session exists
  remaining: number;       // how many are left
  canGenerate: boolean;    // false if limit hit
  /** Which gate should be shown when canGenerate is false */
  gate: 'none' | 'signup' | 'payment';
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
      return {
        count: 0,
        limit: ANON_FREE_LIMIT,
        isPro: false,
        isLoggedIn: false,
        remaining: ANON_FREE_LIMIT,
        canGenerate: true,
        gate: 'none',
      };
    }
    const count = Number(savedCount) || 0;
    const canGenerate = count < ANON_FREE_LIMIT;
    return {
      count,
      limit: ANON_FREE_LIMIT,
      isPro: false,
      isLoggedIn: false,
      remaining: Math.max(0, ANON_FREE_LIMIT - count),
      canGenerate,
      gate: canGenerate ? 'none' : 'signup',
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
    return {
      count: 0,
      limit: LOGGED_IN_FREE_LIMIT,
      isPro: false,
      isLoggedIn: true,
      remaining: LOGGED_IN_FREE_LIMIT,
      canGenerate: true,
      gate: 'none',
    };
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
      limit: isPro ? Infinity : LOGGED_IN_FREE_LIMIT,
      isPro,
      isLoggedIn: true,
      remaining: isPro ? Infinity : LOGGED_IN_FREE_LIMIT,
      canGenerate: true,
      gate: 'none',
    };
  }

  const count = profile.daily_generation_count ?? 0;
  const limit = isPro ? Infinity : LOGGED_IN_FREE_LIMIT;
  const remaining = isPro ? Infinity : Math.max(0, limit - count);
  const canGenerate = isPro || count < LOGGED_IN_FREE_LIMIT;

  return {
    count,
    limit,
    isPro,
    isLoggedIn: true,
    remaining,
    canGenerate,
    gate: canGenerate ? 'none' : 'payment',
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
    if (count >= ANON_FREE_LIMIT) return false;
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

  if (currentCount >= LOGGED_IN_FREE_LIMIT) return false;

  await supabase
    .from('profiles')
    .update({
      daily_generation_count: currentCount + 1,
      daily_reset_date: today,
    })
    .eq('id', user.id);

  return true;
}
