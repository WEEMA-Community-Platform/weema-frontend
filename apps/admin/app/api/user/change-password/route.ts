import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

/** POST /api/user/change-password — current user; requires old password. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/user/change-password",
    body,
  });
}
