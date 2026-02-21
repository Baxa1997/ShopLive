'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
  given_name: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  isLoading: boolean;
  signIn: (user: GoogleUser) => void;
  signOut: () => void;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
  isPro: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shopsready_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const signIn = (googleUser: GoogleUser) => {
    setUser(googleUser);
    localStorage.setItem('shopsready_user', JSON.stringify(googleUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('shopsready_user');
  };

  // Pro status — placeholder until real billing is wired
  const isPro = false;

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, isPro }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
