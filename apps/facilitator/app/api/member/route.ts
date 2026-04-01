import { NextResponse } from "next/server";

import {
  buildPathWithQuery,
  forwardAuthorizedFormDataRequest,
  forwardAuthorizedRequest,
} from "@/app/api/base-data/_lib";

export async function GET(request: Request) {
  return forwardAuthorizedRequest({
    method: "GET",
    path: buildPathWithQuery(request, "/api/member"),
  });
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ message: "Invalid multipart body." }, { status: 400 });
  }
  return forwardAuthorizedFormDataRequest({
    path: "/api/member",
    body: formData,
  });
}
