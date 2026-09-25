import { getTranslations } from "next-intl/server";

import { AnalyticsViewNav } from "@/components/analytics/analytics-view-nav";
import { SupersetDashboardFrame } from "@/components/analytics/superset-dashboard-frame";

export const dynamic = "force-dynamic";

const DEFAULT_SUPERSET_DASHBOARD_URL =
  "https://superset-minch.weema.org/superset/dashboard/weema-dash/";

function getSupersetDashboardUrl(): string | null {
  const configured =
    process.env.SUPERSET_DASHBOARD_URL?.trim() ||
    DEFAULT_SUPERSET_DASHBOARD_URL;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    url.searchParams.set("standalone", "2");
    url.searchParams.set("show_filters", "1");
    url.searchParams.set("expand_filters", "0");
    return url.toString();
  } catch {
    return null;
  }
}

export default async function DetailedAnalyticsPage() {
  const t = await getTranslations("analytics");
  const dashboardUrl = getSupersetDashboardUrl();

  return (
    <>
      <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {t("detailed.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("detailed.description")}
            </p>
          </div>
          <AnalyticsViewNav />
        </div>
      </div>

      <SupersetDashboardFrame src={dashboardUrl} />
    </>
  );
}
