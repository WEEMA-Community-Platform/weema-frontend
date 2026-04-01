import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/self-help-group/${id}`,
  });
}
