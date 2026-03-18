import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/federation/${id}`,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/federation/${id}`,
    body,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/federation/${id}`,
  });
}
