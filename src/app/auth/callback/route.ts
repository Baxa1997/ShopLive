import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * This is the OAuth callback route.
 * After Google redirects the user here, this route exchanges
 * the one-time code for a permanent session and saves it in a cookie.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/tools/multi-importer';

  // Use the configured site URL so redirects always go to the production domain,
  // not to localhost (which can happen behind reverse proxies / load balancers).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  console.error('Auth callback error: missing code or exchange failed');
  return NextResponse.redirect(`${siteUrl}/?auth_error=true`);
}
