"use client";

import { useState } from "react";
import {
  ChartAreaIcon,
  ChartColumnIcon,
  ChartLineIcon,
  ChartPieIcon,
  ListIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/analytics/segmented-control";
import { CategoryBarChart } from "@/components/analytics/widgets/category-bar-chart";
import { CategoryDonutChart } from "@/components/analytics/widgets/category-donut-chart";
import { TimeSeriesChart } from "@/components/analytics/widgets/time-series-chart";
import type {
  ChartType,
  WidgetDef,
} from "@/components/analytics/widget-registry";
import type { AnalyticsBucket, AnalyticsTimePoint } from "@/lib/api/analytics";

const CHART_TYPE_ICON: Record<ChartType, React.ReactNode> = {
  line: <ChartLineIcon className="size-3.5" />,
  area: <ChartAreaIcon className="size-3.5" />,
  bar: <ChartColumnIcon className="size-3.5" />,
  hbar: <ChartColumnIcon className="size-3.5 rotate-90" />,
  donut: <ChartPieIcon className="size-3.5" />,
};

type WidgetData =
  | { slice: "overTime"; points: AnalyticsTimePoint[] }
  | { slice: "category"; buckets: AnalyticsBucket[] };

export function AnalyticsWidgetCard({
  widget,
  chartType,
  onChartTypeChange,
  data,
}: {
  widget: WidgetDef;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  data: WidgetData;
}) {
  const t = useTranslations("analytics");
  const [showAll, setShowAll] = useState(false);

  const title = t(`widgets.${widget.titleKey}`);
  const seriesLabel = t("seriesLabel");

  const typeOptions = widget.allowedTypes.map((type) => ({
    value: type,
    label: t(`chartTypes.${type}`),
    icon: CHART_TYPE_ICON[type],
  }));

  const isEmpty =
    data.slice === "overTime"
      ? data.points.length === 0
      : data.buckets.length === 0;

  // Top-N handling for categorical widgets.
  const totalCategories = data.slice === "category" ? data.buckets.length : 0;
  const topN = widget.topN;
  const truncated =
    data.slice === "category" && !!topN && !showAll && totalCategories > topN;
  const visibleBuckets =
    data.slice === "category"
      ? truncated
        ? data.buckets.slice(0, topN)
        : data.buckets
      : [];

  return (
    <Card className={widget.fullWidth ? "col-span-full" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>{title}</CardTitle>
        {widget.allowedTypes.length > 1 ? (
          <SegmentedControl
            size="sm"
            ariaLabel={t("chooseChartType")}
            value={chartType}
            onChange={(next) => onChartTypeChange(next as ChartType)}
            options={typeOptions}
          />
        ) : null}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : data.slice === "overTime" ? (
          <TimeSeriesChart
            data={data.points}
            type={chartType as "line" | "area" | "bar"}
            seriesLabel={seriesLabel}
          />
        ) : chartType === "donut" ? (
          <CategoryDonutChart
            data={data.buckets}
            totalLabel={t("total")}
            otherLabel={t("other")}
          />
        ) : (
          <CategoryBarChart
            data={visibleBuckets}
            seriesLabel={seriesLabel}
            orientation={chartType === "bar" ? "vertical" : "horizontal"}
          />
        )}

        {data.slice === "category" &&
        chartType !== "donut" &&
        !!topN &&
        totalCategories > topN ? (
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ListIcon className="size-3.5" />
              {truncated
                ? t("showingTopN", { n: topN, total: totalCategories })
                : t("showingAll", { total: totalCategories })}
            </span>
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {truncated ? t("showAll") : t("showTopN", { n: topN })}
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
