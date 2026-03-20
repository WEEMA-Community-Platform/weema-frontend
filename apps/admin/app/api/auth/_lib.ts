import { API_BASE_URL, AUTH_API_BASE_URL, AUTH_API_PREFIX } from "@/lib/auth";

export function buildAuthBackendUrl(pathname: string) {
  const base = (AUTH_API_BASE_URL ?? "").replace(/\/$/, "");
  return `${base}${AUTH_API_PREFIX}${pathname}`;
}

export function buildBackendUrl(pathname: string) {
  const base = (API_BASE_URL ?? "").replace(/\/$/, "");
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${normalizedPath}`;
}

export async function safeJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

/** True in development, or when AUTH_DEBUG is 1/true (use for temporary prod debugging). */
export function isAuthProxyDebugEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.AUTH_DEBUG === "1" ||
    process.env.AUTH_DEBUG === "true"
  );
}

function logAuthProxyLine(
  direction: "out" | "in" | "error",
  label: string,
  detail: Record<string, unknown>
) {
  if (!isAuthProxyDebugEnabled()) return;
  const prefix =
    direction === "out" ? "->" : direction === "in" ? "<-" : "!!";
  console.log(
    `[auth-proxy] ${prefix} ${label}`,
    JSON.stringify({
      ...detail,
      authBaseUrlSource: process.env.AUTH_API_BASE_URL ? "env" : "unset",
      resolvedAuthApiBase: AUTH_API_BASE_URL,
    })
  );
}

/**
 * Server-side fetch to the auth API with optional debug logs (terminal where `pnpm dev` runs).
 * Never log passwords or tokens.
 */
export async function proxyAuthFetch(
  label: string,
  url: string,
  init: RequestInit,
  meta?: Record<string, unknown>,
  /** If the real URL contains secrets, pass a safe variant for logs only. */
  logUrl?: string
): Promise<Response> {
  const urlForLog = logUrl ?? url;
  logAuthProxyLine("out", label, {
    url: urlForLog,
    method: init.method ?? "GET",
    ...meta,
  });
  const started = Date.now();
  try {
    const response = await fetch(url, init);
    logAuthProxyLine("in", label, {
      url: urlForLog,
      status: response.status,
      ok: response.ok,
      ms: Date.now() - started,
    });
    return response;
  } catch (err) {
    logAuthProxyLine("error", label, {
      url: urlForLog,
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function proxyAuthFetchOptional(
  label: string,
  url: string,
  init: RequestInit,
  meta?: Record<string, unknown>,
  logUrl?: string
): Promise<Response | null> {
  const urlForLog = logUrl ?? url;
  logAuthProxyLine("out", label, {
    url: urlForLog,
    method: init.method ?? "GET",
    ...meta,
  });
  const started = Date.now();
  try {
    const response = await fetch(url, init);
    logAuthProxyLine("in", label, {
      url: urlForLog,
      status: response.status,
      ok: response.ok,
      ms: Date.now() - started,
    });
    return response;
  } catch (err) {
    logAuthProxyLine("error", label, {
      url: urlForLog,
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

