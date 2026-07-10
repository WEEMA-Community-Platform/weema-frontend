"use client";

import { useCallback, useMemo, useState } from "react";

import {
  widgetsForDataset,
  type ChartType,
  type Dataset,
  type WidgetKey,
} from "@/components/analytics/widget-registry";

const STORAGE_KEY = "weema-admin:analytics-prefs";

export type WidgetPref = {
  visible: boolean;
  chartType: ChartType;
};

export type DatasetPrefs = Record<string, WidgetPref>;
type AllPrefs = Record<Dataset, DatasetPrefs>;

function defaultsForDataset(dataset: Dataset): DatasetPrefs {
  const next: DatasetPrefs = {};
  for (const widget of widgetsForDataset(dataset)) {
    next[widget.key] = {
      visible: widget.defaultVisible,
      chartType: widget.allowedTypes[0],
    };
  }
  return next;
}

function readStoredPrefs(): Partial<AllPrefs> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredPrefs(next: Partial<AllPrefs>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Silently ignore storage failures (e.g., disabled localStorage).
  }
}

/**
 * Per-dataset widget visibility + chosen chart type, persisted to localStorage.
 * Stored prefs are reconciled against the registry so newly added widgets or
 * disallowed chart types can never produce an invalid selection.
 */
export function useAnalyticsPrefs(dataset: Dataset) {
  // Lazy initializer (SSR-guarded in readStoredPrefs) mirrors the sidebar's
  // storage-backed state in nav-main.tsx, avoiding a setState-in-effect.
  const [allPrefs, setAllPrefs] = useState<Partial<AllPrefs>>(readStoredPrefs);

  const prefs = useMemo<DatasetPrefs>(() => {
    const defaults = defaultsForDataset(dataset);
    const stored = allPrefs[dataset] ?? {};
    const merged: DatasetPrefs = {};
    for (const widget of widgetsForDataset(dataset)) {
      const fallback = defaults[widget.key];
      const saved = stored[widget.key];
      const chartType =
        saved && widget.allowedTypes.includes(saved.chartType)
          ? saved.chartType
          : fallback.chartType;
      merged[widget.key] = {
        visible: saved?.visible ?? fallback.visible,
        chartType,
      };
    }
    return merged;
  }, [allPrefs, dataset]);

  const update = useCallback(
    (key: WidgetKey, patch: Partial<WidgetPref>) => {
      setAllPrefs((prev) => {
        const current = prev[dataset] ?? defaultsForDataset(dataset);
        const next: Partial<AllPrefs> = {
          ...prev,
          [dataset]: {
            ...current,
            [key]: { ...current[key], ...patch },
          },
        };
        writeStoredPrefs(next);
        return next;
      });
    },
    [dataset]
  );

  const setVisible = useCallback(
    (key: WidgetKey, visible: boolean) => update(key, { visible }),
    [update]
  );
  const setChartType = useCallback(
    (key: WidgetKey, chartType: ChartType) => update(key, { chartType }),
    [update]
  );

  return { prefs, setVisible, setChartType };
}
