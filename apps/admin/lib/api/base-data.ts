export type BaseApiResponse = {
  message: string;
  statusCode: string;
};

export type Region = {
  id: string;
  name: string;
  description: string;
};

export type Zone = {
  id: string;
  name: string;
  description: string;
  regionId: string;
  regionName: string;
  isSpecialWoreda?: boolean | null;
  /** Legacy key; prefer `isSpecialWoreda` (matches API). */
  specialWoreda?: boolean | null;
};

export type Woreda = {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  zoneName: string;
};

export type Religion = {
  id: string;
  name: string;
  description: string;
};

export type Kebele = {
  id: string;
  name: string;
  description: string;
  woredaId: string;
  woredaName: string;
};

export type PaginatedQuery = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
};

export type RegionListResponse = BaseApiResponse & {
  regions: Region[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type ZoneListQuery = PaginatedQuery & {
  regionId?: string;
};

export type WoredaListQuery = PaginatedQuery & {
  zoneId?: string;
  regionId?: string;
};

export type KebeleListQuery = PaginatedQuery & {
  woredaId?: string;
  zoneId?: string;
};

export type ZoneListResponse = BaseApiResponse & {
  zones: Zone[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type WoredaListResponse = BaseApiResponse & {
  woredas: Woreda[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type ReligionListResponse = BaseApiResponse & {
  religions: Religion[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type KebeleListResponse = BaseApiResponse & {
  kebeles: Kebele[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type RegionPayload = {
  name: string;
  description: string;
};

export type ZonePayload = {
  name: string;
  description: string;
  regionId: string;
  isSpecialWoreda?: boolean | null;
};

export type WoredaPayload = {
  name: string;
  description: string;
  zoneId: string;
};

export type KebelePayload = {
  name: string;
  description: string;
  woredaId: string;
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
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}

export async function getRegions(query: PaginatedQuery = {}) {
  const queryString = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
  });
  const response = await fetch(`/api/region?${queryString}`, {
    cache: "no-store",
  });
  return parseResponse<RegionListResponse>(response);
}

export async function createRegion(payload: RegionPayload) {
  const response = await fetch("/api/region", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateRegion(id: string, payload: RegionPayload) {
  const response = await fetch(`/api/region/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteRegion(id: string) {
  const response = await fetch(`/api/region/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getZones(query: ZoneListQuery = {}) {
  const queryString = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    "region-id": query.regionId,
  });
  const response = await fetch(`/api/zone?${queryString}`, {
    cache: "no-store",
  });
  return parseResponse<ZoneListResponse>(response);
}

export async function createZone(payload: ZonePayload) {
  const response = await fetch("/api/zone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateZone(id: string, payload: ZonePayload) {
  const response = await fetch(`/api/zone/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteZone(id: string) {
  const response = await fetch(`/api/zone/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getWoredas(query: WoredaListQuery = {}) {
  const queryString = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    "zone-id": query.zoneId,
    "region-id": query.regionId,
  });
  const response = await fetch(`/api/woreda?${queryString}`, {
    cache: "no-store",
  });
  return parseResponse<WoredaListResponse>(response);
}

export async function createWoreda(payload: WoredaPayload) {
  const response = await fetch("/api/woreda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateWoreda(id: string, payload: WoredaPayload) {
  const response = await fetch(`/api/woreda/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteWoreda(id: string) {
  const response = await fetch(`/api/woreda/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getReligions(query: PaginatedQuery = {}) {
  const queryString = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
  });
  const response = await fetch(`/api/religion?${queryString}`, {
    cache: "no-store",
  });
  return parseResponse<ReligionListResponse>(response);
}

export async function createReligion(payload: RegionPayload) {
  const response = await fetch("/api/religion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateReligion(id: string, payload: RegionPayload) {
  const response = await fetch(`/api/religion/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteReligion(id: string) {
  const response = await fetch(`/api/religion/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getKebeles(query: KebeleListQuery = {}) {
  const queryString = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    "woreda-id": query.woredaId,
    "zone-id": query.zoneId,
  });
  const response = await fetch(`/api/kebele?${queryString}`, {
    cache: "no-store",
  });
  return parseResponse<KebeleListResponse>(response);
}

export async function createKebele(payload: KebelePayload) {
  const response = await fetch("/api/kebele", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateKebele(id: string, payload: KebelePayload) {
  const response = await fetch(`/api/kebele/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteKebele(id: string) {
  const response = await fetch(`/api/kebele/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export type BaseDataExportListResponse = BaseApiResponse & {
  data: Record<string, unknown>[];
};

export async function parseExportListResponse(
  response: Response
): Promise<BaseDataExportListResponse> {
  const payload = (await response.json().catch(() => null)) as
    | (BaseApiResponse & { data?: unknown })
    | null;

  if (!response.ok || !payload || !Array.isArray(payload.data)) {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Request failed"
    );
  }

  return payload as BaseDataExportListResponse;
}

export async function exportRegionsList(): Promise<BaseDataExportListResponse> {
  const response = await fetch("/api/export/regions", { cache: "no-store" });
  return parseExportListResponse(response);
}

export async function exportZonesList(): Promise<BaseDataExportListResponse> {
  const response = await fetch("/api/export/zones", { cache: "no-store" });
  return parseExportListResponse(response);
}

export async function exportWoredasList(): Promise<BaseDataExportListResponse> {
  const response = await fetch("/api/export/woredas", { cache: "no-store" });
  return parseExportListResponse(response);
}

export async function exportKebelesList(): Promise<BaseDataExportListResponse> {
  const response = await fetch("/api/export/kebeles", { cache: "no-store" });
  return parseExportListResponse(response);
}

