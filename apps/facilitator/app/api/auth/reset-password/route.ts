import { NextResponse } from "next/server";

import type { ResetPasswordRequest } from "@weema/auth";

import { buildAuthBackendUrl, proxyAuthFetch, safeJson } from "../_lib";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | ResetPasswordRequest
    | null;

  if (!body?.email || !body?.otp || !body?.newPassword) {
    return NextResponse.json(
      { message: "Email, otp and newPassword are required." },
      { status: 400 }
    );
  }

  const backendResponse = await proxyAuthFetch(
    "reset-password",
    buildAuthBackendUrl("/reset-password"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const payload = await safeJson<{ message?: string; statusCode?: string }>(
    backendResponse
  );

  return NextResponse.json(payload ?? { message: "Request failed." }, {
    status: backendResponse.status,
  });
}
