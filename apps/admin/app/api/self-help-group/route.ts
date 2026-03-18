import { NextResponse } from "next/server";

import {
  buildPathWithQuery,
  forwardAuthorizedRequest,
} from "@/app/api/base-data/_lib";

export async function GET(request: Request) {
  return forwardAuthorizedRequest({
    method: "GET",
    path: buildPathWithQuery(request, "/api/self-help-group"),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json(
      { message: "Self-help group name is required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/self-help-group",
    body,
  });
}
