/**
 * Single source of truth for which widgets exist per dataset and which chart
 * types make sense for each data slice. The "admin can only pick sensible
 * graphs" rule lives here: a widget only offers chart types listed in
 * `allowedTypes`, so e.g. a 28-category kebele breakdown never exposes a pie.
 */

export type Dataset = "shg" | "members";

/** Chart types the picker can offer. */
export type ChartType = "line" | "area" | "bar" | "hbar" | "donut";

/** Which slice of the analytics payload a widget renders. */
export type WidgetSlice = "overTime" | "byWoreda" | "byKebele" | "byFacilitator";

export type WidgetKey =
  | "overTime"
  | "byWoreda"
  | "byKebele"
  | "byFacilitator";

export type WidgetDef = {
  key: WidgetKey;
  slice: WidgetSlice;
  /** i18n key under `analytics.widgets`. */
  titleKey: string;
  /** Chart types the admin may choose; first entry is the default. */
  allowedTypes: ChartType[];
  /** Categorical widgets cap to the top N by default. */
  topN?: number;
  defaultVisible: boolean;
  /** Widget spans the full grid width (time series reads better wide). */
  fullWidth?: boolean;
};

const OVER_TIME: WidgetDef = {
  key: "overTime",
  slice: "overTime",
  titleKey: "overTime",
  allowedTypes: ["line", "area", "bar"],
  defaultVisible: true,
  fullWidth: true,
};

const BY_WOREDA: WidgetDef = {
  key: "byWoreda",
  slice: "byWoreda",
  titleKey: "byWoreda",
  // Few categories → vertical columns (default) or donut both read well.
  allowedTypes: ["bar", "donut"],
  defaultVisible: true,
};

const BY_KEBELE: WidgetDef = {
  key: "byKebele",
  slice: "byKebele",
  titleKey: "byKebele",
  // Many categories → horizontal bar only (donut would be unreadable).
  allowedTypes: ["hbar"],
  topN: 10,
  defaultVisible: true,
};

const BY_FACILITATOR: WidgetDef = {
  key: "byFacilitator",
  slice: "byFacilitator",
  titleKey: "byFacilitator",
  allowedTypes: ["hbar"],
  topN: 10,
  defaultVisible: true,
};

/** SHG exposes the facilitator breakdown; Members does not return one. */
export const WIDGETS: Record<Dataset, WidgetDef[]> = {
  shg: [OVER_TIME, BY_WOREDA, BY_KEBELE, BY_FACILITATOR],
  members: [OVER_TIME, BY_WOREDA, BY_KEBELE],
};

export function widgetsForDataset(dataset: Dataset): WidgetDef[] {
  return WIDGETS[dataset];
}

/** Categorical chart types the fixed --chart token ramp maps onto, in order. */
export const CHART_COLOR_VARS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
] as const;
