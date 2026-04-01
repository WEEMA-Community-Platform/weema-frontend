import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RefreshResponse } from "@weema/auth";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getSecureCookieOptions,
} from "@/lib/auth";
import { buildAuthBackendUrl, proxyAuthFetch, safeJson } from "./_lib";

export async function tryRefreshSessionCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

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

  if (!backendResponse.ok || !payload?.accessToken) {
    return null;
  }

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    payload.accessToken,
    getSecureCookieOptions()
  );

  if (payload.refreshToken) {
    cookieStore.set(
      REFRESH_TOKEN_COOKIE,
      payload.refreshToken,
      getSecureCookieOptions()
    );
  }

  return payload.accessToken;
}

export function clearAuthCookiesOnResponse(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...getSecureCookieOptions(new Date(0)),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...getSecureCookieOptions(new Date(0)),
    maxAge: 0,
  });
  return response;
}

export function unauthorizedJsonResponse() {
  const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return clearAuthCookiesOnResponse(response);
}
