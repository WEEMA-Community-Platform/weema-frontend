import { forwardAuthorizedRequest } from "@/app/api/_lib/forward-proxy";

export async function GET() {
  return forwardAuthorizedRequest({
    method: "GET",
    path: "/api/user/me",
  });
}
