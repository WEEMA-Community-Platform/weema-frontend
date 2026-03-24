import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ surveyId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { surveyId } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: `/api/survey-section/survey/${surveyId}`,
    body,
  });
}
