import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ submissionId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { submissionId } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/survey-submissions/${submissionId}`,
  });
}
