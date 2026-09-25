"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const views = [
  { href: "/analytics", key: "overview" },
  { href: "/analytics/detailed", key: "detailed" },
] as const;

export function AnalyticsViewNav() {
  const pathname = usePathname();
  const t = useTranslations("analytics.views");

  return (
    <nav
      aria-label={t("label")}
      className="inline-flex rounded-lg border border-border/80 bg-muted/45 p-1"
    >
      {views.map((view) => {
        const active =
          view.href === "/analytics"
            ? pathname === view.href
            : pathname.startsWith(view.href);

        return (
          <Link
            key={view.key}
            href={view.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(view.key)}
          </Link>
        );
      })}
    </nav>
  );
}
