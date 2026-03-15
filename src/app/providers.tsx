'use client';

// providers.tsx — wraps the app with AuthProvider + Navbar
// Auth is now handled by Supabase (no GoogleOAuthProvider wrapper needed)

import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define routes where the Navbar should be hidden
  const hideNavbarRoutes = ['/login'];
  const shouldHideNavbar = hideNavbarRoutes.includes(pathname);

  return (
    <AuthProvider>
      {!shouldHideNavbar && <Navbar />}
      {children}
    </AuthProvider>
  );
}
