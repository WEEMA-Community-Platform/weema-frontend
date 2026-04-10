"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";

import {
  useCreateQuestionsMutation,
  useCreateSurveyMutation,
  useCreateSurveySectionsMutation,
  useDeleteQuestionMutation,
  useDeleteSurveySectionMutation,
  useReorderQuestionsMutation,
  useReorderSurveySectionsMutation,
  useUpdateQuestionMutation,
  useUpdateSurveyMutation,
  useUpdateSurveySectionMutation,
} from "@/hooks/use-surveys";
import {
  getSurveyById,
  serializeQuestionPayload,
  serializeSectionPayload,
} from "@/lib/api/surveys";
import {
  normalizeSurveyResponse,
  serializeSurveyPayload,
  validateSurveyBuilderState,
} from "@/lib/survey-builder/normalize";
import type { SurveyBuilderState, SurveyValidationIssue } from "@/lib/survey-builder/types";
import type { useSurveyBuilder } from "@/hooks/use-survey-builder";

import {
  buildBuilderSnapshot,
  getIdMapsFromState,
  getSaveAllEligibility,
  type PendingDelete,
  type PendingReorder,
} from "./shared";

type Params = {
  initialSurveyId: string | null;
  builder: ReturnType<typeof useSurveyBuilder>;
  questionIdByClientId: Map<string, string>;
  optionIdByClientId: Map<string, string>;
  totalQuestionCount: number;
  builderSnapshot: string;
  setIssues: React.Dispatch<React.SetStateAction<SurveyValidationIssue[]>>;
  setSelectedSectionClientId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedQuestionClientId: React.Dispatch<React.SetStateAction<string | null>>;
  setLastMovedSectionClientId: (id: string | null) => void;
  setLastMovedQuestionClientId: (id: string | null) => void;
};

export function useBuilderPersistence({
  initialSurveyId,
  builder,
  questionIdByClientId,
  optionIdByClientId,
  totalQuestionCount,
  builderSnapshot,
  setIssues,
  setSelectedSectionClientId,
  setSelectedQuestionClientId,
  setLastMovedSectionClientId,
  setLastMovedQuestionClientId,
}: Params) {
  const queryClient = useQueryClient();
  const createSurveyMutation = useCreateSurveyMutation();
  const updateSurveyMutation = useUpdateSurveyMutation();
  const createSectionsMutation = useCreateSurveySectionsMutation();
  const updateSectionMutation = useUpdateSurveySectionMutation();
  const deleteSectionMutation = useDeleteSurveySectionMutation();
  const reorderSectionsMutation = useReorderSurveySectionsMutation();
  const createQuestionMutation = useCreateQuestionsMutation();
  const updateQuestionMutation = useUpdateQuestionMutation();
  const deleteQuestionMutation = useDeleteQuestionMutation();
  const reorderQuestionsMutation = useReorderQuestionsMutation();

  const [savingSectionClientId, setSavingSectionClientId] = useState<string | null>(null);
  const [savingQuestionClientId, setSavingQuestionClientId] = useState<string | null>(null);
  const [isSavingAllChanges, setIsSavingAllChanges] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [pendingReorder, setPendingReorder] = useState<PendingReorder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [lastSyncedSnapshot, setLastSyncedSnapshot] = useState<string | null>(null);

  const saveAllEligibility = useMemo(() => {
    if (!initialSurveyId) {
      return {
        canSaveAll: false,
        hasUnsavedChanges: false,
        reason: "Save all changes is only for existing surveys.",
      };
    }
    return getSaveAllEligibility(builderSnapshot, lastSyncedSnapshot);
  }, [builderSnapshot, initialSurveyId, lastSyncedSnapshot]);

  // ─── Core reload ───────────────────────────────────────────────────────────

  const reloadSurvey = async (surveyId: string): Promise<SurveyBuilderState> => {
    const detail = await queryClient.fetchQuery({
      queryKey: ["survey", surveyId],
      queryFn: () => getSurveyById(surveyId),
    });
    const normalized = normalizeSurveyResponse(detail.survey);
    builder.setState(normalized);
    setLastSyncedSnapshot(buildBuilderSnapshot(normalized));
    setSelectedSectionClientId((prev) =>
      normalized.sections.some((s) => s.clientId === prev)
        ? prev
        : (normalized.sections[0]?.clientId ?? null)
    );
    setSelectedQuestionClientId((prev) =>
      normalized.sections.some((s) => s.questions.some((q) => q.clientId === prev))
        ? prev
        : null
    );
    setIssues([]);
    return normalized;
  };

  // ─── Save survey / settings ───────────────────────────────────────────────

  const handleSaveSurvey = async () => {
    if (!initialSurveyId && totalQuestionCount === 0) {
      sileo.warning({
        title: "No questions added",
        description: "Add at least one question before creating the survey.",
      });
      return;
    }
    const validationIssues = validateSurveyBuilderState(builder.state);
    setIssues(validationIssues);
    if (validationIssues.length > 0) {
      sileo.warning({
        title: "Validation issues found",
        description: validationIssues[0]?.message ?? "Fix the form before saving.",
      });
      return;
    }
    try {
      if (!initialSurveyId) {
        const result = await createSurveyMutation.mutateAsync(serializeSurveyPayload(builder.state));
        await queryClient.invalidateQueries({ queryKey: ["surveys"] });
        queryClient.removeQueries({ queryKey: ["surveys"] });
        sileo.success({
          title: "Survey created",
          description: result.message ?? "Survey has been created successfully.",
        });
        return;
      }
      const result = await updateSurveyMutation.mutateAsync({
        id: initialSurveyId,
        payload: {
          title: builder.state.title.trim(),
          description: builder.state.description.trim(),
          targetType: builder.state.targetType,
        },
      });
      sileo.success({
        title: "Survey settings saved",
        description: result.message ?? "Survey settings have been updated.",
      });
    } catch (error) {
      sileo.error({
        title: "Failed to save survey",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  // ─── Save all ──────────────────────────────────────────────────────────────

  const handleSaveAllChanges = async () => {
    if (!initialSurveyId) {
      await handleSaveSurvey();
      return;
    }
    if (!saveAllEligibility.hasUnsavedChanges) {
      sileo.info({ title: "No changes to save", description: "Everything is already synced." });
      return;
    }
    if (!saveAllEligibility.canSaveAll) {
      sileo.info({
        title: "Use Save all for bulk edits",
        description:
          "Save all is enabled for 2+ unsaved question changes, a new section with questions, or nested follow-up changes.",
      });
      return;
    }
    const validationIssues = validateSurveyBuilderState(builder.state);
    setIssues(validationIssues);
    if (validationIssues.length > 0) {
      sileo.warning({
        title: "Validation issues found",
        description: validationIssues[0]?.message ?? "Fix the form before saving.",
      });
      return;
    }
    setIsSavingAllChanges(true);
    try {
      await updateSurveyMutation.mutateAsync({
        id: initialSurveyId,
        payload: {
          title: builder.state.title.trim(),
          description: builder.state.description.trim(),
          targetType: builder.state.targetType,
        },
      });
      const unsyncedSections = builder.state.sections.filter((s) => !s.id);
      if (unsyncedSections.length > 0) {
        await createSectionsMutation.mutateAsync({
          surveyId: initialSurveyId,
          payload: unsyncedSections.map((s) =>
            serializeSectionPayload(s, getIdMapsFromState(builder.state))
          ),
        });
        await reloadSurvey(initialSurveyId);
      }
      for (const section of builder.state.sections) {
        if (!section.id) continue;
        const unsynced = section.questions.filter((q) => !q.id);
        if (unsynced.length === 0) continue;
        await createQuestionMutation.mutateAsync({
          sectionId: section.id,
          payload: unsynced.map((q) => serializeQuestionPayload(q, getIdMapsFromState(builder.state))),
        });
      }
      await reloadSurvey(initialSurveyId);
      for (const section of builder.state.sections) {
        if (!section.id) continue;
        await updateSectionMutation.mutateAsync({
          id: section.id,
          payload: { title: section.title.trim(), description: section.description.trim() },
        });
      }
      const idMaps = getIdMapsFromState(builder.state);
      for (const section of builder.state.sections) {
        for (const question of section.questions) {
          if (!question.id) continue;
          await updateQuestionMutation.mutateAsync({
            id: question.id,
            payload: serializeQuestionPayload(question, idMaps),
          });
        }
      }
      await reloadSurvey(initialSurveyId);
      sileo.success({
        title: "All changes saved",
        description: "Survey settings, sections, and questions are now synced.",
      });
    } catch (error) {
      sileo.error({
        title: "Failed to save all changes",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSavingAllChanges(false);
    }
  };

  // ─── Section save ─────────────────────────────────────────────────────────

  const saveSection = async (sectionClientId: string) => {
    if (!initialSurveyId) {
      sileo.info({ title: "Create survey first", description: "Create the survey first, then save sections." });
      return;
    }
    const section = builder.state.sections.find((s) => s.clientId === sectionClientId);
    if (!section) return;
    setSavingSectionClientId(sectionClientId);
    try {
      if (section.id) {
        const result = await updateSectionMutation.mutateAsync({
          id: section.id,
          payload: { title: section.title.trim(), description: section.description.trim() },
        });
        sileo.success({ title: "Section saved", description: result.message ?? "Section has been updated." });
      } else {
        const result = await createSectionsMutation.mutateAsync({
          surveyId: initialSurveyId,
          payload: [serializeSectionPayload(section, { questionIdByClientId, optionIdByClientId })],
        });
        sileo.success({ title: "Section created", description: result.message ?? "Section has been added." });
      }
      await reloadSurvey(initialSurveyId);
    } catch (error) {
      sileo.error({
        title: "Failed to save section",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setSavingSectionClientId(null);
    }
  };

  // ─── Question save ────────────────────────────────────────────────────────

  const saveQuestion = async (sectionClientId: string, questionClientId: string) => {
    const section = builder.state.sections.find((s) => s.clientId === sectionClientId);
    const question = section?.questions.find((q) => q.clientId === questionClientId);
    if (!section || !question) return;
    if (!initialSurveyId) {
      sileo.info({ title: "Create survey first", description: "Questions can be synced after the survey is created." });
      return;
    }
    setSavingQuestionClientId(questionClientId);
    try {
      let resolvedSectionId: string | null = section.id ?? null;
      let idMaps = { questionIdByClientId, optionIdByClientId };

      if (!resolvedSectionId) {
        setSavingSectionClientId(sectionClientId);
        await createSectionsMutation.mutateAsync({
          surveyId: initialSurveyId,
          payload: [serializeSectionPayload(section, idMaps)],
        });
        const refreshed = await reloadSurvey(initialSurveyId);
        setSavingSectionClientId(null);
        resolvedSectionId = refreshed.sections.find((s) => s.clientId === sectionClientId)?.id ?? null;
        if (!resolvedSectionId) {
          sileo.error({ title: "Failed to save section", description: "Section could not be synced. Please try again." });
          return;
        }
        idMaps = getIdMapsFromState(refreshed);
      }

      if (question.id) {
        const result = await updateQuestionMutation.mutateAsync({
          id: question.id,
          payload: serializeQuestionPayload(question, idMaps),
        });
        sileo.success({ title: "Question saved", description: result.message ?? "Question has been updated." });
      } else {
        const result = await createQuestionMutation.mutateAsync({
          sectionId: resolvedSectionId,
          payload: [serializeQuestionPayload(question, idMaps)],
        });
        sileo.success({ title: "Question saved", description: result.message ?? "Question has been added." });
      }
      await reloadSurvey(initialSurveyId);
    } catch (error) {
      sileo.error({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setSavingQuestionClientId(null);
      setSavingSectionClientId(null);
    }
  };

  // ─── Reorder ──────────────────────────────────────────────────────────────

  const confirmReorder = async () => {
    if (!pendingReorder) return;
    setIsSavingReorder(true);
    try {
      if (pendingReorder.kind === "section") {
        const fromIndex = builder.state.sections.findIndex(
          (s) => s.clientId === pendingReorder.activeSectionClientId
        );
        const toIndex = builder.state.sections.findIndex(
          (s) => s.clientId === pendingReorder.overSectionClientId
        );
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) { setPendingReorder(null); return; }
        const moved = builder.state.sections[fromIndex];
        builder.moveSection(fromIndex, toIndex);
        setLastMovedSectionClientId(moved?.clientId ?? null);
        const sectionIds = builder.state.sections.map((s) => s.id).filter((id): id is string => Boolean(id));
        if (initialSurveyId && sectionIds.length === builder.state.sections.length && sectionIds.length > 1) {
          const reordered = [...builder.state.sections];
          const [m] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, m);
          const result = await reorderSectionsMutation.mutateAsync(
            reordered.map((s) => s.id).filter((id): id is string => Boolean(id))
          );
          sileo.success({ title: "Section order updated", description: result.message ?? "Section order has been saved." });
          await reloadSurvey(initialSurveyId);
        } else {
          sileo.info({ title: "Section order updated locally", description: "Only synced sections can be reordered on the backend." });
        }
      } else {
        const section = builder.state.sections.find((s) => s.clientId === pendingReorder.sectionClientId);
        const fromIndex = section?.questions.findIndex((q) => q.clientId === pendingReorder.activeQuestionClientId) ?? -1;
        const toIndex = section?.questions.findIndex((q) => q.clientId === pendingReorder.overQuestionClientId) ?? -1;
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) { setPendingReorder(null); return; }
        const moved = section?.questions[fromIndex];
        builder.reorderQuestions(pendingReorder.sectionClientId, fromIndex, toIndex);
        setLastMovedQuestionClientId(moved?.clientId ?? null);
        const questions = section?.questions ?? [];
        const questionIds = questions.map((q) => q.id).filter((id): id is string => Boolean(id));
        if (initialSurveyId && section?.id && questionIds.length === questions.length && questionIds.length > 1) {
          const reordered = [...questions];
          const [m] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, m);
          const result = await reorderQuestionsMutation.mutateAsync(
            reordered.map((q) => q.id).filter((id): id is string => Boolean(id))
          );
          sileo.success({ title: "Question order updated", description: result.message ?? "Question order has been saved." });
          await reloadSurvey(initialSurveyId);
        } else {
          sileo.info({ title: "Question order updated locally", description: "Only synced questions can be reordered on the backend." });
        }
      }
    } catch (error) {
      sileo.error({ title: "Failed to reorder", description: error instanceof Error ? error.message : "Unexpected error" });
    } finally {
      setIsSavingReorder(false);
    }
    setPendingReorder(null);
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === "section") {
        const section = builder.state.sections.find((s) => s.clientId === pendingDelete.sectionClientId);
        if (section?.id) {
          const result = await deleteSectionMutation.mutateAsync(section.id);
          sileo.success({ title: "Section deleted", description: result.message ?? "Section has been removed." });
          if (initialSurveyId) await reloadSurvey(initialSurveyId);
        } else {
          builder.deleteSection(pendingDelete.sectionClientId);
          sileo.success({ title: "Section deleted", description: "Unsynced section has been removed locally." });
        }
        setSelectedSectionClientId((prev) =>
          prev === pendingDelete.sectionClientId ? null : prev
        );
      } else {
        const section = builder.state.sections.find((s) => s.clientId === pendingDelete.sectionClientId);
        const question = section?.questions.find((q) => q.clientId === pendingDelete.questionClientId);
        if (question?.id) {
          const result = await deleteQuestionMutation.mutateAsync(question.id);
          sileo.success({ title: "Question deleted", description: result.message ?? "Question has been removed." });
          if (initialSurveyId) await reloadSurvey(initialSurveyId);
        } else {
          builder.deleteQuestion(pendingDelete.sectionClientId, pendingDelete.questionClientId);
          sileo.success({ title: "Question deleted", description: "Unsynced question has been removed locally." });
        }
        setSelectedQuestionClientId((prev) =>
          prev === pendingDelete.questionClientId ? null : prev
        );
      }
    } catch (error) {
      sileo.error({ title: "Failed to delete", description: error instanceof Error ? error.message : "Unexpected error" });
    }
    setPendingDelete(null);
  };

  return {
    // Loading states
    savingSectionClientId,
    savingQuestionClientId,
    isSavingAllChanges,
    isSavingReorder,
    isCreatingSurvey: createSurveyMutation.isPending,
    // Sync
    lastSyncedSnapshot,
    setLastSyncedSnapshot,
    saveAllEligibility,
    // Pending operations
    pendingReorder,
    setPendingReorder,
    pendingDelete,
    setPendingDelete,
    // Operations
    reloadSurvey,
    saveSection,
    saveQuestion,
    handleSaveSurvey,
    handleSaveAllChanges,
    confirmReorder,
    confirmDelete,
  };
}
