"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnalyticsTimePoint } from "@/lib/api/analytics";
import type { ChartType } from "@/components/analytics/widget-registry";

/** Turn `2025-06` / `2025-06-01` / `2025` into a compact, readable axis label. */
function formatPeriod(period: string): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const parts = period.split("-");
  if (parts.length === 1) return parts[0]; // yyyy
  const monthIdx = Number(parts[1]) - 1;
  const mon = monthNames[monthIdx] ?? parts[1];
  if (parts.length === 2) return `${mon} ${parts[0].slice(2)}`; // yyyy-MM
  return `${mon} ${parts[2]}`; // yyyy-MM-dd
}

export function TimeSeriesChart({
  data,
  type,
  seriesLabel,
}: {
  data: AnalyticsTimePoint[];
  type: Extract<ChartType, "line" | "area" | "bar">;
  seriesLabel: string;
}) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, label: formatPeriod(d.period) })),
    [data]
  );

  const config = {
    count: { label: seriesLabel, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  // Thin out x-axis ticks on dense series so labels never collide.
  const tickInterval =
    chartData.length > 24 ? Math.ceil(chartData.length / 12) - 1 : 0;

  const commonAxes = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        interval={tickInterval}
        minTickGap={16}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={36}
        allowDecimals={false}
      />
      <ChartTooltip
        cursor={false}
        content={<ChartTooltipContent nameKey="count" />}
      />
    </>
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      {type === "line" ? (
        <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
          {commonAxes}
          <Line
            dataKey="count"
            type="monotone"
            stroke="var(--color-count)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      ) : type === "area" ? (
        <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-count)"
                stopOpacity={0.35}
              />
              <stop
                offset="95%"
                stopColor="var(--color-count)"
                stopOpacity={0.04}
              />
            </linearGradient>
          </defs>
          {commonAxes}
          <Area
            dataKey="count"
            type="monotone"
            stroke="var(--color-count)"
            strokeWidth={2}
            fill="url(#fillCount)"
          />
        </AreaChart>
      ) : (
        <BarChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
          {commonAxes}
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ChartContainer>
  );
}
