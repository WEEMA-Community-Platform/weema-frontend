import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/survey/${id}`,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/survey/${id}`,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/survey/${id}`,
    body,
  });
}
