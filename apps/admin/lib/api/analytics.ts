import { buildQueryString, parseResponse } from "@/lib/api/http";
import type { BaseApiResponse } from "@/lib/api/base-data";

// ─── Shared shapes ──────────────────────────────────────────────────────────

/** A single categorical breakdown bucket (woreda / kebele / facilitator). */
export type AnalyticsBucket = {
  id: string;
  name: string;
  count: number;
};

/** A single point on the time series. `period` is yyyy-MM / yyyy-MM-dd / yyyy. */
export type AnalyticsTimePoint = {
  period: string;
  count: number;
};

export type EntityStatus = "ACTIVE" | "INACTIVE";
export type AnalyticsGranularity = "DAY" | "MONTH" | "YEAR";

/** Filter/query params shared by both analytics endpoints (kebab-cased on the wire). */
export type AnalyticsQuery = {
  woredaId?: string;
  kebeleId?: string;
  facilitatorId?: string;
  status?: EntityStatus;
  from?: string;
  to?: string;
  granularity?: AnalyticsGranularity;
  cumulative?: boolean;
};

export type ShgAnalytics = BaseApiResponse & {
  totalCount: number;
  overTime: AnalyticsTimePoint[];
  byWoreda: AnalyticsBucket[];
  byKebele: AnalyticsBucket[];
  byFacilitator: AnalyticsBucket[];
};

export type MemberAnalytics = BaseApiResponse & {
  totalCount: number;
  overTime: AnalyticsTimePoint[];
  byWoreda: AnalyticsBucket[];
  byKebele: AnalyticsBucket[];
};

// ─── Query construction ─────────────────────────────────────────────────────

function analyticsSearchParams(query: AnalyticsQuery): string {
  return buildQueryString({
    "woreda-id": query.woredaId,
    "kebele-id": query.kebeleId,
    "facilitator-id": query.facilitatorId,
    status: query.status,
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    // Always send cumulative so the running-total toggle is explicit.
    cumulative: query.cumulative ?? false,
  });
}

// ─── Fetchers ───────────────────────────────────────────────────────────────

export async function getShgAnalytics(
  query: AnalyticsQuery = {}
): Promise<ShgAnalytics> {
  const qs = analyticsSearchParams(query);
  const response = await fetch(`/api/analytics/shg?${qs}`, {
    cache: "no-store",
  });
  return parseResponse<ShgAnalytics>(response);
}

export async function getMemberAnalytics(
  query: AnalyticsQuery = {}
): Promise<MemberAnalytics> {
  const qs = analyticsSearchParams(query);
  const response = await fetch(`/api/analytics/members?${qs}`, {
    cache: "no-store",
  });
  return parseResponse<MemberAnalytics>(response);
}
