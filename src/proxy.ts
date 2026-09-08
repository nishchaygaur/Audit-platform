console.log("PROXY IS RUNNING");
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-audit-platform-dev';
const key = new TextEncoder().encode(SECRET_KEY);

const publicRoutes = ['/signin'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  
  const cookie = request.cookies.get('audit_session')?.value;
  let session = null;
  
  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, key, { algorithms: ['HS256'] });
      session = payload;
    } catch (e) {
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
