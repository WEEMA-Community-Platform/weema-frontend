import { NextResponse } from "next/server";

import { buildAuthBackendUrl, safeJson } from "../../../_lib";

type RouteParams = {
  params: Promise<{ email: string; otp: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { email, otp } = await params;
  const backendResponse = await fetch(
    buildAuthBackendUrl(
      `/verify-otp/${encodeURIComponent(email)}/${encodeURIComponent(otp)}`
    ),
    {
      method: "GET",
      headers: { Accept: "*/*" },
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

