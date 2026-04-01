import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ submissionId: string; answerId: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const { submissionId, answerId } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "PUT",
    path: `/api/survey-submissions/${submissionId}/answers/${answerId}`,
    body,
  });
}
