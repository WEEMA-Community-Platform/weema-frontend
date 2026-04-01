import { NextResponse } from "next/server";

import { tryRefreshSessionCookies } from "../refresh-session";

export async function POST() {
  const accessToken = await tryRefreshSessionCookies();

  if (!accessToken) {
    return NextResponse.json(
      { message: "Missing refresh token or refresh failed." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: "Session refreshed",
    statusCode: "OK",
  });
}
