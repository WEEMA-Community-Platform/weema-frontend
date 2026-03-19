import type { BaseApiResponse } from "@/lib/api/base-data";

export type EntityStatus = "ACTIVE" | "INACTIVE";

// ─── Federation ───────────────────────────────────────────────────────────────

export type Federation = {
  id: string;
  name: string;
  description: string;
  location: string;
  status: EntityStatus;
  managerId: string | null;
  managerName: string | null;
  clusterCount: number;
};

export type FederationPayload = {
  name: string;
  description?: string;
  location?: string;
  status?: EntityStatus;
  managerId?: string;
};

export type FederationListQuery = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: EntityStatus;
  managerId?: string;
  location?: string;
};

export type FederationListResponse = BaseApiResponse & {
  federations: Federation[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type FederationResponse = BaseApiResponse & {
  federation: Federation;
};

// ─── Cluster ──────────────────────────────────────────────────────────────────

export type Cluster = {
  id: string;
  name: string;
  description: string;
  location: string;
  status: EntityStatus;
  managerId: string | null;
  managerName: string | null;
  woredaId: string;
  woredaName: string;
  federationId: string | null;
  federationName: string | null;
  selfHelpGroupCount: number;
};

export type ClusterPayload = {
  name: string;
  description?: string;
  location?: string;
  status?: EntityStatus;
  managerId?: string;
  woredaId: string;
  federationId?: string | null;
};

export type ClusterListQuery = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: EntityStatus;
  managerId?: string;
  woredaId?: string;
  federationId?: string;
  location?: string;
};

export type ClusterListResponse = BaseApiResponse & {
  clusters: Cluster[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type ClusterResponse = BaseApiResponse & {
  cluster: Cluster;
};

// ─── Self-Help Group ──────────────────────────────────────────────────────────

export type SHG = {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: EntityStatus;
  woredaId: string | null;
  woredaName: string | null;
  kebeleId: string | null;
  kebeleName: string | null;
  clusterId: string | null;
  clusterName: string | null;
  facilitatorId: string | null;
  facilitatorName: string | null;
  memberCount: number;
};

export type SHGPayload = {
  name: string;
  description?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: EntityStatus;
  woredaId?: string | null;
  kebeleId?: string | null;
  clusterId?: string | null;
  facilitatorId?: string | null;
};

export type SHGUpdatePayload = SHGPayload & {
  clusterId?: string | null;
};

export type SHGListQuery = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: EntityStatus;
  facilitatorId?: string;
  woredaId?: string;
  kebeleId?: string;
  clusterId?: string;
  location?: string;
};

export type SHGListResponse = BaseApiResponse & {
  selfHelpGroups: SHG[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type SHGResponse = BaseApiResponse & {
  selfHelpGroup: SHG;
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}

// ─── Single-item response types ──────────────────────────────────────────────

export type FederationDetailResponse = BaseApiResponse & {
  federation: Federation;
};

export type ClusterDetailResponse = BaseApiResponse & {
  cluster: Cluster;
};

export type SHGDetailResponse = BaseApiResponse & {
  selfHelpGroup: SHG;
};

// ─── Federation fetch functions ───────────────────────────────────────────────

export async function getFederations(query: FederationListQuery = {}) {
  const qs = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    status: query.status,
    "manager-id": query.managerId,
    location: query.location,
  });
  const response = await fetch(`/api/federation?${qs}`, { cache: "no-store" });
  return parseResponse<FederationListResponse>(response);
}

export async function createFederation(payload: FederationPayload) {
  const response = await fetch("/api/federation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateFederation(id: string, payload: FederationPayload) {
  const response = await fetch(`/api/federation/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getFederationById(id: string) {
  const response = await fetch(`/api/federation/${id}`, { cache: "no-store" });
  return parseResponse<FederationDetailResponse>(response);
}

export async function deleteFederation(id: string) {
  const response = await fetch(`/api/federation/${id}`, { method: "DELETE" });
  return parseResponse<BaseApiResponse>(response);
}

export async function addClustersToFederation(
  federationId: string,
  clusterIds: string[]
) {
  const response = await fetch(`/api/federation/${federationId}/clusters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clusterIds),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function removeClusterFromFederation(
  federationId: string,
  clusterId: string
) {
  const response = await fetch(
    `/api/federation/${federationId}/clusters/${clusterId}`,
    { method: "DELETE" }
  );
  return parseResponse<BaseApiResponse>(response);
}

// ─── Cluster fetch functions ──────────────────────────────────────────────────

export async function getClusters(query: ClusterListQuery = {}) {
  const qs = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    status: query.status,
    "manager-id": query.managerId,
    "woreda-id": query.woredaId,
    "federation-id": query.federationId,
    location: query.location,
  });
  const response = await fetch(`/api/cluster?${qs}`, { cache: "no-store" });
  return parseResponse<ClusterListResponse>(response);
}

export async function createCluster(payload: ClusterPayload) {
  const response = await fetch("/api/cluster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateCluster(id: string, payload: ClusterPayload) {
  const response = await fetch(`/api/cluster/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getClusterById(id: string) {
  const response = await fetch(`/api/cluster/${id}`, { cache: "no-store" });
  return parseResponse<ClusterDetailResponse>(response);
}

export async function deleteCluster(id: string) {
  const response = await fetch(`/api/cluster/${id}`, { method: "DELETE" });
  return parseResponse<BaseApiResponse>(response);
}

// ─── SHG fetch functions ──────────────────────────────────────────────────────

export async function getSHGs(query: SHGListQuery = {}) {
  const qs = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    status: query.status,
    "facilitator-id": query.facilitatorId,
    "woreda-id": query.woredaId,
    "kebele-id": query.kebeleId,
    "cluster-id": query.clusterId,
    location: query.location,
  });
  const response = await fetch(`/api/self-help-group?${qs}`, {
    cache: "no-store",
  });
  return parseResponse<SHGListResponse>(response);
}

export async function createSHG(payload: SHGPayload) {
  const response = await fetch("/api/self-help-group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateSHG(id: string, payload: SHGUpdatePayload) {
  const response = await fetch(`/api/self-help-group/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getSHGById(id: string) {
  const response = await fetch(`/api/self-help-group/${id}`, { cache: "no-store" });
  return parseResponse<SHGDetailResponse>(response);
}

export async function deleteSHG(id: string) {
  const response = await fetch(`/api/self-help-group/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function addSHGsToCluster(clusterId: string, shgIds: string[]) {
  const response = await fetch(`/api/cluster/${clusterId}/self-help-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shgIds),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function removeSHGFromCluster(clusterId: string, shgId: string) {
  const response = await fetch(`/api/cluster/${clusterId}/self-help-groups/${shgId}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}
