import { NextResponse } from "next/server";

import {
  AuthUpstreamError,
  createAuthProxy,
  isAuthProxyDebugEnabled,
} from "@weema/auth/server";

import { API_BASE_URL, AUTH_API_BASE_URL, AUTH_API_PREFIX } from "@/lib/auth";

const proxy = createAuthProxy({
  authApiBaseUrl: AUTH_API_BASE_URL,
  apiBaseUrl: API_BASE_URL,
  authApiPrefix: AUTH_API_PREFIX,
});

export const {
  buildAuthBackendUrl,
  buildBackendUrl,
  safeJson,
  proxyAuthFetch,
  proxyAuthFetchOptional,
} = proxy;

export { AuthUpstreamError, isAuthProxyDebugEnabled };

/** 503 response for when the upstream auth service is unreachable. */
export function authServiceUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      message:
        "The authentication service is temporarily unavailable. Please try again in a moment.",
    },
    { status: 503 }
  );
}

/**
 * Maps a caught error to a 503 when it is an upstream/network failure, so an
 * outage is reported distinctly from a real auth error. Re-throws anything
 * else for the framework to handle.
 */
export function handleAuthProxyError(err: unknown): NextResponse {
  if (err instanceof AuthUpstreamError) {
    return authServiceUnavailableResponse();
  }
  throw err;
}
