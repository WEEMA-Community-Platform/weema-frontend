import { NextResponse } from "next/server";
import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

const roles = new Set(["ROLE_VIEWER_ADMIN", "ROLE_CLUSTER_ADMIN", "ROLE_FACILITATOR"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || !roles.has(body.role)) {
    return NextResponse.json({ message: "Select a valid role. Super Admin cannot be assigned." }, { status: 400 });
  }
  return forwardAuthorizedRequest({ method: "PATCH", path: `/api/user/change-role/${encodeURIComponent(id)}`, body: { role: body.role }, superAdminOnly: true });
}
