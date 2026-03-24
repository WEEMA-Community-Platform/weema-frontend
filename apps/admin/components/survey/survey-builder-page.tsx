"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  GripVerticalIcon,
  PlusIcon,
  SaveIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react";
import { sileo } from "sileo";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/lib/api/surveys";
import {
  normalizeSurveyResponse,
  serializeSurveyPayload,
  validateSurveyBuilderState,
} from "@/lib/survey-builder/normalize";
import type {
  ShowCondition,
  SurveyQuestion,
  SurveyValidationIssue,
} from "@/lib/survey-builder/types";
import { createEmptySurvey, isChoiceType } from "@/lib/survey-builder/utils";
import { SurveyPreviewPanel } from "@/components/survey/survey-preview-panel";
import { SurveySettingsForm } from "@/components/survey/survey-settings-form";
import { QuestionCardsBoard } from "@/components/survey/builder/question-cards-board";
import { QuestionEditor } from "@/components/survey/builder/question-editor";
import {
  getQuestionParentId,
  type SurveyQuestionWithContext,
} from "@/components/survey/builder/shared";

type EditorMode = "settings" | "cards" | "question";
type PendingReorder =
  | {
      kind: "section";
      activeSectionClientId: string;
      overSectionClientId: string;
    }
  | {
      kind: "question";
      sectionClientId: string;
      activeQuestionClientId: string;
      overQuestionClientId: string;
    };
type PendingDelete =
  | { kind: "section"; sectionClientId: string; title: string }
  | {
      kind: "question";
      sectionClientId: string;
      questionClientId: string;
      questionText: string;
    };
type SortableListeners = ReturnType<typeof useSortable>["listeners"];
type SortableAttributes = ReturnType<typeof useSortable>["attributes"];

function SortableSectionItem({
  id,
  className,
  onClick,
  children,
}: {
  id: string;
  className: string;
  onClick: () => void;
  children: (args: {
    dragHandleListeners: SortableListeners;
    dragHandleAttributes: SortableAttributes;
    isDragging: boolean;
    isOver: boolean;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={className}
      onClick={onClick}
    >
      {children({
        dragHandleListeners: listeners,
        dragHandleAttributes: attributes,
        isDragging,
        isOver,
      })}
    </div>
  );
}

function SortableQuestionRow({
  id,
  className,
  style,
  onClick,
  children,
}: {
  id: string;
  className: string;
  style?: React.CSSProperties;
  onClick: () => void;
  children: (args: {
    dragHandleListeners: SortableListeners;
    dragHandleAttributes: SortableAttributes;
    isDragging: boolean;
    isOver: boolean;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={className}
      onClick={onClick}
    >
      {children({
        dragHandleListeners: listeners,
        dragHandleAttributes: attributes,
        isDragging,
        isOver,
      })}
    </div>
  );
}

export function SurveyBuilderPage({ initialSurveyId }: { initialSurveyId?: string | null }) {
  const [isLoadingInitialSurvey, setIsLoadingInitialSurvey] = useState(Boolean(initialSurveyId));
  const [editorMode, setEditorMode] = useState<EditorMode>("cards");
  const [selectedSectionClientId, setSelectedSectionClientId] = useState<string | null>(null);
  const [selectedQuestionClientId, setSelectedQuestionClientId] = useState<string | null>(null);
  const [issues, setIssues] = useState<SurveyValidationIssue[]>([]);
  const [lastMovedSectionClientId, setLastMovedSectionClientId] = useState<string | null>(null);
  const [lastMovedQuestionClientId, setLastMovedQuestionClientId] = useState<string | null>(null);
  const [pendingReorder, setPendingReorder] = useState<PendingReorder | null>(null);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const queryClient = useQueryClient();
  const builder = useSurveyBuilder(createEmptySurvey());
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

  const allQuestions = useMemo<SurveyQuestionWithContext[]>(
    () =>
      builder.state.sections.flatMap((section) =>
        section.questions.map((question) => ({
          ...question,
          sectionClientId: section.clientId,
          sectionTitle: section.title || "Untitled section",
        }))
      ),
    [builder.state.sections]
  );

  const questionByClientId = useMemo(() => {
    return new Map(allQuestions.map((question) => [question.clientId, question]));
  }, [allQuestions]);
  const questionIdByClientId = useMemo(() => {
    return new Map(
      allQuestions
        .filter((question) => Boolean(question.id))
        .map((question) => [question.clientId, question.id as string])
    );
  }, [allQuestions]);
  const optionIdByClientId = useMemo(() => {
    const entries: Array<[string, string]> = [];
    for (const question of allQuestions) {
      for (const option of question.options) {
        if (option.id) {
          entries.push([option.clientId, option.id]);
        }
      }
    }
    return new Map(entries);
  }, [allQuestions]);

  const dependentsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const question of allQuestions) {
      for (const condition of question.showConditions) {
        const current = map.get(condition.parentQuestionClientId) ?? [];
        map.set(condition.parentQuestionClientId, [...current, question.clientId]);
      }
    }
    return map;
  }, [allQuestions]);

  const selectedSection =
    builder.state.sections.find((item) => item.clientId === selectedSectionClientId) ??
    builder.state.sections[0] ??
    null;
  const selectedQuestion =
    selectedSection?.questions.find((item) => item.clientId === selectedQuestionClientId) ?? null;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const reloadSurvey = async (surveyId: string) => {
    const detail = await queryClient.fetchQuery({
      queryKey: ["survey", surveyId],
      queryFn: () => getSurveyById(surveyId),
    });
    const normalized = normalizeSurveyResponse(detail.survey);
    builder.setState(normalized);
    setSelectedSectionClientId((prev) =>
      normalized.sections.some((section) => section.clientId === prev)
        ? prev
        : (normalized.sections[0]?.clientId ?? null)
    );
    setSelectedQuestionClientId((prev) =>
      normalized.sections.some((section) =>
        section.questions.some((question) => question.clientId === prev)
      )
        ? prev
        : null
    );
    setIssues([]);
    return normalized;
  };

  useEffect(() => {
    if (!initialSurveyId) {
      handleCreateNew();
      return;
    }

    const loadInitialSurvey = async () => {
      try {
        setIsLoadingInitialSurvey(true);
        await reloadSurvey(initialSurveyId);
        setEditorMode("cards");
      } catch (error) {
        sileo.error({
          title: "Could not open survey",
          description: error instanceof Error ? error.message : "Unexpected error",
        });
      } finally {
        setIsLoadingInitialSurvey(false);
      }
    };

    void loadInitialSurvey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSurveyId]);

  useEffect(() => {
    if (!lastMovedSectionClientId) return;
    const timeout = window.setTimeout(() => setLastMovedSectionClientId(null), 320);
    return () => window.clearTimeout(timeout);
  }, [lastMovedSectionClientId]);

  useEffect(() => {
    if (!lastMovedQuestionClientId) return;
    const timeout = window.setTimeout(() => setLastMovedQuestionClientId(null), 320);
    return () => window.clearTimeout(timeout);
  }, [lastMovedQuestionClientId]);

  const handleCreateNew = () => {
    const fresh = createEmptySurvey();
    builder.setState(fresh);
    setSelectedSectionClientId(fresh.sections[0]?.clientId ?? null);
    setSelectedQuestionClientId(null);
    setEditorMode("cards");
    setIssues([]);
  };

  const handleSaveSurvey = async () => {
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
        const result = await createSurveyMutation.mutateAsync(
          serializeSurveyPayload(builder.state)
        );
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

  const persistSectionMeta = async (sectionClientId: string, options?: { quiet?: boolean }) => {
    if (!initialSurveyId) return;
    const section = builder.state.sections.find((item) => item.clientId === sectionClientId);
    if (!section?.id) return;
    setSavingSectionClientId(sectionClientId);
    try {
      const result = await updateSectionMutation.mutateAsync({
        id: section.id,
        payload: {
          title: section.title.trim(),
          description: section.description.trim(),
        },
      });
      if (!options?.quiet) {
        sileo.success({
          title: "Section saved",
          description: result.message ?? "Section has been updated.",
        });
      }
    } catch (error) {
      sileo.error({
        title: "Failed to save section",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setSavingSectionClientId(null);
    }
  };

  const handleAddSection = async () => {
    if (!initialSurveyId) {
      builder.addSection();
      return;
    }

    const defaultTitle = `Section ${builder.state.sections.length + 1}`;
    try {
      const result = await createSectionsMutation.mutateAsync({
        surveyId: initialSurveyId,
        payload: [
          {
            title: defaultTitle,
            description: "",
            questions: [],
          },
        ],
      });
      sileo.success({
        title: "Section created",
        description: result.message ?? "Section has been added.",
      });
      const normalized = await reloadSurvey(initialSurveyId);
      const newestSection = normalized.sections[normalized.sections.length - 1];
      if (newestSection) {
        setSelectedSectionClientId(newestSection.clientId);
      }
      setEditorMode("cards");
    } catch (error) {
      sileo.error({
        title: "Failed to add section",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const saveQuestion = async (sectionClientId: string, questionClientId: string) => {
    const section = builder.state.sections.find((item) => item.clientId === sectionClientId);
    const question = section?.questions.find((item) => item.clientId === questionClientId);
    if (!section || !question) return;
    if (!initialSurveyId) {
      sileo.info({
        title: "Create survey first",
        description: "Questions can be synced after the survey is created.",
      });
      return;
    }
    if (!section.id && !question.id) {
      sileo.warning({
        title: "Save section first",
        description: "This section is not synced yet. Save the section before saving questions.",
      });
      return;
    }
    setSavingQuestionClientId(questionClientId);
    try {
      if (question.id) {
        const result = await updateQuestionMutation.mutateAsync({
          id: question.id,
          payload: serializeQuestionPayload(question, {
            questionIdByClientId,
            optionIdByClientId,
          }),
        });
        sileo.success({
          title: "Question saved",
          description: result.message ?? "Question has been updated.",
        });
      } else if (section.id) {
        const result = await createQuestionMutation.mutateAsync({
          sectionId: section.id,
          payload: [
            serializeQuestionPayload(question, {
              questionIdByClientId,
              optionIdByClientId,
            }),
          ],
        });
        sileo.success({
          title: "Question created",
          description: result.message ?? "Question has been added.",
        });
      }
      await reloadSurvey(initialSurveyId);
      setSelectedQuestionClientId(null);
      setEditorMode("cards");
    } catch (error) {
      sileo.error({
        title: "Failed to save question",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setSavingQuestionClientId(null);
    }
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPendingReorder({
      kind: "section",
      activeSectionClientId: String(active.id),
      overSectionClientId: String(over.id),
    });
  };

  const handleQuestionDragEnd = (sectionClientId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPendingReorder({
      kind: "question",
      sectionClientId,
      activeQuestionClientId: String(active.id),
      overQuestionClientId: String(over.id),
    });
  };

  const confirmReorder = async () => {
    if (!pendingReorder) return;
    setIsSavingReorder(true);
    try {
      if (pendingReorder.kind === "section") {
        const fromIndex = builder.state.sections.findIndex(
          (item) => item.clientId === pendingReorder.activeSectionClientId
        );
        const toIndex = builder.state.sections.findIndex(
          (item) => item.clientId === pendingReorder.overSectionClientId
        );
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          setPendingReorder(null);
          return;
        }

        const movedSection = builder.state.sections[fromIndex];
        builder.moveSection(fromIndex, toIndex);
        setLastMovedSectionClientId(movedSection?.clientId ?? null);

        const sectionIds = builder.state.sections
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id));

        if (
          initialSurveyId &&
          sectionIds.length === builder.state.sections.length &&
          sectionIds.length > 1
        ) {
          const reorderedSections = [...builder.state.sections];
          const [moved] = reorderedSections.splice(fromIndex, 1);
          reorderedSections.splice(toIndex, 0, moved);
          const reorderedIds = reorderedSections
            .map((section) => section.id)
            .filter((id): id is string => Boolean(id));
          const result = await reorderSectionsMutation.mutateAsync(reorderedIds);
          sileo.success({
            title: "Section order updated",
            description: result.message ?? "Section order has been saved.",
          });
          await reloadSurvey(initialSurveyId);
        } else {
          sileo.info({
            title: "Section order updated locally",
            description: "Only synced sections can be reordered on the backend.",
          });
        }
      } else {
        const section = builder.state.sections.find(
          (item) => item.clientId === pendingReorder.sectionClientId
        );
        const fromIndex =
          section?.questions.findIndex(
            (item) => item.clientId === pendingReorder.activeQuestionClientId
          ) ?? -1;
        const toIndex =
          section?.questions.findIndex(
            (item) => item.clientId === pendingReorder.overQuestionClientId
          ) ?? -1;
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          setPendingReorder(null);
          return;
        }

        const movedQuestion = section?.questions[fromIndex];
        builder.reorderQuestions(
          pendingReorder.sectionClientId,
          fromIndex,
          toIndex
        );
        setLastMovedQuestionClientId(movedQuestion?.clientId ?? null);

        const questions = section?.questions ?? [];
        const questionIds = questions
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id));
        if (
          initialSurveyId &&
          section?.id &&
          questionIds.length === questions.length &&
          questionIds.length > 1
        ) {
          const reorderedQuestions = [...questions];
          const [moved] = reorderedQuestions.splice(fromIndex, 1);
          reorderedQuestions.splice(toIndex, 0, moved);
          const reorderedIds = reorderedQuestions
            .map((question) => question.id)
            .filter((id): id is string => Boolean(id));
          const result = await reorderQuestionsMutation.mutateAsync(reorderedIds);
          sileo.success({
            title: "Question order updated",
            description: result.message ?? "Question order has been saved.",
          });
          await reloadSurvey(initialSurveyId);
        } else {
          sileo.info({
            title: "Question order updated locally",
            description:
              "Only synced questions can be reordered on the backend.",
          });
        }
      }
    } catch (error) {
      sileo.error({
        title: "Failed to reorder",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setIsSavingReorder(false);
    }
    setPendingReorder(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === "section") {
        const section = builder.state.sections.find(
          (item) => item.clientId === pendingDelete.sectionClientId
        );
        if (section?.id) {
          const result = await deleteSectionMutation.mutateAsync(section.id);
          sileo.success({
            title: "Section deleted",
            description: result.message ?? "Section has been removed.",
          });
          if (initialSurveyId) {
            await reloadSurvey(initialSurveyId);
          }
        } else {
          builder.deleteSection(pendingDelete.sectionClientId);
          sileo.success({
            title: "Section deleted",
            description: "Unsynced section has been removed locally.",
          });
        }
        if (selectedSectionClientId === pendingDelete.sectionClientId) {
          setSelectedQuestionClientId(null);
          setEditorMode("cards");
        }
      } else {
        const section = builder.state.sections.find(
          (item) => item.clientId === pendingDelete.sectionClientId
        );
        const question = section?.questions.find(
          (item) => item.clientId === pendingDelete.questionClientId
        );
        if (question?.id) {
          const result = await deleteQuestionMutation.mutateAsync(question.id);
          sileo.success({
            title: "Question deleted",
            description: result.message ?? "Question has been removed.",
          });
          if (initialSurveyId) {
            await reloadSurvey(initialSurveyId);
          }
        } else {
          builder.deleteQuestion(pendingDelete.sectionClientId, pendingDelete.questionClientId);
          sileo.success({
            title: "Question deleted",
            description: "Unsynced question has been removed locally.",
          });
        }
        if (selectedQuestionClientId === pendingDelete.questionClientId) {
          setSelectedQuestionClientId(null);
          setEditorMode("cards");
        }
      }
    } catch (error) {
      sileo.error({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
    setPendingDelete(null);
  };

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
        <div className="flex min-h-[calc(100vh-56px)]">
          <aside className="w-[320px] shrink-0 border-r border-primary/10 bg-card/30 p-4">
            <Skeleton className="h-8 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={`builder-loading-section-${index}`} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </aside>
          <main className="min-w-0 flex-1 border-r border-primary/10 p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-3 h-4 w-72" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={`builder-loading-card-${index}`} className="h-24 w-full rounded-xl" />
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

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-primary/10 px-4">
        <Button type="button" variant="ghost" render={<Link href="/survey" />}>
          <ArrowLeftIcon className="size-4" />
          Back to surveys
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleCreateNew}>
            <PlusIcon className="size-4" />
            New survey
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSaveSurvey}
            disabled={createSurveyMutation.isPending || updateSurveyMutation.isPending}
          >
            <SaveIcon className="size-4" />
            {!initialSurveyId
              ? createSurveyMutation.isPending
                ? "Creating..."
                : "Create survey"
              : updateSurveyMutation.isPending
                ? "Saving settings..."
                : "Save settings"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="w-[320px] shrink-0 border-r border-primary/10 bg-card/30 p-4">
          {isLoadingInitialSurvey ? (
            <p className="mb-3 text-xs text-muted-foreground">Loading survey...</p>
          ) : null}

          <div className="mt-4 space-y-2">
            <button
              type="button"
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm ${
                editorMode === "settings" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
              }`}
              onClick={() => setEditorMode("settings")}
            >
              <Settings2Icon className="size-4" />
              Survey settings
            </button>
          </div>

          <div className="mt-3 overflow-auto pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={builder.state.sections.map((section) => section.clientId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {builder.state.sections.map((section, sectionIndex) => (
                    <SortableSectionItem
                      key={section.clientId}
                      id={section.clientId}
                      className={`cursor-pointer rounded-xl border transition-all duration-200 ${
                        selectedSection?.clientId === section.clientId
                          ? "border-orange-400 bg-orange-500/10 dark:border-orange-400/70 dark:bg-orange-500/12"
                          : "border-primary/15 hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/60 dark:hover:bg-orange-500/10"
                      } ${
                        lastMovedSectionClientId === section.clientId
                          ? "animate-in slide-in-from-top-1 fade-in duration-200"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedSectionClientId(section.clientId);
                        if (editorMode !== "settings") setEditorMode("cards");
                      }}
                    >
                      {({ dragHandleListeners, dragHandleAttributes, isDragging, isOver }) => (
                        <>
                          <div className="space-y-2 p-3 pb-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className={`rounded p-1 text-muted-foreground transition-colors hover:text-foreground ${
                                  isDragging ? "cursor-grabbing" : "cursor-grab"
                                } ${isOver ? "text-primary" : ""}`}
                                onClick={(event) => event.stopPropagation()}
                                {...dragHandleAttributes}
                                {...dragHandleListeners}
                              >
                                <GripVerticalIcon className="size-4" />
                              </button>
                              <Input
                                value={section.title}
                                onChange={(event) =>
                                  builder.updateSection(section.clientId, { title: event.target.value })
                                }
                                onBlur={() => void persistSectionMeta(section.clientId, { quiet: true })}
                                onClick={(event) => event.stopPropagation()}
                                placeholder={`Section ${sectionIndex + 1}`}
                                className="h-9"
                                disabled={savingSectionClientId === section.clientId}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPendingDelete({
                                    kind: "section",
                                    sectionClientId: section.clientId,
                                    title: section.title || `Section ${sectionIndex + 1}`,
                                  });
                                }}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 px-3 pb-3 pt-0">
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleQuestionDragEnd(section.clientId, event)}
                            >
                              <SortableContext
                                items={section.questions.map((question) => question.clientId)}
                                strategy={verticalListSortingStrategy}
                              >
                                {(() => {
                                  const sectionQuestionIds = new Set(
                                    section.questions.map((item) => item.clientId)
                                  );
                                  const childMap = new Map<string, string[]>();
                                  const rootIds: string[] = [];
                                  const questionById = new Map(
                                    section.questions.map((item) => [item.clientId, item])
                                  );

                                  for (const question of section.questions) {
                                    const parentId = getQuestionParentId(question, sectionQuestionIds);
                                    if (parentId) {
                                      const current = childMap.get(parentId) ?? [];
                                      childMap.set(parentId, [...current, question.clientId]);
                                    } else {
                                      rootIds.push(question.clientId);
                                    }
                                  }

                                  const renderQuestionNode = (questionId: string, depth = 0): ReactNode => {
                                    const question = questionById.get(questionId);
                                    if (!question) return null;
                                    const questionIndex = section.questions.findIndex(
                                      (item) => item.clientId === question.clientId
                                    );
                                    const childIds = childMap.get(questionId) ?? [];
                                    return (
                                      <div key={questionId} className="space-y-1">
                                        <SortableQuestionRow
                                          id={question.clientId}
                                          className={`flex items-center gap-2 rounded border px-2 py-1 text-xs transition-all duration-200 ${
                                            selectedQuestionClientId === question.clientId &&
                                            editorMode !== "settings"
                                              ? "border-orange-300 bg-orange-500/12 dark:border-orange-400/60 dark:bg-orange-500/14"
                                              : "border-primary/15 bg-background/70 hover:border-orange-200 hover:bg-orange-500/8 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/10"
                                          } ${
                                            lastMovedQuestionClientId === question.clientId
                                              ? "animate-in slide-in-from-top-1 fade-in duration-200"
                                              : ""
                                          }`}
                                          style={{ marginLeft: `${depth * 12}px` }}
                                          onClick={() => {
                                            setSelectedSectionClientId(section.clientId);
                                            setSelectedQuestionClientId(question.clientId);
                                            setEditorMode("question");
                                          }}
                                        >
                                          {({
                                            dragHandleListeners: questionHandleListeners,
                                            dragHandleAttributes: questionHandleAttributes,
                                            isDragging: isQuestionDragging,
                                            isOver: isQuestionOver,
                                          }) => (
                                            <>
                                              <button
                                                type="button"
                                                className={`rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground ${
                                                  isQuestionDragging ? "cursor-grabbing" : "cursor-grab"
                                                } ${isQuestionOver ? "text-primary" : ""}`}
                                                onClick={(event) => event.stopPropagation()}
                                                {...questionHandleAttributes}
                                                {...questionHandleListeners}
                                              >
                                                <GripVerticalIcon className="size-3.5" />
                                              </button>
                                              {depth > 0 ? <span className="text-orange-600">↳</span> : null}
                                              <button
                                                type="button"
                                                className="min-w-0 flex-1 truncate text-left"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setSelectedSectionClientId(section.clientId);
                                                  setSelectedQuestionClientId(question.clientId);
                                                  setEditorMode("question");
                                                }}
                                              >
                                                {depth > 0 ? "Follow-up:" : `Q${questionIndex + 1}:`}{" "}
                                                {question.questionText || "Untitled question"}
                                              </button>
                                            </>
                                          )}
                                        </SortableQuestionRow>
                                        {childIds.map((childId) => renderQuestionNode(childId, depth + 1))}
                                      </div>
                                    );
                                  };

                                  return rootIds.map((rootId) => renderQuestionNode(rootId));
                                })()}
                              </SortableContext>
                            </DndContext>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-1 w-full border-dashed"
                              onClick={() => {
                                builder.addQuestion(section.clientId);
                                setSelectedSectionClientId(section.clientId);
                                setEditorMode("cards");
                              }}
                            >
                              <PlusIcon className="size-3.5" />
                              Add question
                            </Button>
                          </div>
                        </>
                      )}
                    </SortableSectionItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => void handleAddSection()}>
              <PlusIcon className="size-4" />
              Add section
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 border-r border-primary/10 p-6">
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
                  onTitleChange={(value) => builder.setHeaderField("title", value)}
                  onDescriptionChange={(value) => builder.setHeaderField("description", value)}
                  onTargetTypeChange={(value) => builder.setHeaderField("targetType", value)}
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
                const question = selectedSection.questions.find(
                  (item) => item.clientId === questionClientId
                );
                setPendingDelete({
                  kind: "question",
                  sectionClientId: selectedSection.clientId,
                  questionClientId,
                  questionText: question?.questionText || "Untitled question",
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
              onSave={() => void saveQuestion(selectedSection.clientId, selectedQuestion.clientId)}
              isSaving={savingQuestionClientId === selectedQuestion.clientId}
              canSave={Boolean(initialSurveyId)}
              onUpdate={(patch) =>
                builder.updateQuestion(selectedSection.clientId, selectedQuestion.clientId, (prev) => ({
                  ...prev,
                  ...patch,
                }))
              }
              onTypeChange={(nextType) =>
                builder.setQuestionType(selectedSection.clientId, selectedQuestion.clientId, nextType)
              }
              onDelete={() => {
                setPendingDelete({
                  kind: "question",
                  sectionClientId: selectedSection.clientId,
                  questionClientId: selectedQuestion.clientId,
                  questionText: selectedQuestion.questionText || "Untitled question",
                });
              }}
              onAddOption={() => builder.addOption(selectedSection.clientId, selectedQuestion.clientId)}
              onUpdateOption={(optionClientId, patch) =>
                builder.updateOption(
                  selectedSection.clientId,
                  selectedQuestion.clientId,
                  optionClientId,
                  patch
                )
              }
              onDeleteOption={(optionClientId) =>
                builder.deleteOption(selectedSection.clientId, selectedQuestion.clientId, optionClientId)
              }
              onQuestionConfigChange={(questionConfig) =>
                builder.setQuestionConfig(
                  selectedSection.clientId,
                  selectedQuestion.clientId,
                  questionConfig
                )
              }
              onAddCondition={() => {
                const sectionQuestionIds = new Set(
                  selectedSection.questions.map((item) => item.clientId)
                );
                const parentQuestionId = getQuestionParentId(selectedQuestion, sectionQuestionIds);
                if (!parentQuestionId) {
                  sileo.warning({
                    title: "No parent question",
                    description: "Create this as a follow-up question before adding rules.",
                  });
                  return;
                }
                const parent = allQuestions.find((item) => item.clientId === parentQuestionId);
                if (!parent) return;
                const nextCondition: ShowCondition = {
                  parentQuestionClientId: parentQuestionId,
                  operator: "EQUALS",
                  optionClientId: isChoiceType(parent.questionType)
                    ? parent.options[0]?.clientId
                    : undefined,
                  expectedValue: "",
                  logicType: "AND",
                };
                builder.addCondition(selectedSection.clientId, selectedQuestion.clientId, nextCondition);
              }}
              onAddFollowUpQuestion={() => {
                const nextQuestionClientId = builder.addQuestion(selectedSection.clientId);
                builder.updateQuestion(
                  selectedSection.clientId,
                  nextQuestionClientId,
                  (question) => ({
                    ...question,
                    questionText: "",
                    showConditions: [
                      {
                        parentQuestionClientId: selectedQuestion.clientId,
                        operator: isChoiceType(selectedQuestion.questionType)
                          ? "EQUALS"
                          : "CONTAINS",
                        optionClientId: isChoiceType(selectedQuestion.questionType)
                          ? selectedQuestion.options[0]?.clientId
                          : undefined,
                        expectedValue: isChoiceType(selectedQuestion.questionType) ? undefined : "",
                        logicType: "AND",
                      },
                    ],
                  })
                );
                setSelectedQuestionClientId(nextQuestionClientId);
                setEditorMode("question");
              }}
              onUpdateCondition={(conditionIndex, updater) =>
                builder.updateCondition(
                  selectedSection.clientId,
                  selectedQuestion.clientId,
                  conditionIndex,
                  updater
                )
              }
              onDeleteCondition={(conditionIndex) =>
                builder.deleteCondition(selectedSection.clientId, selectedQuestion.clientId, conditionIndex)
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

        <section className="w-[360px] shrink-0 p-4">
          <SurveyPreviewPanel question={selectedQuestion} />
        </section>
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "section" ? "Delete section" : "Delete question"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "section" ? (
                <>
                  Delete{" "}
                  <span className="font-semibold text-foreground">
                    {pendingDelete.title}
                  </span>
                  ? Questions in this section will also be removed.
                </>
              ) : (
                <>
                  Delete{" "}
                  <span className="font-semibold text-foreground">
                    {pendingDelete?.questionText}
                  </span>
                  ? This question and its follow-up logic will be removed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {pendingDelete?.kind === "section" ? "Delete section" : "Delete question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingReorder}
        onOpenChange={(open) => {
          if (!open && !isSavingReorder) {
            setPendingReorder(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingReorder?.kind === "section" ? "Save section order" : "Save question order"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingReorder?.kind === "section"
                ? "Apply this new section order now?"
                : "Apply this new question order now?"}
              {isSavingReorder ? " Saving..." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingReorder}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isSavingReorder} onClick={confirmReorder}>
              {isSavingReorder ? "Saving order..." : "Save order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

