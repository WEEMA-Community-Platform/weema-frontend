"use client";

import { useEffect, useMemo, useState } from "react";
import { type DragEndEvent } from "@dnd-kit/core";
import { sileo } from "sileo";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSurveyBuilder } from "@/hooks/use-survey-builder";
import type { SurveyValidationIssue } from "@/lib/survey-builder/types";
import { createEmptySurvey, isChoiceType } from "@/lib/survey-builder/utils";
import { SurveyPreviewPanel } from "@/components/survey/survey-preview-panel";
import { SurveySettingsForm } from "@/components/survey/survey-settings-form";
import { QuestionCardsBoard } from "@/components/survey/builder/question-cards-board";
import { QuestionEditor } from "@/components/survey/builder/question-editor";
import { BuilderDialogs } from "@/components/survey/builder/builder-dialogs";
import { BuilderHeader } from "@/components/survey/builder/builder-header";
import { BuilderNavigator } from "@/components/survey/builder/builder-navigator";
import { useBuilderPersistence } from "@/components/survey/builder/use-builder-persistence";
import {
  buildBuilderSnapshot,
  createFollowUpCondition,
  getFollowUpDepth,
  getQuestionParentId,
  type EditorMode,
  type SurveyQuestionWithContext,
} from "@/components/survey/builder/shared";

export function SurveyBuilderPage({ initialSurveyId: routeSurveyId }: { initialSurveyId?: string | null }) {
  const [initialSurveyId, setInitialSurveyId] = useState<string | null>(routeSurveyId ?? null);
  const [isLoadingInitialSurvey, setIsLoadingInitialSurvey] = useState(Boolean(routeSurveyId));
  const [editorMode, setEditorMode] = useState<EditorMode>("settings");
  const [selectedSectionClientId, setSelectedSectionClientId] = useState<string | null>(null);
  const [selectedQuestionClientId, setSelectedQuestionClientId] = useState<string | null>(null);
  const [issues, setIssues] = useState<SurveyValidationIssue[]>([]);
  const [lastMovedSectionClientId, setLastMovedSectionClientId] = useState<string | null>(null);
  const [lastMovedQuestionClientId, setLastMovedQuestionClientId] = useState<string | null>(null);

  const builder = useSurveyBuilder(createEmptySurvey());

  // ─── Derived lookups ──────────────────────────────────────────────────────

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
  const selectedQuestion =
    selectedSection?.questions.find((q) => q.clientId === selectedQuestionClientId) ?? null;

  // ─── Persistence hook ─────────────────────────────────────────────────────

  const persistence = useBuilderPersistence({
    initialSurveyId,
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

  // ─── Animation clear effects ──────────────────────────────────────────────

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

  // ─── Initial survey load ──────────────────────────────────────────────────

  useEffect(() => {
    if (!routeSurveyId) {
      setInitialSurveyId(null);
      setIsLoadingInitialSurvey(false);
      return;
    }
    const load = async () => {
      try {
        setInitialSurveyId(routeSurveyId);
        setIsLoadingInitialSurvey(true);
        await persistence.reloadSurvey(routeSurveyId);
        setEditorMode("settings");
      } catch (error) {
        sileo.error({
          title: "Could not open survey",
          description: error instanceof Error ? error.message : "Unexpected error",
        });
      } finally {
        setIsLoadingInitialSurvey(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSurveyId]);

  // ─── Navigation handlers ──────────────────────────────────────────────────

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
  };

  const handleAddSection = () => {
    builder.addSection();
    setEditorMode("cards");
  };

  const handleAddQuestion = (sectionClientId: string) => {
    builder.addQuestion(sectionClientId);
    setSelectedSectionClientId(sectionClientId);
    setEditorMode("cards");
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

  // ─── Follow-up helpers ────────────────────────────────────────────────────

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
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (initialSurveyId && isLoadingInitialSurvey) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex h-14 items-center justify-between border-b border-primary/10 px-4">
          <Skeleton className="h-9 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </header>
        <div className="flex h-[calc(100vh-56px)]">
          <aside className="w-[320px] shrink-0 border-r border-primary/10 bg-card/30 p-4">
            <Skeleton className="h-8 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`skeleton-section-${i}`} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </aside>
          <main className="min-w-0 flex-1 border-r border-primary/10 p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-3 h-4 w-72" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`skeleton-card-${i}`} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </main>
          <section className="w-[360px] shrink-0 p-4">
            <Skeleton className="h-full min-h-56 w-full rounded-xl" />
          </section>
        </div>
      </div>
    );
  }

  // ─── Builder layout ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <BuilderHeader
        initialSurveyId={initialSurveyId}
        totalQuestionCount={totalQuestionCount}
        isCreatingSurvey={persistence.isCreatingSurvey}
        isSavingAllChanges={persistence.isSavingAllChanges}
        saveAllEligibility={persistence.saveAllEligibility}
        onCreateNew={handleCreateNew}
        onSaveSurvey={() => void persistence.handleSaveSurvey()}
        onSaveAllChanges={() => void persistence.handleSaveAllChanges()}
      />

      <div className="flex h-[calc(100vh-56px)]">
        <BuilderNavigator
          builder={builder}
          initialSurveyId={initialSurveyId}
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
        />

        <main className="min-w-0 flex-1 overflow-y-auto border-r border-primary/10 p-6">
          {editorMode === "settings" ? (
            <Card className="border-primary/15">
              <CardHeader>
                <CardTitle>Survey settings</CardTitle>
              </CardHeader>
              <CardContent>
                <SurveySettingsForm
                  title={builder.state.title}
                  description={builder.state.description}
                  targetType={builder.state.targetType}
                  onTitleChange={(v) => builder.setHeaderField("title", v)}
                  onDescriptionChange={(v) => builder.setHeaderField("description", v)}
                  onTargetTypeChange={(v) => builder.setHeaderField("targetType", v)}
                  showSaveAction={Boolean(initialSurveyId)}
                  onSave={() => void persistence.handleSaveSurvey()}
                  isSaving={false}
                  isSaveDisabled={persistence.isSavingAllChanges}
                />
              </CardContent>
            </Card>
          ) : editorMode === "cards" ? (
            <QuestionCardsBoard
              section={selectedSection}
              questionByClientId={questionByClientId}
              dependentsMap={dependentsMap}
              onOpen={(questionClientId) => {
                setSelectedQuestionClientId(questionClientId);
                setEditorMode("question");
              }}
              onDelete={(questionClientId) => {
                if (!selectedSection) return;
                const q = selectedSection.questions.find((q) => q.clientId === questionClientId);
                persistence.setPendingDelete({
                  kind: "question",
                  sectionClientId: selectedSection.clientId,
                  questionClientId,
                  questionText: q?.questionText || "Untitled question",
                });
              }}
            />
          ) : selectedSection && selectedQuestion ? (
            <QuestionEditor
              question={selectedQuestion}
              allQuestions={allQuestions}
              section={selectedSection}
              questionByClientId={questionByClientId}
              dependentsMap={dependentsMap}
              onBackToCards={() => setEditorMode("cards")}
              backToCardsLabel={initialSurveyId ? "Back to cards" : "Back to questions"}
              onPrimaryAction={() => {
                if (!initialSurveyId) {
                  setSelectedQuestionClientId(null);
                  setEditorMode("cards");
                  return;
                }
                void persistence.saveQuestion(selectedSection.clientId, selectedQuestion.clientId);
              }}
              primaryActionLabel={
                initialSurveyId
                  ? selectedSection.id
                    ? "Save question"
                    : "Save section & question"
                  : "Done"
              }
              primaryActionVariant={initialSurveyId ? "default" : "outline"}
              isPrimaryActionPending={
                initialSurveyId
                  ? persistence.savingQuestionClientId === selectedQuestion.clientId ||
                    persistence.savingSectionClientId === selectedSection.clientId ||
                    persistence.isSavingAllChanges
                  : false
              }
              isPrimaryActionDisabled={initialSurveyId ? persistence.isSavingAllChanges : false}
              onUpdate={(patch) =>
                builder.updateQuestion(selectedSection.clientId, selectedQuestion.clientId, (prev) => ({
                  ...prev,
                  ...patch,
                }))
              }
              onTypeChange={(nextType) =>
                builder.setQuestionType(selectedSection.clientId, selectedQuestion.clientId, nextType)
              }
              onDelete={() =>
                persistence.setPendingDelete({
                  kind: "question",
                  sectionClientId: selectedSection.clientId,
                  questionClientId: selectedQuestion.clientId,
                  questionText: selectedQuestion.questionText || "Untitled question",
                })
              }
              onAddOption={() => builder.addOption(selectedSection.clientId, selectedQuestion.clientId)}
              onUpdateOption={(optionClientId, patch) =>
                builder.updateOption(selectedSection.clientId, selectedQuestion.clientId, optionClientId, patch)
              }
              onDeleteOption={(optionClientId) =>
                builder.deleteOption(selectedSection.clientId, selectedQuestion.clientId, optionClientId)
              }
              onQuestionConfigChange={(config) =>
                builder.setQuestionConfig(selectedSection.clientId, selectedQuestion.clientId, config)
              }
              onAddFollowUpQuestion={handleAddFollowUp}
              onAddNestedFollowUpQuestion={handleAddNestedFollowUp}
              onUpdateCondition={(idx, updater) =>
                builder.updateCondition(selectedSection.clientId, selectedQuestion.clientId, idx, updater)
              }
              onDeleteCondition={(idx) =>
                builder.deleteCondition(selectedSection.clientId, selectedQuestion.clientId, idx)
              }
            />
          ) : null}

          {issues.length > 0 ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <p className="font-medium">Resolve these issues before saving:</p>
              <ul className="mt-1 list-disc pl-5">
                {issues.slice(0, 8).map((issue) => (
                  <li key={`${issue.path}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </main>

        <section className="w-[360px] shrink-0 overflow-y-auto p-4">
          <SurveyPreviewPanel question={selectedQuestion} />
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
    </div>
  );
}
