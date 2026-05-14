import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ surveyId: string; assigneeId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { surveyId, assigneeId } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/survey-submissions/survey/${surveyId}/assignee/${assigneeId}/pending-targets`,
  });
}
