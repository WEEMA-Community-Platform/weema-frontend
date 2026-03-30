import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/lib/auth";
import {
  buildBackendUrl,
  isAuthProxyDebugEnabled,
  safeJson,
} from "@/app/api/auth/_lib";

function getMultipartProxyTimeoutMs() {
  const raw = process.env.API_PROXY_UPLOAD_TIMEOUT_MS;
  if (raw === undefined || raw === "") return 120_000;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 120_000;
}

function logMultipartProxy(
  direction: "out" | "in" | "error",
  path: string,
  detail: Record<string, unknown>
) {
  if (!isAuthProxyDebugEnabled()) return;
  const arrow = direction === "out" ? "->" : direction === "in" ? "<-" : "!!";
  console.log(
    `[api-proxy] ${arrow} multipart ${path}`,
    JSON.stringify({ ...detail, resolvedApiBase: API_BASE_URL })
  );
}

type ForwardRequestArgs = {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

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

/** Forward multipart/form-data (do not set Content-Type — boundary is required). */
export async function forwardAuthorizedFormDataRequest({
  path,
  body,
}: {
  path: string;
  body: FormData;
}) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = buildBackendUrl(path);
  const timeoutMs = getMultipartProxyTimeoutMs();
  const signal = AbortSignal.timeout(timeoutMs);
  const started = Date.now();

  logMultipartProxy("out", path, { url, timeoutMs });

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
      cache: "no-store",
      signal,
    });
  } catch (err) {
    const ms = Date.now() - started;
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : String(err);

    if (name === "AbortError" || message.includes("aborted")) {
      logMultipartProxy("error", path, { url, reason: "timeout", timeoutMs, ms });
      return NextResponse.json(
        {
          message: `Upload timed out after ${timeoutMs}ms (Next.js proxy to API). Increase API_PROXY_UPLOAD_TIMEOUT_MS if needed.`,
          code: "UPLOAD_PROXY_TIMEOUT",
        },
        { status: 504 }
      );
    }

    logMultipartProxy("error", path, { url, reason: "fetch_failed", error: message, ms });
    return NextResponse.json(
      {
        message:
          "Could not reach the backend API from the Next.js server (network error before a response).",
        code: "PROXY_CONNECTION_ERROR",
      },
      { status: 502 }
    );
  }

  logMultipartProxy("in", path, {
    url,
    status: backendResponse.status,
    ok: backendResponse.ok,
    ms: Date.now() - started,
  });

  const payload = await safeJson<unknown>(backendResponse);
  return NextResponse.json(payload, { status: backendResponse.status });
}

export function buildPathWithQuery(request: Request, basePath: string) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

