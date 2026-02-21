'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  isPro: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const supabase = createClient();

  // Fetch the profile to get real isPro status
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('plan, subscription_status')
      .eq('id', userId)
      .single();
    setIsPro(data?.plan === 'pro' && data?.subscription_status === 'active');
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsPro(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPro(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, isPro }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
