'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setSession, clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<string, unknown>;
    
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
    console.error(err);
    return { error: 'An error occurred during sign in' };
  }
}

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return { error: 'Email is already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
      id, name, email, hashedPassword, 'Owner'
    );

    const userObj = {
      id,
      name,
      email,
      role: 'Owner', // Defaulting to Admin for first user
    };

    await setSession(userObj);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'An error occurred during registration' };
  }
}

export async function signOut() {
  await clearSession();
  redirect('/signin');
}
