'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export type UserPlan = 'free' | 'standard' | 'pro' | 'ultra';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isPro: boolean;       // true for any paid plan (standard, pro, ultra) — backward compat
  userPlan: UserPlan;   // the actual plan tier
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  isPro: false,
  userPlan: 'free',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const supabase = createClient();

  // Derive isPro from userPlan (any active paid plan counts)
  const isPro = userPlan !== 'free';

  // Fetch the profile to get real plan status
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('plan, subscription_status')
      .eq('id', userId)
      .single();

    if (data?.subscription_status === 'active' && ['standard', 'pro', 'ultra'].includes(data?.plan)) {
      setUserPlan(data.plan as UserPlan);
    } else {
      setUserPlan('free');
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in!');
        }
      } else {
        setUserPlan('free');
        if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!');
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserPlan('free');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, isPro, userPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
