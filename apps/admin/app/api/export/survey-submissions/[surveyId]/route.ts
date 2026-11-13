import { buildPathWithQuery, forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ surveyId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { surveyId } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: buildPathWithQuery(request, `/api/export/survey-submissions/${surveyId}`),
  });
}
