"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { editMyProfile, type EditProfilePayload } from "@/lib/api/user";

export function useEditProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EditProfilePayload) => editMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
