import { getTranslations } from "next-intl/server";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics");

  return (
    <>
      <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AnalyticsDashboard />
    </>
  );
}
