import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/member/${id}/reject`,
    body,
  });
}
