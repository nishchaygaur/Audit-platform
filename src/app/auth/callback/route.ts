import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAppUser } from '@/lib/auth';
import type { EmailOtpType } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getRedirectUrl(request: NextRequest, targetPath: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const origin = request.nextUrl.origin;
  const isLocalEnv = process.env.NODE_ENV === 'development';

  const base = isLocalEnv
    ? origin
    : forwardedHost
    ? `${forwardedProto || 'https'}://${forwardedHost}`
    : origin;

  return `${base}${targetPath}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  // Supabase error parameters passed in query string (e.g. ?error=access_denied&error_code=otp_expired)
  const errorParam = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  if (errorParam || errorCode) {
    console.error('[Auth Callback] Supabase error encountered:', {
      error: errorParam,
      errorCode,
      errorDescription,
    });
    const mappedError = errorCode || errorParam || 'auth_callback_failed';
    return NextResponse.redirect(
      getRedirectUrl(
        request,
        `/signin?error=${encodeURIComponent(mappedError)}${
          errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''
        }`
      )
    );
  }

  // Validate redirect destination against open redirects: must start with single '/' and not '//'
  let safeNext = '/workspaces';
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    safeNext = next;
  } else if (type === 'recovery') {
    safeNext = '/reset-password';
  }

  // If neither code nor token_hash is supplied, reject immediately without touching session
  if (!code && !token_hash) {
    console.warn('[Auth Callback] Neither code nor token_hash provided in callback query parameters');
    return NextResponse.redirect(getRedirectUrl(request, '/signin?error=auth_callback_failed'));
  }

  const supabase = await createClient();

  // 1. PKCE Code Exchange flow
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.user) {
      console.error('[Auth Callback] Code exchange failed:', error?.message);
      await supabase.auth.signOut().catch(() => {});
      const isExpired = error?.message?.toLowerCase().includes('expired') || false;
      const isPkceMissing =
        error?.message?.toLowerCase().includes('verifier') ||
        error?.message?.toLowerCase().includes('pkce');
      const errCode = isExpired
        ? 'otp_expired'
        : isPkceMissing
        ? 'pkce_verifier_missing'
        : 'auth_callback_failed';
      const descParam = error?.message ? `&error_description=${encodeURIComponent(error.message)}` : '';
      return NextResponse.redirect(getRedirectUrl(request, `/signin?error=${errCode}${descParam}`));
    }

    try {
      await resolveAppUser(data.user);
    } catch (err) {
      console.error('[Auth Callback] CRITICAL: Error resolving application user after code exchange:', err);
      await supabase.auth.signOut().catch(() => {});
      return NextResponse.redirect(getRedirectUrl(request, '/signin?error=user_resolution_failed'));
    }

    return NextResponse.redirect(getRedirectUrl(request, safeNext));
  }

  // 2. Token Hash verification flow (Supabase SSR email confirmation / password recovery)
  if (token_hash) {
    const otpType: EmailOtpType = type || 'email';
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType,
    });

    if (error || !data?.user) {
      console.error('[Auth Callback] verifyOtp failed:', error?.message);
      await supabase.auth.signOut().catch(() => {});
      const isExpired = error?.message?.toLowerCase().includes('expired') || false;
      const errCode = isExpired ? 'otp_expired' : 'auth_callback_failed';
      const descParam = error?.message ? `&error_description=${encodeURIComponent(error.message)}` : '';
      return NextResponse.redirect(getRedirectUrl(request, `/signin?error=${errCode}${descParam}`));
    }

    try {
      await resolveAppUser(data.user);
    } catch (err) {
      console.error('[Auth Callback] CRITICAL: Error resolving application user after verifyOtp:', err);
      await supabase.auth.signOut().catch(() => {});
      return NextResponse.redirect(getRedirectUrl(request, '/signin?error=user_resolution_failed'));
    }

    return NextResponse.redirect(getRedirectUrl(request, safeNext));
  }

  // 3. Neither code nor token_hash supplied
  console.warn('[Auth Callback] Neither code nor token_hash provided in callback query parameters');
  return NextResponse.redirect(getRedirectUrl(request, '/signin?error=auth_callback_failed'));
}
