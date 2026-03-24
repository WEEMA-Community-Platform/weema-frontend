import { forwardAuthorizedRequest } from "@/app/api/base-data/_lib";

type RouteParams = {
  params: Promise<{ sectionId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { sectionId } = await params;
  const body = await request.json().catch(() => null);
  return forwardAuthorizedRequest({
    method: "POST",
    path: `/api/question/section/${sectionId}`,
    body,
  });
}
