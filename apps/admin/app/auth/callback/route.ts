import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, isAllowedAdminRole } from "@/lib/auth";
import { getRoleFromToken } from "@weema/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { message: "Missing token query parameter." },
      { status: 400 }
    );
  }

  const role = getRoleFromToken(token);

  if (!isAllowedAdminRole(role)) {
    return NextResponse.json(
      { message: "Role not allowed for Admin app." },
      { status: 403 }
    );
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
