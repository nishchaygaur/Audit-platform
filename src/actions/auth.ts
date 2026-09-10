'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setSession, clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const user = await db.queryOne<{
      id: string;
      name: string;
      email: string;
      password: string;
      role: string;
    }>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    
    if (!user) {
      return { error: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return { error: 'Invalid credentials' };
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await setSession(userObj);
    return { success: true };
  } catch (err) {
    console.error('[Auth] Error during sign in:', err);
    return { error: 'An error occurred during sign in' };
  }
}

export async function signUp(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  // Gmail address format validation
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;
  if (!gmailRegex.test(email)) {
    return { error: 'Registration requires a valid Gmail address (@gmail.com or @googlemail.com).' };
  }

  try {
    const existing = await db.queryOne<{ id: string }>(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (existing) {
      return { error: 'Email is already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    // Use a transaction to ensure all inserts succeed together atomically
    await db.transaction(async (tx) => {
      // Check user count atomically inside the transaction to prevent race conditions
      const userCountRow = await tx.queryOne<{ count: string | number }>('SELECT COUNT(*) as count FROM users');
      const isFirstUser = Number(userCountRow?.count || 0) === 0;

      // Global user role defaults to Viewer for everyone. Workspace roles are authoritative.
      await tx.execute(
        'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        [id, name, email, hashedPassword, 'Viewer']
      );

      if (isFirstUser) {
        const workspaceId = crypto.randomUUID();
        await tx.execute(
          'INSERT INTO workspaces (id, name) VALUES ($1, $2)',
          [workspaceId, 'My Workspace']
        );
        await tx.execute(
          'INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3)',
          [id, workspaceId, 'Owner']
        );
      }
    });

    const userObj = {
      id,
      name,
      email,
      role: 'Viewer',
    };

    await setSession(userObj);
    return { success: true };
  } catch (err: unknown) {
    console.error('[Auth] Error during registration:', err);

    // Controlled duplicate email error handling for race conditions or database unique constraint
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
      return { error: 'Email is already registered' };
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('duplicate key') || message.includes('unique constraint') || message.includes('users_email_key')) {
      return { error: 'Email is already registered' };
    }

    return { error: 'An error occurred during registration' };
  }
}

export async function signOut() {
  await clearSession();
  redirect('/signin');
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Email address is required" };
  }

  try {
    const user = await db.queryOne<{ id: string; name: string }>(
      "SELECT id, name FROM users WHERE LOWER(email) = LOWER($1)",
      [cleanEmail]
    );

    if (!user) {
      return {
        success: false,
        error: "No account registered with this email address.",
      };
    }

    // Generate 6-digit verification code
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    await db.execute(
      "INSERT INTO password_resets (id, email, token, expires_at, used) VALUES ($1, $2, $3, $4, FALSE)",
      [id, cleanEmail, token, expiresAt]
    );

    return {
      success: true,
      token,
      message: `Password reset code generated: ${token}. In production, this would be sent to your email.`,
    };
  } catch (err) {
    console.error("[Auth] Error requesting password reset:", err);
    return {
      success: false,
      error: "An error occurred while generating password reset code.",
    };
  }
}

export async function resetPasswordWithToken(
  email: string,
  token: string,
  newPassword: string
) {
  const cleanEmail = email?.trim().toLowerCase();
  const cleanToken = token?.trim();

  if (!cleanEmail || !cleanToken || !newPassword) {
    return { success: false, error: "All fields are required" };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters long.",
    };
  }

  try {
    const record = await db.queryOne<{
      id: string;
      expires_at: string;
      used: boolean;
    }>(
      "SELECT id, expires_at, used FROM password_resets WHERE LOWER(email) = LOWER($1) AND token = $2 AND used = FALSE ORDER BY created_at DESC LIMIT 1",
      [cleanEmail, cleanToken]
    );

    if (!record) {
      return {
        success: false,
        error: "Invalid or expired reset code. Please request a new one.",
      };
    }

    if (new Date(record.expires_at) < new Date()) {
      return {
        success: false,
        error: "Reset code has expired. Please request a new one.",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.transaction(async (tx) => {
      await tx.execute(
        "UPDATE users SET password = $1 WHERE LOWER(email) = LOWER($2)",
        [hashedPassword, cleanEmail]
      );
      await tx.execute("UPDATE password_resets SET used = TRUE WHERE id = $1", [
        record.id,
      ]);
    });

    return {
      success: true,
      message: "Password reset successfully. You can now sign in.",
    };
  } catch (err) {
    console.error("[Auth] Error resetting password:", err);
    return {
      success: false,
      error: "An error occurred while resetting password.",
    };
  }
}

