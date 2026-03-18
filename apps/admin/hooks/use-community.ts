"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addClustersToFederation,
  createCluster,
  createFederation,
  createSHG,
  deleteCluster,
  deleteFederation,
  deleteSHG,
  getClusterById,
  getClusters,
  getFederationById,
  getFederations,
  getSHGById,
  getSHGs,
  removeClusterFromFederation,
  updateCluster,
  updateFederation,
  updateSHG,
  type ClusterListQuery,
  type ClusterPayload,
  type FederationListQuery,
  type FederationPayload,
  type SHGListQuery,
  type SHGPayload,
  type SHGUpdatePayload,
} from "@/lib/api/community";

// ─── Detail (by-ID) hooks ─────────────────────────────────────────────────────

export function useFederationDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ["federation", id],
    queryFn: () => getFederationById(id!),
    enabled: !!id,
  });
}

export function useClusterDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ["cluster", id],
    queryFn: () => getClusterById(id!),
    enabled: !!id,
  });
}

export function useSHGDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ["shg", id],
    queryFn: () => getSHGById(id!),
    enabled: !!id,
  });
}

// ─── Federation hooks ─────────────────────────────────────────────────────────

export function useFederationsQuery(query: FederationListQuery = {}) {
  return useQuery({
    queryKey: ["federations", query],
    queryFn: () => getFederations(query),
  });
}

export function useCreateFederationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FederationPayload) => createFederation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["federations"] });
    },
  });
}

export function useUpdateFederationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FederationPayload }) =>
      updateFederation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["federations"] });
    },
  });
}

export function useDeleteFederationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFederation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["federations"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });
}

export function useAddClustersToFederationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      federationId,
      clusterIds,
    }: {
      federationId: string;
      clusterIds: string[];
    }) => addClustersToFederation(federationId, clusterIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["federations"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });
}

export function useRemoveClusterFromFederationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      federationId,
      clusterId,
    }: {
      federationId: string;
      clusterId: string;
    }) => removeClusterFromFederation(federationId, clusterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["federations"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });
}

// ─── Cluster hooks ────────────────────────────────────────────────────────────

export function useClustersQuery(query: ClusterListQuery = {}) {
  return useQuery({
    queryKey: ["clusters", query],
    queryFn: () => getClusters(query),
  });
}

export function useCreateClusterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClusterPayload) => createCluster(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });
}

export function useUpdateClusterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClusterPayload }) =>
      updateCluster(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["federations"] });
    },
  });
}

export function useDeleteClusterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCluster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      queryClient.invalidateQueries({ queryKey: ["federations"] });
      queryClient.invalidateQueries({ queryKey: ["shgs"] });
    },
  });
}

// ─── SHG hooks ────────────────────────────────────────────────────────────────

export function useSHGsQuery(query: SHGListQuery = {}) {
  return useQuery({
    queryKey: ["shgs", query],
    queryFn: () => getSHGs(query),
  });
}

export function useCreateSHGMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SHGPayload) => createSHG(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shgs"] });
    },
  });
}

export function useUpdateSHGMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SHGUpdatePayload }) =>
      updateSHG(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shgs"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });
}

export function useDeleteSHGMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSHG(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shgs"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
  });
}
