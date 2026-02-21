'use client';

// providers.tsx — wraps the app in GoogleOAuthProvider + AuthProvider + Navbar
// Kept as a separate client component because GoogleOAuthProvider requires 'use client'
// and RootLayout is a server component.

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

// Placeholder Client ID — replace with your actual Google OAuth Client ID
// Get one at: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Navbar />
        {children}
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
