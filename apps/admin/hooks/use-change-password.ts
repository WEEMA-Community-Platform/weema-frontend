"use client";

import { useMutation } from "@tanstack/react-query";

import { changeMyPassword, type ChangePasswordPayload } from "@/lib/api/user";

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changeMyPassword(payload),
  });
}
