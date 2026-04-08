import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  getTokenRole,
  isAllowedFacilitatorRole,
} from "@/lib/auth";

/**
 * Route protection: requires a valid-looking access cookie + facilitator role for page navigations.
 * Expired access tokens are refreshed automatically on `/api/*` proxy routes (`forwardAuthorizedRequest`);
 * if refresh also fails, cookies are cleared and clients redirect to `/login` (see `app/providers.tsx`).
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicAsset = /\.[a-zA-Z0-9]+$/.test(path);

  if (
    isPublicAsset ||
    path.startsWith("/auth/callback") ||
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = getTokenRole(token);

  if (!token || !isAllowedFacilitatorRole(role)) {
    const loginUrl = new URL("/login", request.url);
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("returnTo", returnTo || "/");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sileo).*)"],
};
