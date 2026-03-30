"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveMember,
  createMember,
  deleteMember,
  getMemberById,
  getMembers,
  rejectMember,
  updateMember,
  uploadMemberNationalId,
  type RejectMemberPayload,
  type MemberListQuery,
  type MemberPatchPayload,
} from "@/lib/api/members";

export function useMembersQuery(query: MemberListQuery = {}) {
  return useQuery({
    queryKey: ["members", query],
    queryFn: () => getMembers(query),
  });
}

export function useMemberDetailQuery(
  id: string | null,
  options?: { enabled?: boolean }
) {
  const baseEnabled = !!id;
  const enabled = (options?.enabled ?? true) && baseEnabled;
  return useQuery({
    queryKey: ["member", id],
    queryFn: () => getMemberById(id!),
    enabled,
  });
}

export function useCreateMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createMember(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MemberPatchPayload }) =>
      updateMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUploadMemberNationalIdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, file }: { memberId: string; file: File }) =>
      uploadMemberNationalId(memberId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", variables.memberId] });
    },
  });
}

export function useApproveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveMember(id),
    onSuccess: (_data, memberId) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
    },
  });
}

export function useRejectMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectMemberPayload }) =>
      rejectMember(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", variables.id] });
    },
  });
}
