import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = ['/signin'];

function getJwtKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-audit-platform-jwt-secret-key-32-chars-min' : null);
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  
  const cookie = request.cookies.get('audit_session')?.value;
  let session = null;
  
  if (cookie) {
    try {
      const key = getJwtKey();
      if (key) {
        const { payload } = await jwtVerify(cookie, key, { algorithms: ['HS256'] });
        session = payload;
      }
    } catch {
      // invalid token
    }
  }

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
