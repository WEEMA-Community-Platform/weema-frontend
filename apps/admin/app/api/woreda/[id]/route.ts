import { NextResponse } from "next/server";

import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/woreda/${id}`,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.zoneId) {
    return NextResponse.json(
      { message: "Woreda name and zone are required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/woreda/${id}`,
    body,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/woreda/${id}`,
  });
}

