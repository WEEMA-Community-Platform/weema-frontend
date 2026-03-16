import { NextResponse } from "next/server";

import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "GET",
    path: `/api/religion/${id}`,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json(
      { message: "Religion name is required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "PATCH",
    path: `/api/religion/${id}`,
    body,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return forwardAuthorizedRequest({
    method: "DELETE",
    path: `/api/religion/${id}`,
  });
}

