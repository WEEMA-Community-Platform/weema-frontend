import { NextResponse } from "next/server";
import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.targetIds || !Array.isArray(body.targetIds)) {
    return NextResponse.json({ message: "targetIds array is required." }, { status: 400 });
  }
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/survey/${id}/un-assign`,
    body,
  });
}
