'use client';

// providers.tsx — wraps the app with AuthProvider + Navbar
// Auth is now handled by Supabase

import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define all routes that should not display the global navigation header
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth'];

  // Check if current path matches any auth route
  const isAuthPage = authRoutes.some(route => pathname?.startsWith(route));

  return (
    <AuthProvider>
      {/* Only render Navbar if we are not on an auth-related page */}
      {!isAuthPage && <Navbar />}
      {children}
    </AuthProvider>
  );
}
