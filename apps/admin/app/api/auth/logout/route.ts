import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getSecureCookieOptions,
} from "@/lib/auth";
import { buildAuthBackendUrl } from "../_lib";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    await fetch(buildAuthBackendUrl("/logout"), {
      method: "POST",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }).catch(() => null);
  }

  const response = NextResponse.json({ message: "Logged out.", statusCode: "OK" });
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

