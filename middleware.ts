import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * If Supabase OAuth redirects to /?code=... instead of /auth/callback?code=...,
 * redirect to /auth/callback so the session exchange and wallet assignment run.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname !== "/" || !searchParams.has("code")) {
    return NextResponse.next();
  }
  const callbackUrl = new URL("/auth/callback", req.url);
  searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value));
  return NextResponse.redirect(callbackUrl);
}

export const config = {
  matcher: "/",
};
