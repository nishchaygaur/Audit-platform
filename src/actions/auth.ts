'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveAppUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://auditplatform-nu.vercel.app';
}

export type AuthActionResult = {
  success?: boolean;
  error?: string;
  requiresVerification?: boolean;
  message?: string;
};

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase errors to friendly messages
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { error: 'Please verify your email address before signing in.' };
      }
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { error: 'Invalid credentials' };
      }
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Invalid credentials' };
    }

    // Require email verification before application access
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { error: 'Please verify your email address before signing in.' };
    }

    // Resolve and link application user
    try {
      await resolveAppUser(data.user);
    } catch (err) {
      console.error('[Auth] Error resolving application user during sign in:', err);
      await supabase.auth.signOut().catch(() => {});
      return { error: 'Failed to synchronize user account. Please contact support.' };
    }

    return { success: true };
  } catch (err) {
    console.error('[Auth] Error during sign in:', err);
    return { error: 'An error occurred during sign in' };
  }
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  // Enforce Gmail address format validation
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;
  if (!gmailRegex.test(email)) {
    return { error: 'Registration requires a valid Gmail address (@gmail.com or @googlemail.com).' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  try {
    const origin = await getOrigin();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Check if user already exists (Supabase returns empty identities array for already registered user)
    if (data.user?.identities && data.user.identities.length === 0) {
      return { error: 'Email is already registered' };
    }

    // When email verification is required (no active session yet)
    if (!data.session) {
      return {
        success: true,
        requiresVerification: true,
        message: 'Account created. Please check your email and verify your account before signing in.',
      };
    }

    // If auto-confirmed (e.g. dev environment with confirm email turned off)
    if (data.user) {
      await resolveAppUser(data.user);
    }

    return { success: true, requiresVerification: false };
  } catch (err) {
    console.error('[Auth] Error during registration:', err);
    return { error: 'An error occurred during registration' };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[Auth] Error signing out:', err);
  }
  redirect('/signin');
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required' };
  }

  try {
    const origin = await getOrigin();
    const supabase = await createClient();

    await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    // Email enumeration protection: always return a generic success message
    return {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent. Please check your inbox.',
    };
  } catch (err) {
    console.error('[Auth] Error requesting password reset:', err);
    // Even on error, return generic message for enumeration protection
    return {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent. Please check your inbox.',
    };
  }
}

export async function updatePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    // Sign out the recovery session so the user signs in fresh
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    console.error('[Auth] Error updating password:', err);
    return { error: 'Failed to update password. Please try requesting a new reset link.' };
  }
}
