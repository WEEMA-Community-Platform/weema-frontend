import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth";
import { buildBackendUrl, safeJson } from "@/app/api/auth/_lib";

type ForwardRequestArgs = {
  path: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

/** Proxies authenticated requests to the backend API (cookie bearer). */
export async function forwardAuthorizedRequest({
  path,
  method,
  body,
}: ForwardRequestArgs) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(buildBackendUrl(path), {
    method,
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await safeJson<unknown>(backendResponse);
  return NextResponse.json(payload, { status: backendResponse.status });
}

export function buildPathWithQuery(request: Request, basePath: string) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}
