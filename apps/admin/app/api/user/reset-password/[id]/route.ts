import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await forwardAuthorizedRequest({ method: "POST", path: `/api/user/reset-password/${encodeURIComponent(id)}`, superAdminOnly: true });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
