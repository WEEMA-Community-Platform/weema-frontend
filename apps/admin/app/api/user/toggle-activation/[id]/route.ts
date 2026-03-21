import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = { params: Promise<{ id: string }> };

/** PATCH /api/user/toggle-activation/{id} */
export async function PATCH(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/user/toggle-activation/${id}`,
  });
}
