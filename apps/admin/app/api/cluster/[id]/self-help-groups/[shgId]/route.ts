import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; shgId: string }> }
) {
  const { id, shgId } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/cluster/${id}/self-help-groups/${shgId}`,
  });
}
