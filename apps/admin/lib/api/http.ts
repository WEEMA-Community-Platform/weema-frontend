/**
 * Shared HTTP helpers for the browser-side `lib/api/*` wrappers.
 * Centralizes the two patterns that were previously duplicated across
 * base-data, community, members and surveys API modules.
 */

export function buildQueryString(
  query: Record<string, string | number | boolean | undefined>
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}
