'use client';

// providers.tsx — wraps the app with AuthProvider + Navbar
// Auth is now handled by Supabase

import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Robust check to hide Navbar on login page
  // This covers '/login', '/login/', and any sub-paths
  const shouldHideNavbar = pathname?.startsWith('/login');

  return (
    <AuthProvider>
      {!shouldHideNavbar && <Navbar />}
      {children}
    </AuthProvider>
  );
}
