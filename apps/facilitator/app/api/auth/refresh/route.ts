import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import type { RefreshResponse } from "@weema/auth";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getSecureCookieOptions,
} from "@/lib/auth";
import { buildAuthBackendUrl, proxyAuthFetch, safeJson } from "../_lib";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "Missing refresh token cookie." },
      { status: 401 }
    );
  }

  const backendResponse = await proxyAuthFetch(
    "refresh",
    buildAuthBackendUrl("/refresh"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }
  );

  const payload = await safeJson<RefreshResponse & { message?: string }>(
    backendResponse
  );

  if (!backendResponse.ok || !payload) {
    return NextResponse.json(
      { message: payload?.message ?? "Token refresh failed." },
      { status: backendResponse.status || 500 }
    );
  }

  const response = NextResponse.json({
    message: payload.message,
    statusCode: payload.statusCode,
  });

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    payload.accessToken,
    getSecureCookieOptions()
  );

  if (payload.refreshToken) {
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      payload.refreshToken,
      getSecureCookieOptions()
    );
  }

  return response;
}
