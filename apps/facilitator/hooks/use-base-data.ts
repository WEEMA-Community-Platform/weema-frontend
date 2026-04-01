"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createKebele,
  createReligion,
  createRegion,
  createWoreda,
  createZone,
  deleteKebele,
  deleteReligion,
  deleteRegion,
  deleteWoreda,
  deleteZone,
  getKebeles,
  getReligions,
  getRegions,
  getWoredas,
  getZones,
  type KebeleListQuery,
  type KebelePayload,
  type PaginatedQuery,
  type RegionPayload,
  type WoredaListQuery,
  type WoredaPayload,
  type ZoneListQuery,
  type ZonePayload,
  updateKebele,
  updateReligion,
  updateRegion,
  updateWoreda,
  updateZone,
} from "@/lib/api/base-data";

export function useRegionsQuery(query: PaginatedQuery = {}) {
  return useQuery({
    queryKey: ["regions", query],
    queryFn: () => getRegions(query),
  });
}

export function useZonesQuery(query: ZoneListQuery = {}) {
  return useQuery({
    queryKey: ["zones", query],
    queryFn: () => getZones(query),
  });
}

export function useWoredasQuery(query: WoredaListQuery = {}) {
  return useQuery({
    queryKey: ["woredas", query],
    queryFn: () => getWoredas(query),
  });
}

export function useReligionsQuery(query: PaginatedQuery = {}) {
  return useQuery({
    queryKey: ["religions", query],
    queryFn: () => getReligions(query),
  });
}

export function useKebelesQuery(query: KebeleListQuery = {}) {
  return useQuery({
    queryKey: ["kebeles", query],
    queryFn: () => getKebeles(query),
  });
}

export function useCreateRegionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegionPayload) => createRegion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

export function useUpdateRegionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RegionPayload }) =>
      updateRegion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useDeleteRegionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useCreateZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ZonePayload) => createZone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useUpdateZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ZonePayload }) =>
      updateZone(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useDeleteZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useCreateWoredaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WoredaPayload) => createWoreda(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["woredas"] });
    },
  });
}

export function useUpdateWoredaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WoredaPayload }) =>
      updateWoreda(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["woredas"] });
    },
  });
}

export function useDeleteWoredaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWoreda(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["woredas"] });
    },
  });
}

export function useCreateReligionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegionPayload) => createReligion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["religions"] });
    },
  });
}

export function useUpdateReligionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RegionPayload }) =>
      updateReligion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["religions"] });
    },
  });
}

export function useDeleteReligionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReligion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["religions"] });
    },
  });
}

export function useCreateKebeleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: KebelePayload) => createKebele(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kebeles"] });
    },
  });
}

export function useUpdateKebeleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: KebelePayload }) =>
      updateKebele(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kebeles"] });
    },
  });
}

export function useDeleteKebeleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKebele(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kebeles"] });
    },
  });
}

