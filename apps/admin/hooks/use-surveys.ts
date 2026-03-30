"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveSurveyAssignment,
  assignSurveyTargets,
  createQuestions,
  createSurvey,
  createSurveySections,
  deleteQuestion,
  deleteSurveySection,
  deleteSurvey,
  getSurveyAssignmentTargets,
  getSurveyById,
  getSurveySubmissionById,
  getSurveySubmissionsByAssignmentId,
  getSurveySubmissionsBySurveyId,
  getSurveys,
  publishSurvey,
  rejectSurveyAssignment,
  reorderQuestions,
  reorderSurveySections,
  updateQuestion,
  saveSurveySubmissionAnswer,
  submitSurveySubmission,
  updateSurveySubmissionAnswer,
  updateSurvey,
  updateSurveySection,
  type SurveysListQuery,
  type CreateSectionPayload,
  type UpsertQuestionPayload,
  type RejectSurveyAssignmentPayload,
  type UpsertSubmissionAnswerPayload,
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

export function useSurveySubmissionsBySurveyQuery(
  surveyId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!surveyId;
  return useQuery({
    queryKey: ["survey", surveyId, "submissions"],
    queryFn: () => getSurveySubmissionsBySurveyId(surveyId!),
    enabled,
  });
}

export function useSurveySubmissionsByAssignmentQuery(
  assignmentId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!assignmentId;
  return useQuery({
    queryKey: ["survey-assignment", assignmentId, "submissions"],
    queryFn: () => getSurveySubmissionsByAssignmentId(assignmentId!),
    enabled,
  });
}

export function useSurveySubmissionDetailQuery(
  submissionId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!submissionId;
  return useQuery({
    queryKey: ["survey-submission", submissionId],
    queryFn: () => getSurveySubmissionById(submissionId!),
    enabled,
  });
}

export function useSaveSurveySubmissionAnswerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: UpsertSubmissionAnswerPayload;
    }) => saveSurveySubmissionAnswer(submissionId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["survey-submission", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
  });
}

export function useUpdateSurveySubmissionAnswerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      answerId,
      payload,
    }: {
      submissionId: string;
      answerId: string;
      payload: UpsertSubmissionAnswerPayload;
    }) => updateSurveySubmissionAnswer(submissionId, answerId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["survey-submission", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
  });
}

export function useSubmitSurveySubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) => submitSurveySubmission(submissionId),
    onSuccess: (_result, submissionId) => {
      queryClient.invalidateQueries({
        queryKey: ["survey-submission", submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
  });
}

export function useApproveSurveyAssignmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => approveSurveyAssignment(assignmentId),
    onSuccess: (_result, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ["survey-assignment", assignmentId, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
  });
}

export function useRejectSurveyAssignmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      payload,
    }: {
      assignmentId: string;
      payload: RejectSurveyAssignmentPayload;
    }) => rejectSurveyAssignment(assignmentId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["survey-assignment", variables.assignmentId, "submissions"],
      });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
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

export function useSurveyAssignmentTargetsQuery(
  surveyId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!surveyId;
  return useQuery({
    queryKey: ["survey", surveyId, "assignment-targets"],
    queryFn: () => getSurveyAssignmentTargets(surveyId!),
    enabled,
  });
}

export function useAssignSurveyTargetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, targetIds }: { surveyId: string; targetIds: string[] }) =>
      assignSurveyTargets(surveyId, targetIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["survey", variables.surveyId, "assignment-targets"],
      });
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
