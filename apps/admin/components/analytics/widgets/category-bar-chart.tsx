"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnalyticsBucket } from "@/lib/api/analytics";

function shorten(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/**
 * Bar chart for categorical breakdowns (a single measure → one hue). Horizontal
 * for long ranked lists (labels read left-to-right); vertical for a handful of
 * categories. The value is direct-labeled and the full name lives in the tooltip.
 */
export function CategoryBarChart({
  data,
  seriesLabel,
  orientation = "horizontal",
}: {
  data: AnalyticsBucket[];
  seriesLabel: string;
  orientation?: "horizontal" | "vertical";
}) {
  const config = {
    count: { label: seriesLabel, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  if (orientation === "vertical") {
    const chartData = data.map((d) => ({ ...d, shortName: shorten(d.name, 12) }));
    return (
      <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
        <BarChart data={chartData} margin={{ left: 4, right: 12, top: 16 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="shortName"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="name" hideLabel />}
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              offset={8}
              className="fill-foreground"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  }

  // Horizontal (ranked list).
  const chartData = data.map((d) => ({ ...d, shortName: shorten(d.name, 18) }));
  const rowHeight = 34;
  const height = Math.max(160, chartData.length * rowHeight + 24);

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 4, right: 32, top: 4, bottom: 4 }}
      >
        <XAxis type="number" dataKey="count" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="shortName"
          tickLine={false}
          axisLine={false}
          width={116}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="name" hideLabel />}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="count"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
