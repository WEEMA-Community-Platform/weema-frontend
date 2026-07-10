"use client";

import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AnalyticsBucket } from "@/lib/api/analytics";
import { CHART_COLOR_VARS } from "@/components/analytics/widget-registry";

/**
 * Donut for a small set of categories (identity/share). Hues are assigned in
 * fixed --chart token order; extras beyond the ramp fold into "Other" so we
 * never cycle or generate colors. A legend + tooltip carry identity, never
 * color alone.
 */
export function CategoryDonutChart({
  data,
  totalLabel,
  otherLabel,
}: {
  data: AnalyticsBucket[];
  totalLabel: string;
  otherLabel: string;
}) {
  const { slices, total } = useMemo(() => {
    const max = CHART_COLOR_VARS.length;
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const head = sorted.slice(0, max - 1);
    const tail = sorted.slice(max - 1);
    const rows = [...head];
    if (tail.length > 0) {
      rows.push({
        id: "__other__",
        name: otherLabel,
        count: tail.reduce((sum, d) => sum + d.count, 0),
      });
    }
    return {
      slices: rows,
      total: sorted.reduce((sum, d) => sum + d.count, 0),
    };
  }, [data, otherLabel]);

  const config: ChartConfig = useMemo(() => {
    const next: ChartConfig = {};
    slices.forEach((slice, i) => {
      next[slice.id] = {
        label: slice.name,
        color: CHART_COLOR_VARS[i % CHART_COLOR_VARS.length],
      };
    });
    return next;
  }, [slices]);

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[280px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="name" hideLabel />}
        />
        <Pie
          data={slices}
          dataKey="count"
          nameKey="name"
          innerRadius={68}
          outerRadius={104}
          strokeWidth={2}
          paddingAngle={2}
        >
          {slices.map((slice, i) => (
            <Cell
              key={slice.id}
              fill={CHART_COLOR_VARS[i % CHART_COLOR_VARS.length]}
            />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan
                    x={cx}
                    y={cy}
                    className="fill-foreground font-mono text-2xl font-semibold"
                  >
                    {total.toLocaleString()}
                  </tspan>
                  <tspan
                    x={cx}
                    y={(cy || 0) + 20}
                    className="fill-muted-foreground text-xs"
                  >
                    {totalLabel}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
