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
    const metadataName =
      (supabaseUser.user_metadata?.name as string | undefined)?.trim() ||
      (supabaseUser.user_metadata?.full_name as string | undefined)?.trim();
    if (metadataName && (!userBySupabaseId.name || userBySupabaseId.name === 'User' || userBySupabaseId.name === '')) {
      await db.execute('UPDATE users SET name = $1 WHERE id = $2', [metadataName, userBySupabaseId.id]).catch(() => {});
      userBySupabaseId.name = metadataName;
    }

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
    const metadataName =
      (supabaseUser.user_metadata?.name as string | undefined)?.trim() ||
      (supabaseUser.user_metadata?.full_name as string | undefined)?.trim();

    const nameToUpdate =
      metadataName && (!userByEmail.name || userByEmail.name === 'User' || userByEmail.name === '')
        ? metadataName
        : userByEmail.name;

    // Link supabase_user_id to existing user without altering id, role, or relationships
    await db.execute(
      'UPDATE users SET supabase_user_id = $1, name = $2 WHERE id = $3',
      [supabaseId, nameToUpdate, userByEmail.id]
    );

    return {
      id: userByEmail.id,
      name: nameToUpdate,
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

    // Atomic insert with ON CONFLICT to avoid unique constraint race conditions
    const upserted = await tx.queryOne<AppUser>(
      `INSERT INTO users (id, name, email, password, role, supabase_user_id)
       VALUES ($1, $2, $3, '', 'Viewer', $4)
       ON CONFLICT (email) DO UPDATE
       SET supabase_user_id = EXCLUDED.supabase_user_id,
           name = CASE 
             WHEN users.name IS NULL OR users.name = '' OR users.name = 'User' 
             THEN EXCLUDED.name 
             ELSE users.name 
           END
       RETURNING id, name, email, role`,
      [newUserId, fallbackName, email, supabaseId]
    );

    const resolvedUser = upserted || {
      id: newUserId,
      name: fallbackName,
      email,
      role: 'Viewer',
    };

    if (isFirstUser && resolvedUser.id === newUserId) {
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

    return resolvedUser;
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
    if (!appUser || !appUser.id) {
      console.error('[Auth] resolveAppUser returned invalid user object for:', user.id);
      return null;
    }

    return { user: appUser };
  } catch (err) {
    console.error('[Auth] Error getting session / resolving application user:', err);
    return null;
  }
}
