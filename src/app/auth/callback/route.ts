import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAppUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Validate redirect destination against open redirects: must start with single '/' and not '//'
  let safeNext = '/workspaces';
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    safeNext = next;
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      try {
        // Eagerly resolve and link application user
        await resolveAppUser(data.user);
      } catch (err) {
        console.error('[Auth Callback] Error resolving application user:', err);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
      } else {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
    } else {
      console.error('[Auth Callback] Code exchange failed:', error?.message);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`);
}
