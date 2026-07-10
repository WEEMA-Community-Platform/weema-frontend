"use client";

import { useMemo, useState } from "react";
import {
  LayoutGridIcon,
  Loader2Icon,
  SlidersHorizontalIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/analytics/segmented-control";
import { StatTile } from "@/components/analytics/widgets/stat-tile";
import { AnalyticsWidgetCard } from "@/components/analytics/analytics-widget-card";
import {
  AnalyticsFilterDialog,
  EMPTY_FILTERS,
  hasActiveFilters,
  type AnalyticsFilters,
} from "@/components/analytics/analytics-filter-dialog";
import { useAnalyticsPrefs } from "@/components/analytics/use-analytics-prefs";
import {
  widgetsForDataset,
  type Dataset,
} from "@/components/analytics/widget-registry";
import {
  useMemberAnalyticsQuery,
  useShgAnalyticsQuery,
} from "@/hooks/use-analytics";
import type {
  AnalyticsBucket,
  AnalyticsQuery,
  ShgAnalytics,
} from "@/lib/api/analytics";

function filtersToQuery(f: AnalyticsFilters): AnalyticsQuery {
  return {
    woredaId: f.woredaId || undefined,
    kebeleId: f.kebeleId || undefined,
    facilitatorId: f.facilitatorId || undefined,
    status: f.status || undefined,
    from: f.from || undefined,
    to: f.to || undefined,
    granularity: f.granularity,
    cumulative: f.cumulative,
  };
}

export function AnalyticsDashboard() {
  const t = useTranslations("analytics");
  const [dataset, setDataset] = useState<Dataset>("shg");
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const { prefs, setVisible, setChartType } = useAnalyticsPrefs(dataset);

  const query = useMemo(() => filtersToQuery(filters), [filters]);

  const shgQuery = useShgAnalyticsQuery(query, { enabled: dataset === "shg" });
  const memberQuery = useMemberAnalyticsQuery(query, {
    enabled: dataset === "members",
  });
  const active = dataset === "shg" ? shgQuery : memberQuery;
  const data = active.data;

  const widgets = widgetsForDataset(dataset);
  const activeFilterCount = hasActiveFilters(filters) ? 1 : 0;

  const bucketsFor = (slice: string): AnalyticsBucket[] => {
    if (!data) return [];
    if (slice === "byWoreda") return data.byWoreda;
    if (slice === "byKebele") return data.byKebele;
    if (slice === "byFacilitator")
      return (data as ShgAnalytics).byFacilitator ?? [];
    return [];
  };

  const isInitialLoading = active.isLoading && !data;
  // Filters/dataset changed but previous data is still shown (keepPreviousData).
  const isRefetching = active.isFetching && !isInitialLoading;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: dataset toggle + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<Dataset>
          ariaLabel={t("datasetLabel")}
          value={dataset}
          onChange={setDataset}
          options={[
            {
              value: "shg",
              label: t("datasets.shg"),
              icon: <UsersRoundIcon className="size-4" />,
            },
            {
              value: "members",
              label: t("datasets.members"),
              icon: <UsersIcon className="size-4" />,
            },
          ]}
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontalIcon className="size-4" />
            {t("filters.button")}
            {activeFilterCount > 0 ? (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" className="h-10">
                  <LayoutGridIcon className="size-4" />
                  {t("customize")}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("customizeHint")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {widgets.map((widget) => (
                  <DropdownMenuCheckboxItem
                    key={widget.key}
                    checked={prefs[widget.key]?.visible ?? true}
                    closeOnClick={false}
                    onCheckedChange={(checked) =>
                      setVisible(widget.key, checked)
                    }
                  >
                    {t(`widgets.${widget.titleKey}`)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {active.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          {t("error")}
        </div>
      ) : (
        <div className="relative flex flex-col gap-4">
          {/* While refetching, dim the (previous) data and float a spinner. */}
          {isRefetching ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center">
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur">
                <Loader2Icon className="size-3.5 animate-spin" />
                {t("updating")}
              </div>
            </div>
          ) : null}

          <div
            className={
              isRefetching
                ? "flex flex-col gap-4 opacity-60 transition-opacity"
                : "flex flex-col gap-4 transition-opacity"
            }
          >
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              label={
                dataset === "shg" ? t("kpi.totalShg") : t("kpi.totalMembers")
              }
              value={data?.totalCount}
              loading={isInitialLoading}
              icon={
                dataset === "shg" ? (
                  <UsersRoundIcon className="size-4" />
                ) : (
                  <UsersIcon className="size-4" />
                )
              }
            />
          </div>

          {/* Widget grid */}
          {isInitialLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="col-span-full h-[320px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {widgets
                .filter((widget) => prefs[widget.key]?.visible ?? true)
                .map((widget) => (
                  <AnalyticsWidgetCard
                    key={widget.key}
                    widget={widget}
                    chartType={
                      prefs[widget.key]?.chartType ?? widget.allowedTypes[0]
                    }
                    onChartTypeChange={(type) =>
                      setChartType(widget.key, type)
                    }
                    data={
                      widget.slice === "overTime"
                        ? { slice: "overTime", points: data?.overTime ?? [] }
                        : { slice: "category", buckets: bucketsFor(widget.slice) }
                    }
                  />
                ))}
            </div>
          )}
          </div>
        </div>
      )}

      <AnalyticsFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
        showFacilitator={dataset === "shg"}
      />
    </div>
  );
}
