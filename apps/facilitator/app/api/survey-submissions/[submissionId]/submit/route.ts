import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { submissionId } = await params;
  return forwardAuthorizedRequest({
    method: "POST",
    path: `/api/survey-submissions/${submissionId}/submit`,
  });
}
