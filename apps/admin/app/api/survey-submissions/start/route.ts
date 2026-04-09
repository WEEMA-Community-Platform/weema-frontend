import { NextResponse } from "next/server";
import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.surveyId || !body?.targetId) {
    return NextResponse.json(
      { message: "surveyId and targetId are required." },
      { status: 400 }
    );
  }

  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/survey-submissions/start",
    body,
  });
}
