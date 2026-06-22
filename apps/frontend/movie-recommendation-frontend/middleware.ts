import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type JwtPayload = {
  exp?: number;
  roles?: string[];
  [key: string]: unknown;
};

function base64UrlDecode(input: string) {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  const padding = base64.length % 4;
  if (padding === 2) {
    base64 += '==';
  } else if (padding === 3) {
    base64 += '=';
  } else if (padding !== 0) {
    throw new Error('Invalid base64url string');
  }

  return atob(base64);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const jsonPayload = base64UrlDecode(parts[1]);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload) {
  if (!payload.exp) {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

function redirectToLogin(request: NextRequest, reason: string) {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  loginUrl.searchParams.set('reason', reason);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return redirectToLogin(request, 'missing_token');
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return redirectToLogin(request, 'invalid_token_payload');
  }

  if (isTokenExpired(payload)) {
    return redirectToLogin(request, 'expired_token');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};