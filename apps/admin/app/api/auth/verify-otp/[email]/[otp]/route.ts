import { NextResponse } from "next/server";

import { buildAuthBackendUrl, proxyAuthFetch, safeJson } from "../../../_lib";

type RouteParams = {
  params: Promise<{ email: string; otp: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { email, otp } = await params;
  const verifyPath = `/verify-otp/${encodeURIComponent(email)}/${encodeURIComponent(otp)}`;
  const backendResponse = await proxyAuthFetch(
    "verify-otp",
    buildAuthBackendUrl(verifyPath),
    {
      method: "GET",
      headers: { Accept: "*/*" },
      cache: "no-store",
    },
    { email },
    buildAuthBackendUrl(
      `/verify-otp/${encodeURIComponent(email)}/[redacted]`
    )
  );

  const payload = await safeJson<{ message?: string; statusCode?: string }>(
    backendResponse
  );

  return NextResponse.json(payload ?? { message: "Request failed." }, {
    status: backendResponse.status,
  });
}

