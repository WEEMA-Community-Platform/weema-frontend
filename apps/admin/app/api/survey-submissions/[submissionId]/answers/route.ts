import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { submissionId } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: `/api/survey-submissions/${submissionId}/answers`,
    body,
  });
}
