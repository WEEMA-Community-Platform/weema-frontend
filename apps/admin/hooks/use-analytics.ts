"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getMemberAnalytics,
  getShgAnalytics,
  type AnalyticsQuery,
} from "@/lib/api/analytics";

type Options = { enabled?: boolean };

export function useShgAnalyticsQuery(
  query: AnalyticsQuery = {},
  options: Options = {}
) {
  return useQuery({
    queryKey: ["analytics", "shg", query],
    queryFn: () => getShgAnalytics(query),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useMemberAnalyticsQuery(
  query: AnalyticsQuery = {},
  options: Options = {}
) {
  return useQuery({
    queryKey: ["analytics", "members", query],
    queryFn: () => getMemberAnalytics(query),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}
