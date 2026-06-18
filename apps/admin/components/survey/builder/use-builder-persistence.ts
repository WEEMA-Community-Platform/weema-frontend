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
  useTranslateSurveyMutation,
  useUpdateQuestionMutation,
  useUpdateSurveyMutation,
  useUpdateSurveySectionMutation,
  useUpdateSurveySectionSkipConditionsMutation,
} from "@/hooks/use-surveys";
import {
  getSurveyById,
  serializeQuestionPayload,
  serializeSectionPayload,
  serializeSectionSkipConditionsPayload,
} from "@/lib/api/surveys";
import {
  getValidConditionOperatorForQuestionType,
  normalizeSurveyResponse,
  serializeSurveyPayload,
  serializeSurveyTranslationPayload,
  validateSurveyBuilderState,
  type BackendSurveyRecord,
  type CreateSurveyPayload,
} from "@/lib/survey-builder/normalize";
import type { SurveyBuilderState, SurveyQuestion, SurveyValidationIssue } from "@/lib/survey-builder/types";
import type { useSurveyBuilder } from "@/hooks/use-survey-builder";

import {
  buildBuilderSnapshot,
  getIdMapsFromState,
  getSaveAllEligibility,
  type PendingDelete,
  type PendingReorder,
} from "./shared";

type BuilderSnapshot = {
  survey: CreateSurveyPayload;
  sectionSkipConditions?: Array<{
    sectionClientId: string;
    skipConditions: SurveyBuilderState["sections"][number]["skipConditions"];
  }>;
};

function parseSnapshot(snapshot: string | null): BuilderSnapshot | null {
  if (!snapshot) return null;
  try {
    const parsed = JSON.parse(snapshot) as Partial<BuilderSnapshot>;
    if (!parsed || typeof parsed !== "object" || !parsed.survey) return null;
    return {
      survey: parsed.survey,
      sectionSkipConditions: parsed.sectionSkipConditions ?? [],
    };
  } catch {
    return null;
  }
}

function getChangedQuestionClientIds(
  state: SurveyBuilderState,
  lastSnapshot: string | null
) {
  const parsed = parseSnapshot(lastSnapshot);
  if (!parsed) {
    return new Set(state.sections.flatMap((section) => section.questions.map((question) => question.clientId)));
  }
  const currentQuestions = serializeSurveyPayload(state).sections.flatMap((section) => section.questions);
  const lastQuestions = parsed.survey.sections.flatMap((section) => section.questions);
  const lastByClientId = new Map(lastQuestions.map((question) => [question.clientId, question]));
  const changed = new Set<string>();

  for (const question of currentQuestions) {
    const previous = lastByClientId.get(question.clientId);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(question)) {
      changed.add(question.clientId);
    }
  }

  return changed;
}

function getChangedSectionClientIds(
  state: SurveyBuilderState,
  lastSnapshot: string | null
) {
  const parsed = parseSnapshot(lastSnapshot);
  if (!parsed) {
    return new Set(state.sections.map((section) => section.clientId));
  }
  const currentSurvey = serializeSurveyPayload(state);
  const changed = new Set<string>();

  state.sections.forEach((section, index) => {
    const previous = parsed.survey.sections[index];
    const current = currentSurvey.sections[index];
    if (!previous || !current) {
      changed.add(section.clientId);
      return;
    }
    if (previous.title !== current.title || previous.description !== current.description) {
      changed.add(section.clientId);
    }
  });

  const previousSkipBySection = new Map(
    (parsed.sectionSkipConditions ?? []).map((item) => [
      item.sectionClientId,
      item.skipConditions,
    ])
  );
  for (const section of state.sections) {
    if (
      JSON.stringify(previousSkipBySection.get(section.clientId) ?? []) !==
      JSON.stringify(section.skipConditions ?? [])
    ) {
      changed.add(section.clientId);
    }
  }

  return changed;
}

function getConditionRepairQuestionClientIds(
  record: BackendSurveyRecord,
  normalized: SurveyBuilderState
) {
  const normalizedQuestionById = new Map<string, SurveyQuestion>();
  for (const section of normalized.sections) {
    for (const question of section.questions) {
      if (question.id) normalizedQuestionById.set(question.id, question);
    }
  }

  const rawQuestionTypeById = new Map<string, SurveyQuestion["questionType"]>();
  for (const section of record.sections ?? []) {
    for (const question of section.questions ?? []) {
      if (question.id && question.questionType) {
        rawQuestionTypeById.set(question.id, question.questionType);
      }
    }
  }

  const repaired = new Set<string>();
  for (const section of record.sections ?? []) {
    for (const question of section.questions ?? []) {
      const normalizedQuestion = question.id ? normalizedQuestionById.get(question.id) : null;
      if (!normalizedQuestion) continue;
      for (const condition of question.showConditions ?? question.conditions ?? []) {
        const parentQuestionId = condition.parentQuestionId ?? condition.parentQuestionClientId;
        const parentQuestionType = parentQuestionId ? rawQuestionTypeById.get(parentQuestionId) : undefined;
        if (!condition.operator || !parentQuestionType) continue;
        const effectiveOperator = getValidConditionOperatorForQuestionType(
          parentQuestionType,
          condition.operator
        );
        if (effectiveOperator !== condition.operator) {
          repaired.add(normalizedQuestion.clientId);
        }
      }
    }
  }

  return repaired;
}

type Params = {
  initialSurveyId: string | null;
  translationSourceSurveyId: string | null;
  setInitialSurveyId: React.Dispatch<React.SetStateAction<string | null>>;
  builder: ReturnType<typeof useSurveyBuilder>;
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
  translationSourceSurveyId,
  setInitialSurveyId,
  builder,
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
  const translateSurveyMutation = useTranslateSurveyMutation();
  const updateSurveyMutation = useUpdateSurveyMutation();
  const createSectionsMutation = useCreateSurveySectionsMutation();
  const updateSectionMutation = useUpdateSurveySectionMutation();
  const updateSectionSkipConditionsMutation = useUpdateSurveySectionSkipConditionsMutation();
  const deleteSectionMutation = useDeleteSurveySectionMutation();
  const reorderSectionsMutation = useReorderSurveySectionsMutation();
  const createQuestionMutation = useCreateQuestionsMutation();
  const updateQuestionMutation = useUpdateQuestionMutation();
  const deleteQuestionMutation = useDeleteQuestionMutation();
  const reorderQuestionsMutation = useReorderQuestionsMutation();

  const extractCreatedSurveyId = (payload: unknown): string | null => {
    if (!payload || typeof payload !== "object") return null;
    const record = payload as Record<string, unknown>;
    if (typeof record.id === "string" && record.id.trim().length > 0) return record.id;
    if (typeof record.surveyId === "string" && record.surveyId.trim().length > 0) return record.surveyId;
    const data = record.data;
    if (data && typeof data === "object") {
      const dataRecord = data as Record<string, unknown>;
      if (typeof dataRecord.id === "string" && dataRecord.id.trim().length > 0) return dataRecord.id;
      if (typeof dataRecord.surveyId === "string" && dataRecord.surveyId.trim().length > 0) return dataRecord.surveyId;
    }
    const survey = record.survey;
    if (survey && typeof survey === "object") {
      const surveyRecord = survey as Record<string, unknown>;
      if (typeof surveyRecord.id === "string" && surveyRecord.id.trim().length > 0) return surveyRecord.id;
    }
    return null;
  };

  const [savingSectionClientId, setSavingSectionClientId] = useState<string | null>(null);
  const [savingQuestionClientId, setSavingQuestionClientId] = useState<string | null>(null);
  const [isSavingAllChanges, setIsSavingAllChanges] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [pendingReorder, setPendingReorder] = useState<PendingReorder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [lastSyncedSnapshot, setLastSyncedSnapshot] = useState<string | null>(null);
  const [pendingConditionRepairQuestionIds, setPendingConditionRepairQuestionIds] = useState<Set<string>>(
    () => new Set()
  );

  const saveAllEligibility = useMemo(() => {
    if (!initialSurveyId) {
      return {
        canSaveAll: false,
        hasUnsavedChanges: false,
        reason: "Save all changes is only for existing surveys.",
      };
    }
    const baseEligibility = getSaveAllEligibility(builderSnapshot, lastSyncedSnapshot);
    if (baseEligibility.hasUnsavedChanges || pendingConditionRepairQuestionIds.size === 0) {
      return baseEligibility;
    }
    return {
      canSaveAll: true,
      hasUnsavedChanges: true,
      reason: "Save all will repair legacy follow-up conditions for this survey.",
    };
  }, [builderSnapshot, initialSurveyId, lastSyncedSnapshot, pendingConditionRepairQuestionIds]);

  // ─── Core reload ───────────────────────────────────────────────────────────

  const reloadSurvey = async (surveyId: string): Promise<SurveyBuilderState> => {
    const detail = await queryClient.fetchQuery({
      queryKey: ["survey", surveyId],
      queryFn: () => getSurveyById(surveyId),
    });
    const normalized = normalizeSurveyResponse(detail.survey);
    const repairedQuestionIds = getConditionRepairQuestionClientIds(detail.survey, normalized);
    builder.setState(normalized);
    setLastSyncedSnapshot(buildBuilderSnapshot(normalized));
    setPendingConditionRepairQuestionIds(repairedQuestionIds);
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
      const isTranslationDraft =
        !initialSurveyId &&
        Boolean(translationSourceSurveyId) &&
        builder.state.sections.every(
          (section) =>
            Boolean(section.id) &&
            section.questions.every((question) => Boolean(question.id))
        );

      if (isTranslationDraft && translationSourceSurveyId) {
        const payload = serializeSurveyTranslationPayload(builder.state);
        const hasMissingIds = payload.sections.some(
          (section) =>
            !section.id ||
            section.questions.some(
              (question) =>
                !question.id || question.options.some((option) => !option.id)
            )
        );

        if (!hasMissingIds) {
          const result = await translateSurveyMutation.mutateAsync({
            id: translationSourceSurveyId,
            payload,
          });
          const createdSurveyId = extractCreatedSurveyId(result);
          await queryClient.invalidateQueries({ queryKey: ["surveys"] });
          queryClient.removeQueries({ queryKey: ["surveys"] });
          if (createdSurveyId) {
            setInitialSurveyId(createdSurveyId);
            await reloadSurvey(createdSurveyId);
          }
          sileo.success({
            title: "Survey translated",
            description: createdSurveyId
              ? result.message ?? "Translated survey created and opened in edit mode."
              : result.message ?? "Translated survey has been created.",
          });
          return;
        }

        sileo.info({
          title: "Saving as a new survey",
          description:
            "Structure or options no longer match a one-to-one translation; the full survey is being created instead.",
        });
      }

      if (!initialSurveyId) {
        const result = await createSurveyMutation.mutateAsync(serializeSurveyPayload(builder.state));
        const createdSurveyId = extractCreatedSurveyId(result);
        await queryClient.invalidateQueries({ queryKey: ["surveys"] });
        queryClient.removeQueries({ queryKey: ["surveys"] });
        if (createdSurveyId) {
          setInitialSurveyId(createdSurveyId);
          await reloadSurvey(createdSurveyId);
        }
        const fromTranslationFlow = Boolean(translationSourceSurveyId);
        sileo.success({
          title: "Survey created",
          description: fromTranslationFlow
            ? createdSurveyId
              ? result.message ??
                "New survey created from your draft (custom structure or options require a full survey, not translate-only save)."
              : result.message ?? "Survey has been created successfully."
            : createdSurveyId
              ? result.message ?? "Survey created and opened in edit mode."
              : result.message ?? "Survey has been created successfully.",
        });
        if (!createdSurveyId) {
          sileo.info({
            title: "Open survey to continue editing",
            description: "Could not detect created survey ID automatically from the API response.",
          });
        }
        return;
      }
      const result = await updateSurveyMutation.mutateAsync({
        id: initialSurveyId,
        payload: {
          title: builder.state.title.trim(),
          description: builder.state.description.trim(),
          targetType: builder.state.targetType,
          language: builder.state.language,
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
      const draftState = JSON.parse(JSON.stringify(builder.state)) as SurveyBuilderState;
      let workingState = draftState;
      const changedSectionClientIds = getChangedSectionClientIds(draftState, lastSyncedSnapshot);
      const changedQuestionClientIds = getChangedQuestionClientIds(draftState, lastSyncedSnapshot);
      const conditionRepairQuestionIds = new Set(pendingConditionRepairQuestionIds);
      const draftSectionByClientId = new Map(
        draftState.sections.map((section) => [section.clientId, section])
      );
      const draftQuestionByClientId = new Map(
        draftState.sections.flatMap((section) =>
          section.questions.map((question) => [question.clientId, question] as const)
        )
      );

      await updateSurveyMutation.mutateAsync({
        id: initialSurveyId,
        payload: {
          title: builder.state.title.trim(),
          description: builder.state.description.trim(),
          targetType: builder.state.targetType,
          language: builder.state.language,
        },
      });
      const unsyncedSections = draftState.sections.filter((s) => !s.id);
      const hadUnsyncedSections = unsyncedSections.length > 0;
      if (unsyncedSections.length > 0) {
        await createSectionsMutation.mutateAsync({
          surveyId: initialSurveyId,
          payload: unsyncedSections.map((s) =>
            serializeSectionPayload(s, getIdMapsFromState(draftState))
          ),
        });
        workingState = await reloadSurvey(initialSurveyId);
      }
      let hadUnsyncedQuestions = false;
      for (const section of draftState.sections) {
        if (!section.id) continue;
        const unsynced = section.questions.filter((q) => !q.id);
        if (unsynced.length === 0) continue;
        hadUnsyncedQuestions = true;
        await createQuestionMutation.mutateAsync({
          sectionId: section.id,
          payload: unsynced.map((q) => serializeQuestionPayload(q, getIdMapsFromState(draftState))),
        });
      }
      if (hadUnsyncedQuestions) {
        workingState = await reloadSurvey(initialSurveyId);
      }
      for (const section of workingState.sections) {
        if (!section.id) continue;
        if (!changedSectionClientIds.has(section.clientId)) continue;
        const draftSection = draftSectionByClientId.get(section.clientId) ?? section;
        await updateSectionMutation.mutateAsync({
          id: section.id,
          payload: {
            title: draftSection.title.trim(),
            description: draftSection.description.trim(),
          },
        });
        await updateSectionSkipConditionsMutation.mutateAsync({
          id: section.id,
          payload: serializeSectionSkipConditionsPayload(
            draftSection.skipConditions ?? [],
            getIdMapsFromState(workingState)
          ),
        });
      }
      let idMaps = getIdMapsFromState(workingState);
      for (const section of workingState.sections) {
        for (const question of section.questions) {
          if (!question.id) continue;
          const draftQuestion = draftQuestionByClientId.get(question.clientId) ?? question;
          if (!draftQuestion.id) continue;
          if (
            !changedQuestionClientIds.has(question.clientId) &&
            !conditionRepairQuestionIds.has(question.clientId)
          ) {
            continue;
          }
          await updateQuestionMutation.mutateAsync({
            id: question.id,
            payload: serializeQuestionPayload(draftQuestion, idMaps),
          });
        }
      }
      const shouldResyncFollowUps =
        hadUnsyncedSections || hadUnsyncedQuestions || conditionRepairQuestionIds.size > 0;
      if (shouldResyncFollowUps) {
        // Follow-up conditions can reference parent questions/options that only get
        // finalized IDs after create/update passes. Reload and sync affected
        // follow-ups so legacy repairs and new nested references persist.
        workingState = await reloadSurvey(initialSurveyId);
        idMaps = getIdMapsFromState(workingState);
        const syncAllFollowUps = hadUnsyncedSections || hadUnsyncedQuestions;
        for (const section of workingState.sections) {
          for (const question of section.questions) {
            if (!question.id || question.showConditions.length === 0) continue;
            if (
              !syncAllFollowUps &&
              !changedQuestionClientIds.has(question.clientId) &&
              !conditionRepairQuestionIds.has(question.clientId)
            ) {
              continue;
            }
            await updateQuestionMutation.mutateAsync({
              id: question.id,
              payload: serializeQuestionPayload(question, idMaps),
            });
          }
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
    const stateMaps = getIdMapsFromState(builder.state);
    setSavingSectionClientId(sectionClientId);
    try {
      if (section.id) {
        const result = await updateSectionMutation.mutateAsync({
          id: section.id,
          payload: { title: section.title.trim(), description: section.description.trim() },
        });
        await updateSectionSkipConditionsMutation.mutateAsync({
          id: section.id,
          payload: serializeSectionSkipConditionsPayload(
            section.skipConditions ?? [],
            stateMaps
          ),
        });
        sileo.success({ title: "Section saved", description: result.message ?? "Section has been updated." });
      } else {
        const draftSection = section;
        const result = await createSectionsMutation.mutateAsync({
          surveyId: initialSurveyId,
          payload: [serializeSectionPayload(section, stateMaps)],
        });
        const refreshed = await reloadSurvey(initialSurveyId);
        const createdSection = refreshed.sections.find((s) => s.clientId === draftSection.clientId);
        if (createdSection?.id) {
          await updateSectionSkipConditionsMutation.mutateAsync({
            id: createdSection.id,
            payload: serializeSectionSkipConditionsPayload(
              draftSection.skipConditions ?? [],
              getIdMapsFromState(refreshed)
            ),
          });
        }
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
      let idMaps = getIdMapsFromState(builder.state);

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
          prev === pendingDelete.sectionClientId
            ? builder.state.sections.find((s) => s.clientId !== pendingDelete.sectionClientId)
                ?.clientId ?? null
            : prev
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
    isCreatingSurvey: createSurveyMutation.isPending || translateSurveyMutation.isPending,
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
