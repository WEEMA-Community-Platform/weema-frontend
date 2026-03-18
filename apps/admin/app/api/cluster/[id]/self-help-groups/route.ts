import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: `/api/cluster/${id}/self-help-groups`,
    body,
  });
}
