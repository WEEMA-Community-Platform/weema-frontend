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

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string" &&
        payload.message) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
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

