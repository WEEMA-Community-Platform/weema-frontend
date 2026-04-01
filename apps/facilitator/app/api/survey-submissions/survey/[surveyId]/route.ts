import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ surveyId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { surveyId } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/survey-submissions/survey/${surveyId}`,
  });
}
