import type { ApiEnvelope } from "@/lib/api/types";

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

export type CurrentUserResponse = ApiEnvelope & {
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

export type EditProfilePayload = {
  firstName: string;
  lastName: string;
};

export async function editMyProfile(
  payload: EditProfilePayload
): Promise<ApiEnvelope> {
  const response = await fetch("/api/user/edit-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | (ApiEnvelope & { message?: string })
    | null;
  if (!response.ok || !data) {
    throw new Error(data?.message ?? "Failed to update profile");
  }
  return data;
}

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
};

export async function changeMyPassword(
  payload: ChangePasswordPayload
): Promise<ApiEnvelope> {
  const response = await fetch("/api/user/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | (ApiEnvelope & { message?: string })
    | null;
  if (!response.ok || !data) {
    throw new Error(data?.message ?? "Failed to change password");
  }
  return data;
}
