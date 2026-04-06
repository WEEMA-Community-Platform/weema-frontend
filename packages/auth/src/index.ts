export type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  OtpResponse,
  RefreshResponse,
  ResetPasswordRequest,
  WeemaRole,
} from "./types";
export { createAuthApiClient, extractAuthErrorMessage } from "./api";

import type { WeemaRole } from "./types";

export const ROLE_HOME_PATHS: Record<WeemaRole, string> = {
  admin: "/",
  cluster_admin: "/",
  facilitator: "/",
};

export const ADMIN_ALLOWED_ROLES: WeemaRole[] = ["admin"];
export const FACILITATOR_ALLOWED_ROLES: WeemaRole[] = ["facilitator"];

type JwtPayload = {
  role?: string;
  roles?: string[];
  [key: string]: unknown;
  
};

export function buildBearerToken(accessToken: string) {
  return `Bearer ${accessToken}`;
}

export function normalizeRole(rawRole: string | null | undefined): WeemaRole | null {
  if (!rawRole) return null;

  const normalized = rawRole.trim().toLowerCase();

  if (
    normalized === "admin" ||
    normalized === "role_admin" ||
    normalized === "role_super_admin"
  ) {
    return "admin";
  }
  if (normalized === "cluster_admin" || normalized === "cluster-admin") {
    return "cluster_admin";
  }
  if (normalized === "role_cluster_admin") return "cluster_admin";
  if (normalized === "facilitator") return "facilitator";
  if (normalized === "role_facilitator") return "facilitator";

  return null;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payload = parts[1];
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    const padded = padding ? base64 + "=".repeat(4 - padding) : base64;
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string): WeemaRole | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const singleRole = normalizeRole(payload.role);
  if (singleRole) return singleRole;

  if (Array.isArray(payload.roles)) {
    for (const role of payload.roles) {
      const normalized = normalizeRole(role);
      if (normalized) return normalized;
    }
  }

  return null;
}

export function hasAllowedRole(
  role: WeemaRole | null,
  allowedRoles: readonly WeemaRole[]
) {
  return !!role && allowedRoles.includes(role);
}

export function getHomePathForRole(role: WeemaRole): string {
  return ROLE_HOME_PATHS[role];
}
