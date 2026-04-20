"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bulkLockMembers,
  bulkUnlockMembers,
  createMember,
  deleteMember,
  getMemberById,
  getMembers,
  lockMember,
  unlockMember,
  updateMember,
  uploadMemberNationalId,
  type MemberListQuery,
  type MemberPatchPayload,
} from "@/lib/api/members";

function invalidateMemberQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["members"] });
  queryClient.invalidateQueries({ queryKey: ["member"] });
}

function invalidateMemberDependencyQueries(queryClient: ReturnType<typeof useQueryClient>) {
  // SHG cards show member counts; survey targeting can depend on members.
  queryClient.invalidateQueries({ queryKey: ["shgs"] });
  queryClient.invalidateQueries({ queryKey: ["shg"] });
  queryClient.invalidateQueries({ queryKey: ["survey"] });
  queryClient.invalidateQueries({ queryKey: ["survey-assignment"] });
}

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
      invalidateMemberQueries(queryClient);
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MemberPatchPayload }) =>
      updateMember(id, payload),
    onSuccess: () => {
      invalidateMemberQueries(queryClient);
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}

export function useDeleteMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      invalidateMemberQueries(queryClient);
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}

export function useUploadMemberNationalIdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, file }: { memberId: string; file: File }) =>
      uploadMemberNationalId(memberId, file),
    onSuccess: (_data, variables) => {
      invalidateMemberQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["member", variables.memberId] });
    },
  });
}

export function useLockMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lockMember(id),
    onSuccess: (_data, id) => {
      invalidateMemberQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["member", id] });
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}

export function useUnlockMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unlockMember(id),
    onSuccess: (_data, id) => {
      invalidateMemberQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["member", id] });
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}

export function useBulkLockMembersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkLockMembers(ids),
    onSuccess: () => {
      invalidateMemberQueries(queryClient);
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}

export function useBulkUnlockMembersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkUnlockMembers(ids),
    onSuccess: () => {
      invalidateMemberQueries(queryClient);
      invalidateMemberDependencyQueries(queryClient);
    },
  });
}
