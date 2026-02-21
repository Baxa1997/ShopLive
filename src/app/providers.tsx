'use client';

// providers.tsx — wraps the app with AuthProvider + Navbar
// Auth is now handled by Supabase (no GoogleOAuthProvider wrapper needed)

import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
