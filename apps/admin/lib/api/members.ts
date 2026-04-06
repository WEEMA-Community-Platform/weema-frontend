import type { BaseApiResponse } from "@/lib/api/base-data";

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  contactPhone: string | null;
  gender: string;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  religionId: string | null;
  religionName: string | null;
  nationalIdUrl: string | null;
  status: string;
  selfHelpGroupId: string;
  selfHelpGroupName: string;
  fan: string | null;
  locked: boolean;
};

export type MemberListResponse = BaseApiResponse & {
  members: Member[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type MemberDetailResponse = BaseApiResponse & {
  member: Member;
};

export type MemberListQuery = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: string;
  gender?: string;
  maritalStatus?: string;
  shgId?: string;
  religionId?: string;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
  ageFrom?: number;
  ageTo?: number;
  isLocked?: boolean;
};

export type MemberPatchPayload = {
  firstName?: string;
  lastName?: string;
  contactPhone?: string;
  gender?: string;
  dateOfBirth?: string | null;
  maritalStatus?: string | null;
  religionId?: string | null;
  status?: string;
  selfHelpGroupId?: string;
  fan?: string | null;
};

function buildQueryString(query: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : undefined) ?? "Request failed"
    );
  }

  return payload as T;
}

export async function getMembers(query: MemberListQuery = {}) {
  const qs = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    status: query.status,
    gender: query.gender,
    "marital-status": query.maritalStatus,
    "shg-id": query.shgId,
    "religion-id": query.religionId,
    "date-of-birth-from": query.dateOfBirthFrom,
    "date-of-birth-to": query.dateOfBirthTo,
    "age-from": query.ageFrom,
    "age-to": query.ageTo,
    "is-locked": query.isLocked === undefined ? undefined : String(query.isLocked),
  });
  const response = await fetch(`/api/member?${qs}`, {
    cache: "no-store",
    credentials: "include",
  });
  return parseResponse<MemberListResponse>(response);
}

export async function createMember(formData: FormData) {
  const response = await fetch("/api/member", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getMemberById(id: string) {
  const response = await fetch(`/api/member/${id}`, {
    cache: "no-store",
    credentials: "include",
  });
  return parseResponse<MemberDetailResponse>(response);
}

export async function updateMember(id: string, payload: MemberPatchPayload) {
  const response = await fetch(`/api/member/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteMember(id: string) {
  const response = await fetch(`/api/member/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function uploadMemberNationalId(memberId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await fetch(`/api/member/${memberId}/national-id`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function lockMember(id: string) {
  const response = await fetch(`/api/member/${id}/lock`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function unlockMember(id: string) {
  const response = await fetch(`/api/member/${id}/unlock`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function bulkLockMembers(ids: string[]) {
  const response = await fetch("/api/member/bulk/lock", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function bulkUnlockMembers(ids: string[]) {
  const response = await fetch("/api/member/bulk/unlock", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
    credentials: "include",
  });
  return parseResponse<BaseApiResponse>(response);
}
