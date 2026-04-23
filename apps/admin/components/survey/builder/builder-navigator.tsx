"use client";

import { type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckSquare2Icon,
  GripVerticalIcon,
  PlusIcon,
  SaveIcon,
  Settings2Icon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useSurveyBuilder } from "@/hooks/use-survey-builder";
import type { ShowCondition, SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";

import {
  buildSectionQuestionTree,
  type EditorMode,
  type PendingDelete,
} from "./shared";
import { MultiFollowUpControls } from "./multi-follow-up-controls";

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
      {children({ dragHandleListeners: listeners, dragHandleAttributes: attributes, isDragging, isOver })}
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
      style={{ ...style, transform: CSS.Transform.toString(transform), transition }}
      className={className}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {children({ dragHandleListeners: listeners, dragHandleAttributes: attributes, isDragging, isOver })}
    </div>
  );
}

type BuilderNavigatorProps = {
  builder: ReturnType<typeof useSurveyBuilder>;
  initialSurveyId: string | null;
  isTranslationMode?: boolean;
  editorMode: EditorMode;
  selectedSection: SurveySection | null;
  selectedQuestionClientId: string | null;
  savingSectionClientId: string | null;
  isSavingAllChanges: boolean;
  isLoadingInitialSurvey: boolean;
  totalQuestionCount: number;
  lastMovedSectionClientId: string | null;
  lastMovedQuestionClientId: string | null;
  onSelectSettings: () => void;
  onSelectSection: (sectionClientId: string) => void;
  onSelectQuestion: (sectionClientId: string, questionClientId: string) => void;
  onSaveSection: (sectionClientId: string) => void;
  onAddSection: () => void;
  onAddQuestion: (sectionClientId: string) => void;
  onPendingDelete: (payload: PendingDelete) => void;
  onSectionDragEnd: (event: DragEndEvent) => void;
  onQuestionDragEnd: (sectionClientId: string, event: DragEndEvent) => void;
  multiFollowUpSelections: Record<string, string[]>;
  multiFollowUpLogicTypeBySection: Record<string, ShowCondition["logicType"]>;
  onMultiFollowUpLogicTypeChange: (
    sectionClientId: string,
    logicType: ShowCondition["logicType"]
  ) => void;
  onToggleMultiFollowUpQuestion: (sectionClientId: string, questionClientId: string) => void;
  onCreateMultiFollowUp: (sectionClientId: string) => void;
};

export function BuilderNavigator({
  builder,
  initialSurveyId,
  isTranslationMode = false,
  editorMode,
  selectedSection,
  selectedQuestionClientId,
  savingSectionClientId,
  isSavingAllChanges,
  isLoadingInitialSurvey,
  totalQuestionCount,
  lastMovedSectionClientId,
  lastMovedQuestionClientId,
  onSelectSettings,
  onSelectSection,
  onSelectQuestion,
  onSaveSection,
  onAddSection,
  onAddQuestion,
  onPendingDelete,
  onSectionDragEnd,
  onQuestionDragEnd,
  multiFollowUpSelections,
  multiFollowUpLogicTypeBySection,
  onMultiFollowUpLogicTypeChange,
  onToggleMultiFollowUpQuestion,
  onCreateMultiFollowUp,
}: BuilderNavigatorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const isStructureLocked = isTranslationMode;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r border-primary/10 bg-card/30">
      {/* Fixed top: notice + settings button */}
      <div className="shrink-0 px-4 pb-0 pt-4">
        {isTranslationMode ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-primary">Translation mode</span> — update text only.
            Survey structure is locked; you cannot add/remove/reorder sections, questions, or
            follow-ups.
          </div>
        ) : !initialSurveyId ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-primary">New survey</span> —{" "}
            {totalQuestionCount === 0 ? (
              <>
                fill in settings and add at least one question, then click{" "}
                <span className="font-medium text-foreground">Create survey</span> when ready.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {totalQuestionCount} question{totalQuestionCount !== 1 ? "s" : ""} ready.
                </span>{" "}
                Click <span className="font-medium text-foreground">Create survey</span> in the
                header to save everything at once.
              </>
            )}
          </div>
        ) : null}
        {isLoadingInitialSurvey ? (
          <p className="mb-3 text-xs text-muted-foreground">Loading survey...</p>
        ) : null}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm ${
              editorMode === "settings" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
            }`}
            onClick={onSelectSettings}
          >
            <Settings2Icon className="size-4" />
            Survey settings
          </button>
        </div>
      </div>

      {/* Scrollable sections list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
          <SortableContext
            items={builder.state.sections.map((s) => s.clientId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {builder.state.sections.map((section, sectionIndex) => {
                const selectedMultiFollowUpQuestionIds =
                  multiFollowUpSelections[section.clientId] ?? [];
                const multiFollowUpLogicType =
                  multiFollowUpLogicTypeBySection[section.clientId] ?? "AND";
                return (
                <SortableSectionItem
                  key={section.clientId}
                  id={section.clientId}
                  className={`cursor-pointer rounded-xl border transition-all duration-200 ${
                    selectedSection?.clientId === section.clientId && editorMode !== "settings"
                      ? "border-orange-400 bg-orange-500/10 dark:border-orange-400/70 dark:bg-orange-500/12"
                      : "border-primary/15 hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/60 dark:hover:bg-orange-500/10"
                  } ${
                    lastMovedSectionClientId === section.clientId
                      ? "animate-in slide-in-from-top-1 fade-in duration-200"
                      : ""
                  }`}
                  onClick={() => onSelectSection(section.clientId)}
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
                            onClick={(e) => e.stopPropagation()}
                            disabled={isStructureLocked}
                            {...dragHandleAttributes}
                            {...dragHandleListeners}
                          >
                            <GripVerticalIcon className="size-4" />
                          </button>
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              builder.updateSection(section.clientId, { title: e.target.value })
                            }
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Section ${sectionIndex + 1}`}
                            className="h-9"
                            disabled={
                              savingSectionClientId === section.clientId || isSavingAllChanges
                            }
                          />
                          {initialSurveyId && section.id ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              disabled={savingSectionClientId === section.clientId || isSavingAllChanges}
                              onClick={(e) => { e.stopPropagation(); onSaveSection(section.clientId); }}
                            >
                              <SaveIcon className="size-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            disabled={isStructureLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPendingDelete({
                                kind: "section",
                                sectionClientId: section.clientId,
                                title: section.title || `Section ${sectionIndex + 1}`,
                              });
                            }}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                        {initialSurveyId && !section.id ? (
                          <div
                            className="flex items-center justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Not saved yet
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
                              disabled={savingSectionClientId === section.clientId || isSavingAllChanges}
                              onClick={(e) => { e.stopPropagation(); onSaveSection(section.clientId); }}
                            >
                              <SaveIcon className="size-3" />
                              {savingSectionClientId === section.clientId ? "Saving..." : "Save section"}
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {/* Questions tree */}
                      <div className="space-y-1 px-3 pb-3 pt-0">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => onQuestionDragEnd(section.clientId, e)}
                        >
                          <SortableContext
                            items={section.questions.map((q) => q.clientId)}
                            strategy={verticalListSortingStrategy}
                          >
                            {(() => {
                              const { rootIds, childMap, questionById } = buildSectionQuestionTree(section.questions);
                              const sectionQuestionIds = new Set(
                                section.questions.map((question) => question.clientId)
                              );
                              const getParentCount = (question: SurveyQuestion) =>
                                new Set(
                                  question.showConditions
                                    .map((condition) => condition.parentQuestionClientId)
                                    .filter((parentId) => sectionQuestionIds.has(parentId))
                                ).size;
                              const renderNode = (
                                questionId: string,
                                depth = 0,
                                path = new Set<string>()
                              ): ReactNode => {
                                if (path.has(questionId)) return null;
                                const nextPath = new Set(path);
                                nextPath.add(questionId);
                                const question = questionById.get(questionId);
                                if (!question) return null;
                                const questionIndex = section.questions.findIndex(
                                  (q) => q.clientId === question.clientId
                                );
                                const parentCount = getParentCount(question);
                                const isMultiParentFollowUp = parentCount > 1;
                                const isSelectedForMultiFollowUp = selectedMultiFollowUpQuestionIds.includes(
                                  question.clientId
                                );
                                return (
                                  <div key={questionId} className="space-y-1">
                                    <SortableQuestionRow
                                      id={question.clientId}
                                      className={`flex cursor-pointer items-center gap-2 rounded border px-2 py-1 text-xs transition-all duration-200 ${
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
                                      onClick={() => onSelectQuestion(section.clientId, question.clientId)}
                                    >
                                      {({ dragHandleListeners: qListeners, dragHandleAttributes: qAttrs, isDragging: qDragging, isOver: qOver }) => (
                                        <>
                                          <button
                                            type="button"
                                            className={`rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground ${
                                              qDragging ? "cursor-grabbing" : "cursor-grab"
                                            } ${qOver ? "text-primary" : ""}`}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isStructureLocked}
                                            {...qAttrs}
                                            {...qListeners}
                                          >
                                            <GripVerticalIcon className="size-3.5" />
                                          </button>
                                          {depth > 0 ? <span className="text-orange-600">↳</span> : null}
                                          <button
                                            type="button"
                                            className="min-w-0 flex-1 truncate text-left"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectQuestion(section.clientId, question.clientId);
                                            }}
                                          >
                                            {depth === 0
                                              ? `Q${questionIndex + 1}:`
                                              : isMultiParentFollowUp
                                                ? `Multi follow-up (${parentCount}):`
                                                : depth === 1
                                                ? "Follow-up:"
                                                : `Nested follow-up (L${depth}):`}{" "}
                                            {question.questionText || "Untitled question"}
                                          </button>
                                          {!isStructureLocked &&
                                          section.questions.length > 1 &&
                                          depth === 0 &&
                                          !isMultiParentFollowUp ? (
                                            <button
                                              type="button"
                                              className="rounded p-0.5 text-muted-foreground/80 transition-colors hover:text-foreground"
                                              title="Select as multi-follow-up parent"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                onToggleMultiFollowUpQuestion(
                                                  section.clientId,
                                                  question.clientId
                                                );
                                              }}
                                            >
                                              {isSelectedForMultiFollowUp ? (
                                                <CheckSquare2Icon className="size-3 text-primary" />
                                              ) : (
                                                <SquareIcon className="size-3" />
                                              )}
                                            </button>
                                          ) : null}
                                        </>
                                      )}
                                    </SortableQuestionRow>
                                    {(childMap.get(questionId) ?? []).map((id) =>
                                      renderNode(id, depth + 1, nextPath)
                                    )}
                                  </div>
                                );
                              };
                              return rootIds.map((id) => renderNode(id));
                            })()}
                          </SortableContext>
                        </DndContext>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 w-full border-dashed"
                          disabled={isStructureLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddQuestion(section.clientId);
                          }}
                        >
                          <PlusIcon className="size-3.5" />
                          Add question
                        </Button>
                        {!isStructureLocked && section.questions.length > 1 ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <MultiFollowUpControls
                              selectedCount={selectedMultiFollowUpQuestionIds.length}
                              logicType={multiFollowUpLogicType}
                              onLogicTypeChange={(logicType) =>
                                onMultiFollowUpLogicTypeChange(section.clientId, logicType)
                              }
                              onCreate={() => onCreateMultiFollowUp(section.clientId)}
                            />
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </SortableSectionItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={onAddSection}
          disabled={isStructureLocked}
        >
          <PlusIcon className="size-4" />
          Add section
        </Button>
      </div>
    </aside>
  );
}
