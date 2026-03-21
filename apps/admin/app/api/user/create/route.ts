import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

/** POST /api/user/create — create user (SUPER_ADMIN). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/user/create",
    body,
  });
}
