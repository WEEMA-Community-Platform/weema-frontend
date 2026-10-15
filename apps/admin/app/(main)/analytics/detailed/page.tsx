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
  const dashboardUrl = getSupersetDashboardUrl();
  let embeddingBlocked = false;
  if (dashboardUrl) {
    try {
      const response = await fetch(dashboardUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      // CSP frame-ancestors overrides X-Frame-Options in modern browsers.
      const ancestors = response.headers.get("content-security-policy")?.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i);
      const frameOptions = response.headers.get("x-frame-options")?.trim().toUpperCase();
      embeddingBlocked = !ancestors && (frameOptions === "SAMEORIGIN" || frameOptions === "DENY");
      await response.body?.cancel();
    } catch {
      // A failed probe doesn't establish whether the user's browser can load it.
    }
  }

  return (
      <SupersetDashboardFrame src={dashboardUrl} embeddingBlocked={embeddingBlocked} />
  );
}
