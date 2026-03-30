import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ assignmentId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { assignmentId } = await params;
  const body = await request.json().catch(() => ({}));
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/survey-submissions/assignments/${assignmentId}/reject`,
    body,
  });
}
