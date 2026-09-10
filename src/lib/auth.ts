import { createClient } from '@/lib/supabase/server';
import db from '@/lib/db';
import crypto from 'crypto';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Session {
  user: AppUser;
}

/**
 * Resolves a Supabase Auth user to an application user in PostgreSQL.
 * Preserves existing application user IDs and relationships.
 * Idempotently links supabase_user_id to existing email accounts.
 */
export async function resolveAppUser(supabaseUser: SupabaseUser): Promise<AppUser> {
  const supabaseId = supabaseUser.id;
  const email = supabaseUser.email?.trim().toLowerCase() || '';

  if (!email) {
    throw new Error('Authenticated Supabase user must have an email address');
  }

  // 1. Try to find user by linked supabase_user_id
  const userBySupabaseId = await db.queryOne<AppUser>(
    'SELECT id, name, email, role FROM users WHERE supabase_user_id = $1',
    [supabaseId]
  );

  if (userBySupabaseId) {
    return {
      id: userBySupabaseId.id,
      name: userBySupabaseId.name,
      email: userBySupabaseId.email,
      role: userBySupabaseId.role,
    };
  }

  // 2. Try to find existing application user by email and link supabase_user_id
  const userByEmail = await db.queryOne<AppUser & { supabase_user_id: string | null }>(
    'SELECT id, name, email, role, supabase_user_id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (userByEmail) {
    // Link supabase_user_id to existing user without altering id or relationships
    await db.execute(
      'UPDATE users SET supabase_user_id = $1 WHERE id = $2',
      [supabaseId, userByEmail.id]
    );

    return {
      id: userByEmail.id,
      name: userByEmail.name,
      email: userByEmail.email,
      role: userByEmail.role,
    };
  }

  // 3. New user: Create user in application database with race-condition protection
  const fallbackName =
    (supabaseUser.user_metadata?.name as string | undefined)?.trim() ||
    (supabaseUser.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split('@')[0] ||
    'User';

  const newUserId = crypto.randomUUID();

  return await db.transaction(async (tx) => {
    // Check if this is the very first user in the system
    const countRow = await tx.queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM users');
    const isFirstUser = Number(countRow?.count || 0) === 0;

    await tx.execute(
      'INSERT INTO users (id, name, email, password, role, supabase_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [newUserId, fallbackName, email, '', 'Viewer', supabaseId]
    );

    if (isFirstUser) {
      const workspaceId = crypto.randomUUID();
      await tx.execute(
        'INSERT INTO workspaces (id, name) VALUES ($1, $2)',
        [workspaceId, 'My Workspace']
      );
      await tx.execute(
        'INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3)',
        [newUserId, workspaceId, 'Owner']
      );
    }

    return {
      id: newUserId,
      name: fallbackName,
      email,
      role: 'Viewer',
    };
  });
}

/**
 * Returns current authenticated session resolved to application user.
 * Unverified users (unconfirmed email) return null.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Ensure email is verified
    if (!user.email_confirmed_at) {
      return null;
    }

    const appUser = await resolveAppUser(user);
    return { user: appUser };
  } catch (err) {
    console.error('[Auth] Error getting session:', err);
    return null;
  }
}
