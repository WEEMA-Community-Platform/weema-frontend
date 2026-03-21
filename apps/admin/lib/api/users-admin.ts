import type { BaseApiResponse } from "@/lib/api/base-data";

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  active: boolean;
  firstTimeLogin: boolean;
};

export type UsersListResponse = BaseApiResponse & {
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
  users: UserListItem[];
};

export type UserDetailResponse = BaseApiResponse & {
  user: UserListItem;
};

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber?: string;
};

export type UsersListQuery = {
  page: number;
  pageSize: number;
  searchQuery?: string;
  roles?: string[];
  /** Omit to not filter; true/false to filter */
  isActive?: boolean;
};

function buildUsersListSearchParams(q: UsersListQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(q.page));
  params.set("page-size", String(q.pageSize));
  if (q.searchQuery?.trim()) params.set("search-query", q.searchQuery.trim());
  if (q.roles?.length) {
    for (const r of q.roles) params.append("roles", r);
  }
  if (q.isActive !== undefined) {
    params.set("is-active", String(q.isActive));
  }
  return params.toString();
}

export async function getUsers(query: UsersListQuery): Promise<UsersListResponse> {
  const qs = buildUsersListSearchParams(query);
  const response = await fetch(`/api/user?${qs}`, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | (UsersListResponse & { message?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Failed to load users");
  }
  return payload;
}

export async function getUserById(id: string): Promise<UserDetailResponse> {
  const response = await fetch(`/api/user/${id}`, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | (UserDetailResponse & { message?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Failed to load user");
  }
  return payload;
}

export async function createUser(payload: CreateUserPayload): Promise<BaseApiResponse> {
  const response = await fetch("/api/user/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as (BaseApiResponse & { message?: string }) | null;
  if (!response.ok || !data) {
    throw new Error(data?.message ?? "Failed to create user");
  }
  return data;
}

export async function toggleUserActivation(id: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/user/toggle-activation/${id}`, {
    method: "PATCH",
    headers: { Accept: "*/*" },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as (BaseApiResponse & { message?: string }) | null;
  if (!response.ok || !data) {
    throw new Error(data?.message ?? "Failed to update activation");
  }
  return data;
}
