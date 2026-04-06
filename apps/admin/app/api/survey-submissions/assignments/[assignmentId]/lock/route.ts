import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = { params: Promise<{ assignmentId: string }> };

export async function PATCH(_request: Request, { params }: RouteParams) {
  const { assignmentId } = await params;
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/survey-submissions/assignments/${assignmentId}/lock`,
  });
}
