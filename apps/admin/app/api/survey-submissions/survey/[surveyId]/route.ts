import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ surveyId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { surveyId } = await params;
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = `/api/survey-submissions/survey/${surveyId}${qs ? `?${qs}` : ""}`;
  return forwardAuthorizedRequest({
    method: "GET",
    path,
  });
}
