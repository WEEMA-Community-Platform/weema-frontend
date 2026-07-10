"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hero number for a single headline figure (e.g. total count). No plot, so per
 * the dataviz guidance it carries no tooltip — the number is the whole message.
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
  loading,
  className,
}: {
  label: string;
  value: number | null | undefined;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div>
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
            {(value ?? 0).toLocaleString()}
          </p>
        )}
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
