/**
 * Server-only helpers for proxying requests from the Next.js apps to the
 * upstream auth backend.
 *
 * This module is the single source of truth for how the admin and facilitator
 * apps talk to the auth API. Keeping it here (instead of duplicating a
 * `_lib.ts` per app) means resilience fixes — timeouts, retries, error
 * classification, and diagnostic logging — apply everywhere at once.
 */

/** Thrown when the upstream auth service cannot be reached (DNS, connect
 * timeout, refused, reset, aborted) or is misconfigured. This is distinct from
 * a normal non-2xx auth response, so callers can return 503 instead of 500 and
 * avoid presenting an infrastructure outage as a credentials error. */
export class AuthUpstreamError extends Error {
  readonly code?: string;
  readonly causes: string[];

  constructor(
    message: string,
    options?: { cause?: unknown; code?: string; causes?: string[] }
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AuthUpstreamError";
    this.code = options?.code;
    this.causes = options?.causes ?? [];
  }
}

/**
 * Walk an error's `cause` chain to recover the real reason a `fetch` failed.
 *
 * Node's global fetch (undici) throws a generic `TypeError: fetch failed` and
 * hides the actionable detail (e.g. `UND_ERR_CONNECT_TIMEOUT`, `ECONNREFUSED`,
 * `ENOTFOUND`, `ECONNRESET`, `EAI_AGAIN`) inside `err.cause`. Logging only
 * `err.message` — as the previous implementation did — makes production
 * failures undiagnosable.
 */
export function describeError(err: unknown): {
  message: string;
  code?: string;
  causes: string[];
} {
  const causes: string[] = [];
  let code: string | undefined;
  let current: unknown = err;
  let depth = 0;

  while (current != null && depth < 6) {
    if (current instanceof Error) {
      const c = (current as { code?: string }).code;
      if (c && !code) code = c;
      causes.push(`${current.name}: ${current.message}${c ? ` (${c})` : ""}`);
      current = (current as { cause?: unknown }).cause;
    } else {
      causes.push(String(current));
      break;
    }
    depth += 1;
  }

  return {
    message: err instanceof Error ? err.message : String(err),
    code,
    causes,
  };
}

/** True in development, or when `AUTH_DEBUG` is `1`/`true`. Use to gate
 * verbose proxy logging (errors are always logged regardless). */
export function isAuthProxyDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.AUTH_DEBUG === "1" ||
    process.env.AUTH_DEBUG === "true"
  );
}

export type AuthProxyConfig = {
  /** Base URL for the auth API, e.g. `http://host:8085`. */
  authApiBaseUrl?: string;
  /** Base URL for the general API. Falls back to `authApiBaseUrl`. */
  apiBaseUrl?: string;
  /** Path prefix for auth endpoints, e.g. `/api/auth`. */
  authApiPrefix?: string;
  /** Per-request timeout in ms. Defaults to `AUTH_UPSTREAM_TIMEOUT_MS` or 15000. */
  timeoutMs?: number;
  /** Extra attempts on network failure. Defaults to `AUTH_UPSTREAM_RETRIES` or 1. */
  retries?: number;
  /** When true, emit verbose out/in logs. Errors are always logged. */
  debug?: boolean;
};

type LogDetail = Record<string, unknown>;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createAuthProxy(config: AuthProxyConfig) {
  const authApiBaseUrl = config.authApiBaseUrl;
  const apiBaseUrl = config.apiBaseUrl ?? config.authApiBaseUrl;
  const authApiPrefix = config.authApiPrefix ?? "/api/auth";
  const timeoutMs = config.timeoutMs ?? envInt("AUTH_UPSTREAM_TIMEOUT_MS", 15000);
  const retries = config.retries ?? envInt("AUTH_UPSTREAM_RETRIES", 1);
  const debug = config.debug ?? isAuthProxyDebugEnabled();

  const baseContext = () => ({
    authBaseUrlSource: authApiBaseUrl ? "env" : "unset",
    resolvedAuthApiBase: authApiBaseUrl,
  });

  function log(
    direction: "out" | "in" | "error",
    label: string,
    detail: LogDetail
  ) {
    // Errors must always surface in production; info logs stay behind debug.
    if (direction !== "error" && !debug) return;
    const prefix =
      direction === "out" ? "->" : direction === "in" ? "<-" : "!!";
    const line = `[auth-proxy] ${prefix} ${label}`;
    const payload = JSON.stringify({ ...detail, ...baseContext() });
    if (direction === "error") console.error(line, payload);
    else console.log(line, payload);
  }

  function buildAuthBackendUrl(pathname: string): string {
    const base = (authApiBaseUrl ?? "").replace(/\/$/, "");
    return `${base}${authApiPrefix}${pathname}`;
  }

  function buildBackendUrl(pathname: string): string {
    const base = (apiBaseUrl ?? "").replace(/\/$/, "");
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${base}${normalizedPath}`;
  }

  async function safeJson<T>(response: Response): Promise<T | null> {
    return (await response.json().catch(() => null)) as T | null;
  }

  /**
   * Fetch with a bounded timeout and bounded retries for connect-level
   * failures. Because a thrown fetch means the request never got a response
   * (connection failed), retrying is safe even for POSTs. Throws
   * {@link AuthUpstreamError} on unreachable/misconfigured upstream.
   */
  async function fetchWithResilience(
    label: string,
    url: string,
    init: RequestInit,
    urlForLog: string
  ): Promise<Response> {
    if (!authApiBaseUrl) {
      log("error", label, {
        url: urlForLog,
        error: "AUTH_API_BASE_URL is not configured",
      });
      throw new AuthUpstreamError("Auth service URL is not configured.", {
        code: "CONFIG_MISSING",
      });
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const started = Date.now();
      try {
        const response = await fetch(url, {
          ...init,
          signal: init.signal ?? AbortSignal.timeout(timeoutMs),
        });
        log("in", label, {
          url: urlForLog,
          status: response.status,
          ok: response.ok,
          ms: Date.now() - started,
          attempt,
        });
        return response;
      } catch (err) {
        lastError = err;
        const info = describeError(err);
        const timedOut =
          err instanceof Error &&
          (err.name === "TimeoutError" || err.name === "AbortError");
        log("error", label, {
          url: urlForLog,
          ms: Date.now() - started,
          attempt,
          willRetry: attempt < retries,
          timedOut,
          code: info.code,
          error: info.message,
          causes: info.causes,
        });
        if (attempt < retries) {
          await delay(300 * (attempt + 1));
        }
      }
    }

    const info = describeError(lastError);
    throw new AuthUpstreamError(
      "The authentication service is unreachable.",
      { cause: lastError, code: info.code, causes: info.causes }
    );
  }

  async function proxyAuthFetch(
    label: string,
    url: string,
    init: RequestInit,
    meta?: LogDetail,
    /** If the real URL contains secrets, pass a safe variant for logs only. */
    logUrl?: string
  ): Promise<Response> {
    const urlForLog = logUrl ?? url;
    log("out", label, { url: urlForLog, method: init.method ?? "GET", ...meta });
    return fetchWithResilience(label, url, init, urlForLog);
  }

  async function proxyAuthFetchOptional(
    label: string,
    url: string,
    init: RequestInit,
    meta?: LogDetail,
    logUrl?: string
  ): Promise<Response | null> {
    try {
      return await proxyAuthFetch(label, url, init, meta, logUrl);
    } catch {
      return null;
    }
  }

  return {
    isConfigured: Boolean(authApiBaseUrl),
    buildAuthBackendUrl,
    buildBackendUrl,
    safeJson,
    proxyAuthFetch,
    proxyAuthFetchOptional,
  };
}

export type AuthProxy = ReturnType<typeof createAuthProxy>;
