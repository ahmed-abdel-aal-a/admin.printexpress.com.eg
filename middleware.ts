import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Helper to construct public URL avoiding internal localhost/port leak
  const buildPublicUrl = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || host.includes('localhost')) {
      url.hostname = 'admin.printexpress.com.eg';
      url.port = '';
      url.protocol = 'https:';
    }
    return url;
  };

  // If visiting /login with a token, redirect to dashboard root
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(buildPublicUrl('/'));
    }
    return NextResponse.next();
  }

  // If no token, redirect to /login
  if (!token) {
    return NextResponse.redirect(buildPublicUrl('/login'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

