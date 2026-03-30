import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ assignmentId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { assignmentId } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/survey-submissions/assignment/${assignmentId}`,
  });
}
