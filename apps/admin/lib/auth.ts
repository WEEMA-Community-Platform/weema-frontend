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
export const AUTH_API_BASE_URL =
  process.env.AUTH_API_BASE_URL ?? "http://159.65.220.133:8084";
export const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.AUTH_API_BASE_URL ?? "http://159.65.220.133:8084";
export const AUTH_API_PREFIX = "/api/auth";

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
