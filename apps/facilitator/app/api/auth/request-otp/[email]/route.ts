import { NextResponse } from "next/server";

import {
  buildAuthBackendUrl,
  handleAuthProxyError,
  proxyAuthFetch,
  safeJson,
} from "../../_lib";

type RouteParams = {
  params: Promise<{ email: string }>;
};

export async function PATCH(_: Request, { params }: RouteParams) {
  const { email } = await params;
  let backendResponse: Response;
  try {
    backendResponse = await proxyAuthFetch(
      "request-otp",
      buildAuthBackendUrl(`/request-otp/${encodeURIComponent(email)}`),
      {
        method: "PATCH",
        headers: { Accept: "*/*" },
        cache: "no-store",
      },
      { email }
    );
  } catch (err) {
    return handleAuthProxyError(err);
  }

  const payload = await safeJson<{ message?: string; statusCode?: string }>(
    backendResponse
  );

  return NextResponse.json(payload ?? { message: "Request failed." }, {
    status: backendResponse.status,
  });
}
