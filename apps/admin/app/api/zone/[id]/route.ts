import { NextResponse } from "next/server";

import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/zone/${id}`,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.regionId) {
    return NextResponse.json(
      { message: "Zone name and region are required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/zone/${id}`,
    body,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/zone/${id}`,
  });
}

