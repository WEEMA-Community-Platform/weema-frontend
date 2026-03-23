import { NextResponse } from "next/server";

import {
  buildPathWithQuery,
  forwardAuthorizedRequest,
} from "@/app/api/base-data/_lib";

export async function GET(request: Request) {
  return forwardAuthorizedRequest({
    method: "GET",
    path: buildPathWithQuery(request, "/api/zone"),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.name || !body?.regionId) {
    return NextResponse.json(
      { message: "Zone name and region are required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/zone",
    body,
  });
}

