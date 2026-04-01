import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "PATCH",
    path: "/api/user/edit-profile",
    body,
  });
}
