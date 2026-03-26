import { forwardAuthorizedRequest } from "@/app/api/_lib/forward-proxy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: "/api/user/change-password",
    body,
  });
}
