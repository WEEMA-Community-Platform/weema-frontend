import { NextResponse } from "next/server";
import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.ids || !Array.isArray(body.ids)) {
    return NextResponse.json({ message: "ids array is required." }, { status: 400 });
  }
  return forwardAuthorizedRequest({ method: "PATCH", path: "/api/member/bulk/lock", body });
}
