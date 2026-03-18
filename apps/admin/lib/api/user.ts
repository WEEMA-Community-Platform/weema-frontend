import type { BaseApiResponse } from "@/lib/api/base-data";

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  firstTimeLogin: boolean;
  active: boolean;
};

export type CurrentUserResponse = BaseApiResponse & {
  user: CurrentUser;
};

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await fetch("/api/user/me", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | (CurrentUserResponse & { message?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Failed to fetch user profile");
  }

  return payload;
}
