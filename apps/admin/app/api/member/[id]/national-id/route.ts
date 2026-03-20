import { NextResponse } from "next/server";

import {
  forwardAuthorizedFormDataRequest,
} from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ message: "Invalid multipart body." }, { status: 400 });
  }
  return forwardAuthorizedFormDataRequest({
    path: `/api/member/${id}/national-id`,
    body: formData,
  });
}
