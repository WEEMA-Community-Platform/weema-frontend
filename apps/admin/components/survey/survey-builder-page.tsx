"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type DragEndEvent } from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSurveyBuilder } from "@/hooks/use-survey-builder";
import { exportSurveyById } from "@/lib/api/surveys";
import type {
  SectionSkipCondition,
  ShowCondition,
  SurveyValidationIssue,
} from "@/lib/survey-builder/types";
import { createEmptySurvey } from "@/lib/survey-builder/utils";
import {
  buildSurveyDetailExportCsv,
  type SurveyDetailCsvLabels,
} from "@/lib/survey-export-csv";
import { downloadBaseDataCsv, exportFilename, slugifyForFilename } from "@/lib/base-data-csv";
import { SurveyPreviewPanel } from "@/components/survey/survey-preview-panel";
import { BuilderDialogs } from "@/components/survey/builder/builder-dialogs";
import { BuilderHeader } from "@/components/survey/builder/builder-header";
import { BuilderNavigator } from "@/components/survey/builder/builder-navigator";
import { SurveyBuilderLoadingSkeleton } from "@/components/survey/builder/survey-builder-loading-skeleton";
import { SurveyBuilderMainPanel } from "@/components/survey/builder/survey-builder-main-panel";
import { useBuilderLeaveGuard } from "@/components/survey/builder/use-builder-leave-guard";
import { useBuilderPersistence } from "@/components/survey/builder/use-builder-persistence";
import {
  buildBuilderSnapshot,
  createFollowUpCondition,
  getFollowUpDepth,
  getQuestionParentId,
  type EditorMode,
  type SurveyQuestionWithContext,
} from "@/components/survey/builder/shared";

export function SurveyBuilderPage({
  initialSurveyId: routeSurveyId,
  translationSourceSurveyId,
  translationLanguage,
}: {
  initialSurveyId?: string | null;
  translationSourceSurveyId?: string | null;
  translationLanguage?: "en" | "am";
}) {
  const [initialSurveyId, setInitialSurveyId] = useState<string | null>(routeSurveyId ?? null);
  const [isLoadingInitialSurvey, setIsLoadingInitialSurvey] = useState(
    Boolean(routeSurveyId || translationSourceSurveyId)
  );
  const [editorMode, setEditorMode] = useState<EditorMode>("settings");
  const [selectedSectionClientId, setSelectedSectionClientId] = useState<string | null>(null);
  const [selectedQuestionClientId, setSelectedQuestionClientId] = useState<string | null>(null);
  const [issues, setIssues] = useState<SurveyValidationIssue[]>([]);
  const [lastMovedSectionClientId, setLastMovedSectionClientId] = useState<string | null>(null);
  const [lastMovedQuestionClientId, setLastMovedQuestionClientId] = useState<string | null>(null);
  const [multiFollowUpSelections, setMultiFollowUpSelections] = useState<Record<string, string[]>>(
    {}
  );
  const [multiFollowUpLogicTypeBySection, setMultiFollowUpLogicTypeBySection] = useState<
    Record<string, ShowCondition["logicType"]>
  >({});
  const [exportDetailPending, setExportDetailPending] = useState(false);
  const initialDraftSnapshotRef = useRef<string | null>(null);

  const tExport = useTranslations("survey.export");
  const tDetail = useTranslations("survey.export.detail");
  const tCommonBase = useTranslations("basedata.common");
  const tValidation = useTranslations("common.validation");

  const builder = useSurveyBuilder(createEmptySurvey());
  if (initialDraftSnapshotRef.current === null) {
    initialDraftSnapshotRef.current = buildBuilderSnapshot(builder.state);
  }

  const allQuestions = useMemo<SurveyQuestionWithContext[]>(
    () =>
      builder.state.sections.flatMap((section) =>
        section.questions.map((q) => ({
          ...q,
          sectionClientId: section.clientId,
          sectionTitle: section.title || "Untitled section",
        }))
      ),
    [builder.state.sections]
  );

  const questionByClientId = useMemo(
    () => new Map(allQuestions.map((q) => [q.clientId, q])),
    [allQuestions]
  );
  const questionIdByClientId = useMemo(
    () =>
      new Map(
        allQuestions
          .filter((q) => Boolean(q.id))
          .map((q) => [q.clientId, q.id as string])
      ),
    [allQuestions]
  );
  const optionIdByClientId = useMemo(() => {
    const entries: Array<[string, string]> = [];
    for (const q of allQuestions) {
      for (const opt of q.options) {
        if (opt.id) entries.push([opt.clientId, opt.id]);
      }
    }
    return new Map(entries);
  }, [allQuestions]);

  const dependentsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const q of allQuestions) {
      for (const c of q.showConditions) {
        const current = map.get(c.parentQuestionClientId) ?? [];
        map.set(c.parentQuestionClientId, [...current, q.clientId]);
      }
    }
    return map;
  }, [allQuestions]);

  const totalQuestionCount = useMemo(
    () => builder.state.sections.reduce((sum, s) => sum + s.questions.length, 0),
    [builder.state.sections]
  );
  const builderSnapshot = useMemo(() => buildBuilderSnapshot(builder.state), [builder.state]);

  const selectedSection =
    builder.state.sections.find((s) => s.clientId === selectedSectionClientId) ??
    builder.state.sections[0] ??
    null;
  const selectedQuestion = selectedQuestionClientId
    ? (questionByClientId.get(selectedQuestionClientId) ?? null)
    : null;
  const isTranslationMode = Boolean(translationSourceSurveyId) || builder.state.isTranslation;

  useEffect(() => {
    if (editorMode === "settings") return;
    if (selectedSectionClientId) return;
    const firstSectionId = builder.state.sections[0]?.clientId;
    if (!firstSectionId) return;
    setSelectedSectionClientId(firstSectionId);
  }, [builder.state.sections, editorMode, selectedSectionClientId]);

  useEffect(() => {
    if (editorMode !== "question") return;
    if (selectedQuestion) return;
    if (!selectedSection) return;
    setEditorMode("cards");
  }, [editorMode, selectedQuestion, selectedSection]);

  const persistence = useBuilderPersistence({
    initialSurveyId,
    translationSourceSurveyId: translationSourceSurveyId ?? null,
    setInitialSurveyId,
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
  });

  const hasUnsavedDraftChanges = useMemo(() => {
    if (initialSurveyId) {
      return persistence.saveAllEligibility.hasUnsavedChanges;
    }
    return builderSnapshot !== initialDraftSnapshotRef.current;
  }, [builderSnapshot, initialSurveyId, persistence.saveAllEligibility.hasUnsavedChanges]);

  const leaveGuard = useBuilderLeaveGuard(hasUnsavedDraftChanges);

  useEffect(() => {
    if (!lastMovedSectionClientId) return;
    const t = window.setTimeout(() => setLastMovedSectionClientId(null), 320);
    return () => window.clearTimeout(t);
  }, [lastMovedSectionClientId]);

  useEffect(() => {
    if (!lastMovedQuestionClientId) return;
    const t = window.setTimeout(() => setLastMovedQuestionClientId(null), 320);
    return () => window.clearTimeout(t);
  }, [lastMovedQuestionClientId]);

  useEffect(() => {
    const sourceSurveyId = translationSourceSurveyId ?? routeSurveyId;
    if (!sourceSurveyId) {
      setInitialSurveyId(null);
      setIsLoadingInitialSurvey(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setInitialSurveyId(translationSourceSurveyId ? null : sourceSurveyId);
        setIsLoadingInitialSurvey(true);
        const loaded = await persistence.reloadSurvey(sourceSurveyId);
        if (cancelled) return;
        if (translationSourceSurveyId) {
          const nextLanguage =
            translationLanguage ?? (loaded.language === "en" ? "am" : "en");
          builder.setHeaderField("language", nextLanguage);
        }
        setEditorMode("settings");
      } catch (error) {
        if (cancelled) return;
        sileo.error({
          title: "Could not open survey",
          description: error instanceof Error ? error.message : "Unexpected error",
        });
      } finally {
        if (!cancelled) setIsLoadingInitialSurvey(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // Keep this tied to routing inputs only; persistence/builder references are not stable
    // and can cause repeated reload loops that keep the loading shell open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSurveyId, translationSourceSurveyId, translationLanguage]);

  const handleCreateNew = () => {
    const fresh = createEmptySurvey();
    setInitialSurveyId(null);
    setIsLoadingInitialSurvey(false);
    builder.setState(fresh);
    persistence.setLastSyncedSnapshot(buildBuilderSnapshot(fresh));
    setSelectedSectionClientId(fresh.sections[0]?.clientId ?? null);
    setSelectedQuestionClientId(null);
    setEditorMode("settings");
    setIssues([]);
    setMultiFollowUpSelections({});
    setMultiFollowUpLogicTypeBySection({});
    initialDraftSnapshotRef.current = buildBuilderSnapshot(fresh);
  };

  const handleAddSection = () => {
    builder.addSection();
    setEditorMode("cards");
    if (isTranslationMode) {
      sileo.warning({
        title: "Section added",
        description:
          "Add a matching section in the source (original) survey if both language versions should stay aligned.",
      });
    } else {
      sileo.info({
        title: "Section added",
        description: "Name the section and add questions in the outline when ready.",
      });
    }
  };

  const handleAddQuestion = (sectionClientId: string) => {
    const nextId = builder.addQuestion(sectionClientId);
    setSelectedSectionClientId(sectionClientId);
    setSelectedQuestionClientId(nextId);
    setEditorMode("question");
    if (isTranslationMode) {
      sileo.warning({
        title: "New question added",
        description:
          "Add the same question to the source (original) survey so both versions stay in sync.",
      });
    } else {
      sileo.info({
        title: "New question added",
        description: "Set type, text, and options in the editor below.",
      });
    }
  };

  const handleSectionDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    persistence.setPendingReorder({
      kind: "section",
      activeSectionClientId: String(active.id),
      overSectionClientId: String(over.id),
    });
  };

  const handleQuestionDragEnd = (sectionClientId: string, { active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    persistence.setPendingReorder({
      kind: "question",
      sectionClientId,
      activeQuestionClientId: String(active.id),
      overQuestionClientId: String(over.id),
    });
  };

  const handleAddFollowUp = () => {
    if (!selectedSection || !selectedQuestion) return;
    const sectionQuestionIds = new Set(selectedSection.questions.map((q) => q.clientId));
    const directParentId =
      getQuestionParentId(selectedQuestion, sectionQuestionIds) ?? selectedQuestion.clientId;
    const directParent =
      allQuestions.find((q) => q.clientId === directParentId) ?? selectedQuestion;
    const nextId = builder.addQuestion(selectedSection.clientId);
    builder.updateQuestion(selectedSection.clientId, nextId, (q) => ({
      ...q,
      questionText: "",
      showConditions: [createFollowUpCondition(directParent)],
    }));
    setSelectedQuestionClientId(nextId);
    setEditorMode("question");
    if (isTranslationMode) {
      sileo.warning({
        title: "Follow-up question added",
        description:
          "Add the same follow-up in the source (original) survey so both versions stay in sync.",
      });
    } else {
      sileo.info({
        title: "Follow-up question added",
        description: "Linked to the parent above; adjust text and conditions as needed.",
      });
    }
  };

  const handleAddNestedFollowUp = () => {
    if (!selectedSection || !selectedQuestion) return;
    const sectionQuestionIds = new Set(selectedSection.questions.map((q) => q.clientId));
    const followUpDepth = getFollowUpDepth(selectedQuestion.clientId, questionByClientId, sectionQuestionIds);
    if (followUpDepth === 0) {
      sileo.warning({
        title: "Select a follow-up question",
        description: "Nested follow-up can only be added from a follow-up question.",
      });
      return;
    }
    if (followUpDepth >= 2) {
      sileo.info({ title: "Maximum nesting reached", description: "Only one nested follow-up level is allowed." });
      return;
    }
    const nextId = builder.addQuestion(selectedSection.clientId);
    builder.updateQuestion(selectedSection.clientId, nextId, (q) => ({
      ...q,
      questionText: "",
      showConditions: [createFollowUpCondition(selectedQuestion)],
    }));
    setSelectedQuestionClientId(nextId);
    setEditorMode("question");
    if (isTranslationMode) {
      sileo.warning({
        title: "Nested follow-up added",
        description:
          "Add the same nested follow-up in the source (original) survey so both versions stay in sync.",
      });
    } else {
      sileo.info({
        title: "Nested follow-up added",
        description: "One more level of follow-up; fill in the wording below.",
      });
    }
  };

  const handleAddCondition = () => {
    if (!selectedSection || !selectedQuestion) return;
    const sectionQuestionIds = new Set(selectedSection.questions.map((q) => q.clientId));
    const preferredParentId = getQuestionParentId(selectedQuestion, sectionQuestionIds);
    const fallbackParent =
      selectedSection.questions.find((q) => q.clientId === preferredParentId) ??
      selectedSection.questions.find((q) => q.clientId !== selectedQuestion.clientId);
    if (!fallbackParent) return;
    builder.addCondition(
      selectedSection.clientId,
      selectedQuestion.clientId,
      createFollowUpCondition(fallbackParent)
    );
  };

  const handleAddSectionSkipCondition = (
    sectionClientId: string,
    preferredParentQuestionClientId?: string
  ) => {
    const sectionIndex = builder.state.sections.findIndex((item) => item.clientId === sectionClientId);
    const section = sectionIndex >= 0 ? builder.state.sections[sectionIndex] : null;
    const parentCandidates =
      sectionIndex <= 0
        ? []
        : builder.state.sections
            .slice(0, sectionIndex)
            .flatMap((candidateSection) => candidateSection.questions);
    if (!section || parentCandidates.length === 0) {
      sileo.warning({
        title: "Add prior section questions first",
        description: "Section skip rules can reference questions from sections above this one.",
      });
      return;
    }
    const parentQuestion =
      parentCandidates.find(
        (candidate) => candidate.clientId === preferredParentQuestionClientId
      ) ?? parentCandidates[0];
    const condition: SectionSkipCondition = {
      parentQuestionClientId: parentQuestion.clientId,
      operator: parentQuestion.questionType === "NUMBER" ? "GREATER_THAN" : "EQUALS",
      optionClientId:
        parentQuestion.questionType === "SINGLE_CHOICE" ||
        parentQuestion.questionType === "MULTIPLE_CHOICE"
          ? parentQuestion.options[0]?.clientId
          : undefined,
      expectedValue:
        parentQuestion.questionType === "SINGLE_CHOICE" ||
        parentQuestion.questionType === "MULTIPLE_CHOICE"
          ? undefined
          : "",
      logicType: "AND",
    };

    builder.updateSection(sectionClientId, {
      skipConditions: [...section.skipConditions, condition],
    });
  };

  const handleUpdateSectionSkipCondition = (
    sectionClientId: string,
    conditionIndex: number,
    updater: (condition: SectionSkipCondition) => SectionSkipCondition
  ) => {
    const section = builder.state.sections.find((item) => item.clientId === sectionClientId);
    if (!section) return;
    builder.updateSection(sectionClientId, {
      skipConditions: section.skipConditions.map((condition, index) => {
        if (index !== conditionIndex) return condition;
        return updater(condition);
      }),
    });
  };

  const handleDeleteSectionSkipCondition = (sectionClientId: string, conditionIndex: number) => {
    const section = builder.state.sections.find((item) => item.clientId === sectionClientId);
    if (!section) return;
    builder.updateSection(sectionClientId, {
      skipConditions: section.skipConditions
        .filter((_, index) => index !== conditionIndex)
        .map((condition, index) =>
          index === 0 ? { ...condition, logicType: "AND" } : condition
        ),
    });
  };

  const handleToggleMultiFollowUpQuestion = (sectionClientId: string, questionClientId: string) => {
    setMultiFollowUpSelections((prev) => {
      const current = prev[sectionClientId] ?? [];
      const next = current.includes(questionClientId)
        ? current.filter((item) => item !== questionClientId)
        : [...current, questionClientId];
      return { ...prev, [sectionClientId]: next };
    });
  };

  const handleCreateMultiFollowUp = (sectionClientId: string) => {
    const section = builder.state.sections.find((item) => item.clientId === sectionClientId);
    if (!section) return;
    const selectedParentIds = multiFollowUpSelections[sectionClientId] ?? [];
    const parentQuestions = section.questions.filter((question) =>
      selectedParentIds.includes(question.clientId)
    );
    if (parentQuestions.length < 2) {
      sileo.warning({
        title: "Select more parent questions",
        description: "Choose at least two questions in the same section.",
      });
      return;
    }
    const logicType = multiFollowUpLogicTypeBySection[sectionClientId] ?? "AND";
    const nextId = builder.addQuestion(sectionClientId);
    builder.updateQuestion(sectionClientId, nextId, (question) => ({
      ...question,
      questionText: "",
      showConditions: parentQuestions.map((parentQuestion) => ({
        ...createFollowUpCondition(parentQuestion),
        logicType,
      })),
    }));
    setMultiFollowUpSelections((prev) => ({ ...prev, [sectionClientId]: [] }));
    setSelectedSectionClientId(sectionClientId);
    setSelectedQuestionClientId(nextId);
    setEditorMode("question");
    if (isTranslationMode) {
      sileo.warning({
        title: "Multi-parent follow-up added",
        description:
          "Add the same follow-up in the source (original) survey so both versions stay in sync.",
      });
    } else {
      sileo.info({
        title: "Multi-parent follow-up added",
        description: "This question shows when the selected parent conditions are met.",
      });
    }
  };

  const handleExportSurveyDetail = useCallback(async () => {
    if (!initialSurveyId) return;
    setExportDetailPending(true);
    try {
      const { data } = await exportSurveyById(initialSurveyId);
      const labels: SurveyDetailCsvLabels = {
        sectionOverview: tDetail("sectionOverview"),
        sectionQuestions: tDetail("sectionQuestions"),
        colField: tDetail("colField"),
        colValue: tDetail("colValue"),
        lblTitle: tDetail("lblTitle"),
        lblDescription: tDetail("lblDescription"),
        lblTargetType: tDetail("lblTargetType"),
        lblStatus: tDetail("lblStatus"),
        lblVersion: tDetail("lblVersion"),
        lblLanguage: tDetail("lblLanguage"),
        lblCreatedAt: tDetail("lblCreatedAt"),
        lblUpdatedAt: tDetail("lblUpdatedAt"),
        colSectionTitle: tDetail("colSectionTitle"),
        colSectionOrder: tDetail("colSectionOrder"),
        colQuestionOrder: tDetail("colQuestionOrder"),
        colQuestionText: tDetail("colQuestionText"),
        colQuestionType: tDetail("colQuestionType"),
        colRequired: tDetail("colRequired"),
        colEnabled: tDetail("colEnabled"),
        colOptions: tDetail("colOptions"),
        colConfiguration: tDetail("colConfiguration"),
        colConditions: tDetail("colConditions"),
      };
      const csv = buildSurveyDetailExportCsv(data, labels, tCommonBase("yes"), tCommonBase("no"));
      const titleFromExport = typeof data.title === "string" ? data.title : null;
      const nameSlug =
        slugifyForFilename(titleFromExport) || slugifyForFilename(builder.state.title) || "survey";
      downloadBaseDataCsv(csv, exportFilename(`survey-${nameSlug}`));
      sileo.success({
        title: tExport("detailSuccessTitle"),
        description: tExport("detailSuccessDescription"),
      });
    } catch (error) {
      sileo.error({
        title: tExport("errorTitle"),
        description: error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    } finally {
      setExportDetailPending(false);
    }
  }, [initialSurveyId, builder.state.title, tDetail, tCommonBase, tExport, tValidation]);

  if (initialSurveyId && isLoadingInitialSurvey) {
    return <SurveyBuilderLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <BuilderHeader
        initialSurveyId={initialSurveyId}
        isTranslationMode={isTranslationMode}
        totalQuestionCount={totalQuestionCount}
        isCreatingSurvey={persistence.isCreatingSurvey}
        isSavingAllChanges={persistence.isSavingAllChanges}
        saveAllEligibility={persistence.saveAllEligibility}
        onCreateNew={handleCreateNew}
        onSaveSurvey={() => void persistence.handleSaveSurvey()}
        onSaveAllChanges={() => void persistence.handleSaveAllChanges()}
        onExportDetail={initialSurveyId ? handleExportSurveyDetail : undefined}
        exportDetailPending={exportDetailPending}
        exportDetailLabel={tExport("button")}
        exportDetailPendingLabel={tExport("exporting")}
      />

      <div className="flex h-[calc(100vh-56px)]">
        <BuilderNavigator
          builder={builder}
          initialSurveyId={initialSurveyId}
          isTranslationMode={isTranslationMode}
          editorMode={editorMode}
          selectedSection={selectedSection}
          selectedQuestionClientId={selectedQuestionClientId}
          savingSectionClientId={persistence.savingSectionClientId}
          isSavingAllChanges={persistence.isSavingAllChanges}
          isLoadingInitialSurvey={isLoadingInitialSurvey}
          totalQuestionCount={totalQuestionCount}
          lastMovedSectionClientId={lastMovedSectionClientId}
          lastMovedQuestionClientId={lastMovedQuestionClientId}
          onSelectSettings={() => setEditorMode("settings")}
          onSelectSection={(id) => { setSelectedSectionClientId(id); setEditorMode("cards"); }}
          onSelectQuestion={(sectionId, questionId) => {
            setSelectedSectionClientId(sectionId);
            setSelectedQuestionClientId(questionId);
            setEditorMode("question");
          }}
          onSaveSection={(id) => void persistence.saveSection(id)}
          onAddSection={handleAddSection}
          onAddQuestion={handleAddQuestion}
          onPendingDelete={persistence.setPendingDelete}
          onSectionDragEnd={handleSectionDragEnd}
          onQuestionDragEnd={handleQuestionDragEnd}
          multiFollowUpSelections={multiFollowUpSelections}
          multiFollowUpLogicTypeBySection={multiFollowUpLogicTypeBySection}
          onMultiFollowUpLogicTypeChange={(sectionClientId, logicType) =>
            setMultiFollowUpLogicTypeBySection((prev) => ({
              ...prev,
              [sectionClientId]: logicType,
            }))
          }
          onToggleMultiFollowUpQuestion={handleToggleMultiFollowUpQuestion}
          onCreateMultiFollowUp={handleCreateMultiFollowUp}
        />

        <SurveyBuilderMainPanel
          editorMode={editorMode}
          initialSurveyId={initialSurveyId}
          isTranslationMode={isTranslationMode}
          sections={builder.state.sections}
          selectedSection={selectedSection}
          selectedQuestion={selectedQuestion}
          questionByClientId={questionByClientId}
          dependentsMap={dependentsMap}
          issues={issues}
          isSavingAllChanges={persistence.isSavingAllChanges}
          savingQuestionClientId={persistence.savingQuestionClientId}
          savingSectionClientId={persistence.savingSectionClientId}
          onSelectCardsMode={() => setEditorMode("cards")}
          onDoneDraftQuestion={() => {
            setSelectedQuestionClientId(null);
            setEditorMode("cards");
          }}
          onSelectQuestion={(questionClientId) => {
            setSelectedQuestionClientId(questionClientId);
            setEditorMode("question");
          }}
          onRequestDeleteQuestion={(sectionClientId, questionClientId, questionText) => {
            persistence.setPendingDelete({
              kind: "question",
              sectionClientId,
              questionClientId,
              questionText,
            });
          }}
          onUpdateSurveyHeader={builder.setHeaderField}
          onSaveSurvey={persistence.handleSaveSurvey}
          onSaveQuestion={persistence.saveQuestion}
          onUpdateQuestion={builder.updateQuestion}
          onSetQuestionType={builder.setQuestionType}
          onAddOption={builder.addOption}
          onUpdateOption={builder.updateOption}
          onDeleteOption={builder.deleteOption}
          onSetQuestionConfig={builder.setQuestionConfig}
          onAddFollowUpQuestion={handleAddFollowUp}
          onAddNestedFollowUpQuestion={handleAddNestedFollowUp}
          onAddCondition={handleAddCondition}
          onUpdateCondition={builder.updateCondition}
          onDeleteCondition={builder.deleteCondition}
          onAddSectionSkipCondition={handleAddSectionSkipCondition}
          onUpdateSectionSkipCondition={handleUpdateSectionSkipCondition}
          onDeleteSectionSkipCondition={handleDeleteSectionSkipCondition}
          surveyTitle={builder.state.title}
          surveyDescription={builder.state.description}
          surveyTargetType={builder.state.targetType}
          surveyLanguage={builder.state.language}
        />

        <section className="w-[360px] shrink-0 overflow-y-auto p-4">
          <SurveyPreviewPanel
            question={selectedQuestion}
            questionByClientId={questionByClientId}
            sectionQuestions={selectedSection?.questions ?? undefined}
          />
        </section>
      </div>

      <BuilderDialogs
        pendingDelete={persistence.pendingDelete}
        onDeleteOpenChange={(open) => { if (!open) persistence.setPendingDelete(null); }}
        onDeleteConfirm={() => void persistence.confirmDelete()}
        pendingReorder={persistence.pendingReorder}
        isSavingReorder={persistence.isSavingReorder}
        onReorderOpenChange={(open) => { if (!open) persistence.setPendingReorder(null); }}
        onReorderConfirm={() => void persistence.confirmReorder()}
      />
      <AlertDialog open={leaveGuard.isLeaveDialogOpen} onOpenChange={leaveGuard.setIsLeaveDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved survey updates. If you leave now, your recent edits will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={leaveGuard.handleStayOnPage}>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={leaveGuard.handleConfirmLeave}>Leave page</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
