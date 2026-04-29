import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

export async function GET() {
  return forwardAuthorizedRequest({
    method: "GET",
    path: "/api/export/woredas",
  });
}
