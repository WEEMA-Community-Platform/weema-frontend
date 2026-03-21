import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/user/{id} — user detail (SUPER_ADMIN). */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/user/${id}`,
  });
}
