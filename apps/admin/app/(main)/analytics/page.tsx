import { getTranslations } from "next-intl/server";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AnalyticsViewNav } from "@/components/analytics/analytics-view-nav";

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics");

  return (
    <>
      <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <AnalyticsViewNav />
        </div>
      </div>
      <AnalyticsDashboard />
    </>
  );
}
