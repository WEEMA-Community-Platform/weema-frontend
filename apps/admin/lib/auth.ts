import {
  ADMIN_ALLOWED_ROLES,
  getRoleFromToken,
  hasAllowedRole,
  type WeemaRole,
} from "@weema/auth";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const ACCESS_TOKEN_COOKIE = "weema_access_token";
export const REFRESH_TOKEN_COOKIE = "weema_refresh_token";
export const AUTH_APP_URL =
  process.env.NEXT_PUBLIC_AUTH_APP_URL ?? "http://localhost:3000";
/** Must match deployed auth API; keep in sync with apps/admin/.env.example */
export const AUTH_API_BASE_URL =
  process.env.AUTH_API_BASE_URL ?? "http://161.97.171.189:8034";
export const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.AUTH_API_BASE_URL ?? "http://161.97.171.189:8034";
export const AUTH_API_PREFIX = "/api/auth";

/** Whether `AUTH_API_BASE_URL` came from the environment or the code fallback. */
export function getAuthApiBaseUrlSource(): "env" | "fallback" {
  const v = process.env.AUTH_API_BASE_URL;
  return v != null && v !== "" ? "env" : "fallback";
}

export function getSecureCookieOptions(
  expiresAt?: Date
): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  };
}

export function isAllowedAdminRole(role: WeemaRole | null) {
  return hasAllowedRole(role, ADMIN_ALLOWED_ROLES);
}

export function getTokenRole(token: string | undefined) {
  if (!token) return null;
  return getRoleFromToken(token);
}
