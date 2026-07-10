"use client";

import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

/**
 * Minimal segmented control built from buttons — the app has no Tabs/Toggle
 * primitive, and this keeps the calm, restrained look of the base-data UI.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "default",
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  size?: "default" | "sm";
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
