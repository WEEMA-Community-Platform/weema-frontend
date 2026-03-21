"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createUser,
  getUserById,
  getUsers,
  toggleUserActivation,
  type CreateUserPayload,
  type UsersListQuery,
} from "@/lib/api/users-admin";

export function useUsersQuery(query: UsersListQuery) {
  return useQuery({
    queryKey: ["users", query],
    queryFn: () => getUsers(query),
  });
}

export function useUserDetailQuery(id: string | null, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id!),
    enabled,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useToggleUserActivationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleUserActivation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
