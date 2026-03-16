import { API_BASE_URL, AUTH_API_BASE_URL, AUTH_API_PREFIX } from "@/lib/auth";

export function buildAuthBackendUrl(pathname: string) {
  const base = AUTH_API_BASE_URL.replace(/\/$/, "");
  return `${base}${AUTH_API_PREFIX}${pathname}`;
}

export function buildBackendUrl(pathname: string) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${normalizedPath}`;
}

export async function safeJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

