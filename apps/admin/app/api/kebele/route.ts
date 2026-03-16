import { NextResponse } from "next/server";

import {
  buildPathWithQuery,
  forwardAuthorizedRequest,
} from "@/app/api/base-data/_lib";

export async function GET(request: Request) {
  return forwardAuthorizedRequest({
    method: "GET",
    path: buildPathWithQuery(request, "/api/kebele"),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.woredaId) {
    return NextResponse.json(
      { message: "Kebele name and woreda are required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/kebele",
    body,
  });
}

