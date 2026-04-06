import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({ method: "PATCH", path: `/api/member/${id}/lock` });
}
