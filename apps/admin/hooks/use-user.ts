"use client";

import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "@/lib/api/user";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}
