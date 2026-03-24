"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createQuestions,
  createSurvey,
  createSurveySections,
  deleteQuestion,
  deleteSurveySection,
  deleteSurvey,
  getSurveyById,
  getSurveys,
  publishSurvey,
  reorderQuestions,
  reorderSurveySections,
  updateQuestion,
  updateSurvey,
  updateSurveySection,
  type SurveysListQuery,
  type CreateSectionPayload,
  type UpsertQuestionPayload,
  type UpdateSurveyPayload,
} from "@/lib/api/surveys";
import type { CreateSurveyPayload } from "@/lib/survey-builder/normalize";

export function useSurveysQuery(query: SurveysListQuery) {
  return useQuery({
    queryKey: ["surveys", query],
    queryFn: () => getSurveys(query),
  });
}

export function useSurveyDetailQuery(id: string | null, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useQuery({
    queryKey: ["survey", id],
    queryFn: () => getSurveyById(id!),
    enabled,
  });
}

export function useCreateSurveyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSurveyPayload) => createSurvey(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
  });
}

function invalidateSurveyQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["surveys"] });
  queryClient.invalidateQueries({ queryKey: ["survey"] });
}

export function useUpdateSurveyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSurveyPayload }) =>
      updateSurvey(id, payload),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useDeleteSurveyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSurvey(id),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function usePublishSurveyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishSurvey(id),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useCreateSurveySectionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, payload }: { surveyId: string; payload: CreateSectionPayload }) =>
      createSurveySections(surveyId, payload),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useUpdateSurveySectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { title: string; description: string };
    }) => updateSurveySection(id, payload),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useDeleteSurveySectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSurveySection(id),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useReorderSurveySectionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionIds: string[]) => reorderSurveySections(sectionIds),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useCreateQuestionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      payload,
    }: {
      sectionId: string;
      payload: UpsertQuestionPayload[];
    }) => createQuestions(sectionId, payload),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useUpdateQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertQuestionPayload }) =>
      updateQuestion(id, payload),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useDeleteQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}

export function useReorderQuestionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => reorderQuestions(questionIds),
    onSuccess: () => {
      invalidateSurveyQueries(queryClient);
    },
  });
}
