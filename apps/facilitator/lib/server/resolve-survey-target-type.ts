import { headers } from "next/headers";

type SurveyApiPayload = {
  survey?: { targetType?: string };
  data?: { targetType?: string };
};

/**
 * Target type for survey submissions UI: URL first (matches list navigation), then GET /api/survey/:id on the server.
 */
export async function resolveSurveyTargetTypeForSubmissionsPage(
  surveyId: string,
  targetTypeFromSearchParams?: string | null
): Promise<string> {
  const fromQuery = targetTypeFromSearchParams?.trim() ?? "";
  if (fromQuery) return fromQuery;

  const h = await headers();
  const host = h.get("host");
  if (!host) return "";

  const protocol = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${protocol}://${host}/api/survey/${surveyId}`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });

  if (!res.ok) return "";

  const body = (await res.json().catch(() => null)) as SurveyApiPayload | null;
  if (!body) return "";

  const record = body.survey ?? body.data;
  return typeof record?.targetType === "string" ? record.targetType.trim() : "";
}
