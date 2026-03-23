import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  OtpResponse,
  RefreshResponse,
  ResetPasswordRequest,
} from "./types";

export type AuthApiClientConfig = {
  baseUrl: string;
  fetchInit?: RequestInit;
};

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

/** Best-effort string for failed auth API responses (Spring, etc.). */
export function extractAuthErrorMessage(
  payload: unknown,
  httpStatus: number
): string {
  if (payload == null || typeof payload !== "object") {
    return `Request failed with status ${httpStatus}`;
  }
  const o = payload as Record<string, unknown>;

  const asStr = (v: unknown): string | null => {
    if (typeof v === "string" && v.trim()) return v.trim();
    return null;
  };

  const m = asStr(o.message);
  if (m) return m;

  const err = asStr(o.error);
  if (err) return err;

  const det = asStr(o.detail);
  if (det) return det;

  if (typeof o.message === "object" && o.message !== null) {
    const inner = o.message as Record<string, unknown>;
    const innerM = asStr(inner.message) ?? asStr(inner.error);
    if (innerM) return innerM;
  }

  if (Array.isArray(o.errors) && o.errors.length > 0) {
    const first = o.errors[0] as Record<string, unknown>;
    const dm = asStr(first.defaultMessage) ?? asStr(first.message);
    if (dm) return dm;
  }

  return `Request failed with status ${httpStatus}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    throw new Error(extractAuthErrorMessage(payload, response.status));
  }

  return payload as T;
}

export function createAuthApiClient(config: AuthApiClientConfig) {
  const { baseUrl, fetchInit } = config;

  return {
    async login(input: LoginRequest) {
      const response = await fetch(buildUrl(baseUrl, "/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        ...fetchInit,
        body: JSON.stringify(input),
      });
      return parseJson<LoginResponse>(response);
    },

    async requestOtp(email: string) {
      const response = await fetch(
        buildUrl(baseUrl, `/request-otp/${encodeURIComponent(email)}`),
        {
          method: "PATCH",
          credentials: "include",
          ...fetchInit,
        }
      );
      return parseJson<OtpResponse>(response);
    },

    async verifyOtp(email: string, otp: string) {
      const response = await fetch(
        buildUrl(
          baseUrl,
          `/verify-otp/${encodeURIComponent(email)}/${encodeURIComponent(otp)}`
        ),
        {
          method: "GET",
          credentials: "include",
          ...fetchInit,
        }
      );
      return parseJson<OtpResponse>(response);
    },

    async resetPassword(input: ResetPasswordRequest) {
      const response = await fetch(buildUrl(baseUrl, "/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        ...fetchInit,
        body: JSON.stringify(input),
      });
      return parseJson<OtpResponse>(response);
    },

    async refresh() {
      const response = await fetch(buildUrl(baseUrl, "/refresh"), {
        method: "POST",
        credentials: "include",
        ...fetchInit,
      });
      return parseJson<RefreshResponse>(response);
    },

    async logout() {
      const response = await fetch(buildUrl(baseUrl, "/logout"), {
        method: "POST",
        credentials: "include",
        ...fetchInit,
      });
      return parseJson<LogoutResponse>(response);
    },
  };
}

