import { NextResponse } from "next/server";

import type { LoginRequest, LoginResponse } from "@weema/auth";
import { extractAuthErrorMessage } from "@weema/auth";
import { getRoleFromToken, normalizeRole } from "@weema/auth";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getSecureCookieOptions,
  isAllowedFacilitatorRole,
} from "@/lib/auth";
import { buildAuthBackendUrl, proxyAuthFetch, safeJson } from "../_lib";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequest | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  const backendResponse = await proxyAuthFetch(
    "login",
    buildAuthBackendUrl("/login"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    { email: body.email }
  );

  const payload = await safeJson<LoginResponse & { message?: string }>(
    backendResponse
  );

  if (!backendResponse.ok || !payload) {
    const message =
      payload != null
        ? extractAuthErrorMessage(payload, backendResponse.status)
        : "Login failed.";
    return NextResponse.json({ message }, { status: backendResponse.status || 500 });
  }

  const role = getRoleFromToken(payload.accessToken) ?? normalizeRole(payload.role);
  if (!isAllowedFacilitatorRole(role)) {
    return NextResponse.json(
      { message: "Your role is not allowed to access the Facilitator app." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    message: payload.message,
    statusCode: payload.statusCode,
    role: payload.role,
    isFirstTimeLogin: payload.isFirstTimeLogin,
    email: payload.email,
  });

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    payload.accessToken,
    getSecureCookieOptions()
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    payload.refreshToken,
    getSecureCookieOptions()
  );

  return response;
}
