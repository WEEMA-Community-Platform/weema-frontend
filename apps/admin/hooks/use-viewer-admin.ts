"use client";

import { useCurrentUser } from "@/hooks/use-user";
import { normalizeRole } from "@weema/auth";

export function useIsViewerAdmin() {
  const { data } = useCurrentUser();
  return normalizeRole(data?.user.role) === "viewer_admin";
}
