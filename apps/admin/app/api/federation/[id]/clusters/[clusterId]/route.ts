import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; clusterId: string }> }
) {
  const { id, clusterId } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/federation/${id}/clusters/${clusterId}`,
  });
}
