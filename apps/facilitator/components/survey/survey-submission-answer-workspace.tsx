"use client";

import { useMemo, useState } from "react";
import { CheckIcon, PlusIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { sileo } from "sileo";

import { PaginationRow, formTextareaClass } from "@/components/base-data/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SurveySubmissionAnswer, SurveySubmissionRecord } from "@/lib/api/surveys";
import type { JsonQuestionConfig } from "@/lib/survey-builder/types";
import {
  useSaveSurveySubmissionAnswerMutation,
  useSubmitSurveySubmissionMutation,
  useUpdateSurveySubmissionAnswerMutation,
} from "@/hooks/use-surveys";

export type QuestionTemplate = {
  key: string;
  questionId?: string;
  questionText: string;
  questionType: string;
  questionConfig?: JsonQuestionConfig;
  options: Array<{ id?: string; text: string }>;
};

type WorkspaceQuestion = {
  key: string;
  answer?: SurveySubmissionAnswer;
  questionId?: string;
  questionText: string;
  questionType: string;
  questionConfig?: JsonQuestionConfig;
  options: Array<{ id?: string; text: string }>;
};

type AnswerDraft = {
  textValue: string;
  numberValue: string;
  dateValue: string;
  booleanValue: "true" | "false" | "";
  singleChoiceValue: string;
  multiChoiceValue: string;
  jsonValue: unknown;
};

const ANSWERS_PAGE_SIZE = 6;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeQuestionType(questionType: string) {
  return questionType.replace(/_/g, " ");
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTitleCase(value: string) {
  return value
    .split("_")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitialDraft(answer: SurveySubmissionAnswer): AnswerDraft {
  return {
    textValue: answer.answerText ?? "",
    numberValue:
      answer.answerNumber !== null && answer.answerNumber !== undefined ? String(answer.answerNumber) : "",
    dateValue: answer.answerDate ?? "",
    booleanValue:
      answer.answerBoolean === null || answer.answerBoolean === undefined
        ? ""
        : answer.answerBoolean
          ? "true"
          : "false",
    singleChoiceValue: answer.selectedOptions[0]?.optionText ?? "",
    multiChoiceValue: answer.selectedOptions.map((option) => option.optionText).join(", "),
    jsonValue:
      answer.answerJson !== null && answer.answerJson !== undefined ? deepClone(answer.answerJson) : null,
  };
}

function getInitialDraftFromQuestion(question: WorkspaceQuestion): AnswerDraft {
  if (question.answer) return getInitialDraft(question.answer);
  let jsonValue: unknown = null;
  if (question.questionType === "JSON" && question.questionConfig) {
    if (question.questionConfig.jsonType === "REPEATABLE_TABLE") {
      const minRows = Math.max(1, Number(question.questionConfig.minRows ?? 1));
      const cols = question.questionConfig.columns;
      jsonValue = Array.from({ length: minRows }).map(() =>
        cols.reduce<Record<string, unknown>>((acc, col) => {
          acc[col.key || col.label] = "";
          return acc;
        }, {})
      );
    } else {
      jsonValue = question.questionConfig.rows.reduce<Record<string, unknown>>((acc, row) => {
        acc[row.key || row.label] = "";
        return acc;
      }, {});
    }
  }
  return {
    textValue: "",
    numberValue: "",
    dateValue: "",
    booleanValue: "",
    singleChoiceValue: "",
    multiChoiceValue: "",
    jsonValue,
  };
}

function SubmissionStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  if (normalized === "FINISHED" || normalized === "SUBMITTED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        Submitted
      </Badge>
    );
  }
  if (normalized === "NOT_STARTED" || normalized === "NOT STARTED") {
    return (
      <Badge className="border-transparent bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
        Not started
      </Badge>
    );
  }
  if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        In progress
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function RepeatableEditor({
  value,
  config,
  onChange,
}: {
  value: unknown;
  config?: Extract<JsonQuestionConfig, { jsonType: "REPEATABLE_TABLE" }>;
  onChange: (next: unknown) => void;
}) {
  const rows = useMemo(() => {
    if (!Array.isArray(value)) return [];
    return value.filter((row) => isRecord(row)) as Array<Record<string, unknown>>;
  }, [value]);

  const columnsFromRows = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) keys.add(key);
    }
    return Array.from(keys);
  }, [rows]);

  const safeColumns = config
    ? config.columns.map((column) => column.key || column.label)
    : columnsFromRows.length > 0
      ? columnsFromRows
      : ["value"];

  const updateCell = (rowIndex: number, key: string, nextValue: string) => {
    const nextRows = rows.map((row) => ({ ...row }));
    if (!nextRows[rowIndex]) return;
    nextRows[rowIndex][key] = nextValue;
    onChange(nextRows);
  };

  const addRow = () => {
    const nextRow = safeColumns.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    onChange([...rows, nextRow]);
  };

  const removeRow = (rowIndex: number) => {
    onChange(rows.filter((_, index) => index !== rowIndex));
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {safeColumns.map((column) => (
              <TableHead key={column}>{toTitleCase(column)}</TableHead>
            ))}
            <TableHead className="w-[96px]">Row</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={safeColumns.length + 1}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                No rows yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {safeColumns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`} className="whitespace-normal">
                    <Input
                      className="h-9 text-sm"
                      value={String(row[column] ?? "")}
                      onChange={(event) => updateCell(rowIndex, column, event.target.value)}
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 px-2 text-destructive hover:text-destructive"
                    onClick={() => removeRow(rowIndex)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Button type="button" size="sm" variant="outline" onClick={addRow}>
        <PlusIcon className="size-4" />
        Add row
      </Button>
    </div>
  );
}

function GridEditor({
  value,
  config,
  onChange,
}: {
  value: unknown;
  config?: Extract<JsonQuestionConfig, { jsonType: "GRID" }>;
  onChange: (next: unknown) => void;
}) {
  const map = isRecord(value) ? (value as Record<string, unknown>) : {};
  const rows = config
    ? config.rows.map((row) => row.key || row.label)
    : Object.keys(map);
  const cols = config
    ? config.columns.map((column) => column.key || column.label)
    : (() => {
        const discovered = new Set<string>();
        for (const value of Object.values(map)) {
          if (typeof value === "string" && value.trim()) discovered.add(value);
          if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === "string" && item.trim()) discovered.add(item);
            }
          }
        }
        return discovered.size > 0 ? Array.from(discovered) : ["very_poor", "poor", "fair", "good", "very_good"];
      })();
  const selectionType = config?.selectionType ?? "SINGLE";

  const isSelected = (rowKey: string, colKey: string) => {
    const current = map[rowKey];
    if (selectionType === "MULTIPLE") {
      return Array.isArray(current) && current.includes(colKey);
    }
    return current === colKey;
  };

  const toggleSelection = (rowKey: string, colKey: string) => {
    const current = map[rowKey];
    if (selectionType === "MULTIPLE") {
      const currentArray = Array.isArray(current)
        ? current.filter((item): item is string => typeof item === "string")
        : [];
      const nextArray = currentArray.includes(colKey)
        ? currentArray.filter((item) => item !== colKey)
        : [...currentArray, colKey];
      onChange({ ...map, [rowKey]: nextArray });
      return;
    }
    if (current === colKey) {
      onChange({ ...map, [rowKey]: "" });
      return;
    }
    onChange({ ...map, [rowKey]: colKey });
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Item</TableHead>
            {cols.map((col) => (
              <TableHead key={col} className="text-center">{toTitleCase(col)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols.length + 1} className="py-6 text-center text-sm text-muted-foreground">
                No grid rows found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row}>
                <TableCell className="font-medium whitespace-normal">{toTitleCase(row)}</TableCell>
                {cols.map((col) => (
                  <TableCell key={`${row}-${col}`} className="text-center">
                    <button
                      type="button"
                      aria-label={`Set ${toTitleCase(row)} as ${toTitleCase(col)}`}
                      className={`mx-auto inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1 transition-colors ${
                        isSelected(row, col)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary/30 bg-background text-transparent hover:border-primary/60"
                      }`}
                      onClick={() => toggleSelection(row, col)}
                    >
                      <CheckIcon className="size-3.5" />
                    </button>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function JsonQuestionEditor({
  draft,
  questionConfig,
  onDraftChange,
}: {
  draft: AnswerDraft;
  questionConfig?: JsonQuestionConfig;
  onDraftChange: (patch: Partial<AnswerDraft>) => void;
}) {
  const isRepeatable =
    questionConfig?.jsonType === "REPEATABLE_TABLE" ||
    (Array.isArray(draft.jsonValue) &&
      draft.jsonValue.every((entry) => isRecord(entry) || entry === null));
  const isGrid = questionConfig?.jsonType === "GRID" || isRecord(draft.jsonValue);

  if (isRepeatable) {
    return (
      <RepeatableEditor
        value={draft.jsonValue}
        config={questionConfig?.jsonType === "REPEATABLE_TABLE" ? questionConfig : undefined}
        onChange={(next) => onDraftChange({ jsonValue: next })}
      />
    );
  }

  if (isGrid) {
    return (
      <GridEditor
        value={draft.jsonValue}
        config={questionConfig?.jsonType === "GRID" ? questionConfig : undefined}
        onChange={(next) => onDraftChange({ jsonValue: next })}
      />
    );
  }

  return (
    <textarea
      className={`${formTextareaClass} font-mono text-xs`}
      value={draft.jsonValue ? JSON.stringify(draft.jsonValue, null, 2) : ""}
      onChange={(event) => {
        try {
          const parsed = event.target.value.trim() ? JSON.parse(event.target.value) : null;
          onDraftChange({ jsonValue: parsed });
        } catch {
          onDraftChange({ jsonValue: event.target.value });
        }
      }}
      placeholder="Paste structured answer data"
    />
  );
}

function QuestionAnswerEditor({
  question,
  index,
  draft,
  onDraftChange,
}: {
  question: WorkspaceQuestion;
  index: number;
  draft: AnswerDraft;
  onDraftChange: (patch: Partial<AnswerDraft>) => void;
}) {
  const type = question.questionType.toUpperCase();
  const options = question.options;
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Question {index + 1}</p>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {normalizeQuestionType(question.questionType)}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-foreground">{question.questionText}</p>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Answer</p>
        <div className="w-full max-w-2xl">
          {type === "NUMBER" ? (
            <Input
              type="number"
              className="h-11 max-w-lg text-sm"
              value={draft.numberValue}
              onChange={(event) => onDraftChange({ numberValue: event.target.value })}
              placeholder="Enter numeric answer"
            />
          ) : type === "DATE" ? (
            <Input
              type="date"
              className="h-11 max-w-lg text-sm"
              value={draft.dateValue}
              onChange={(event) => onDraftChange({ dateValue: event.target.value })}
            />
          ) : type === "BOOLEAN" ? (
            <Select
              value={draft.booleanValue || undefined}
              onValueChange={(value) =>
                onDraftChange({ booleanValue: value as "true" | "false" | "" })
              }
            >
              <SelectTrigger className="h-11 max-w-lg text-sm">
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : type === "SINGLE_CHOICE" ? (
            options.length > 0 ? (
              <Select
                value={draft.singleChoiceValue || undefined}
                onValueChange={(value) => onDraftChange({ singleChoiceValue: value })}
              >
                <SelectTrigger className="h-11 max-w-lg text-sm">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option, optionIndex) => (
                    <SelectItem key={option.id ?? `${question.key}-single-${optionIndex}`} value={option.text}>
                      {option.text || `Option ${optionIndex + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-11 max-w-lg text-sm"
                value={draft.singleChoiceValue}
                onChange={(event) => onDraftChange({ singleChoiceValue: event.target.value })}
                placeholder="Enter selected option"
              />
            )
          ) : type === "MULTIPLE_CHOICE" ? (
            options.length > 0 ? (
              <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                {options.map((option, optionIndex) => {
                  const text = option.text || `Option ${optionIndex + 1}`;
                  const selected = draft.multiChoiceValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .includes(text);
                  return (
                    <label
                      key={option.id ?? `${question.key}-multi-${optionIndex}`}
                      className="flex items-center gap-2 rounded-lg border border-primary/15 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          const current = draft.multiChoiceValue
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean);
                          const next = event.target.checked
                            ? Array.from(new Set([...current, text]))
                            : current.filter((item) => item !== text);
                          onDraftChange({ multiChoiceValue: next.join(", ") });
                        }}
                      />
                      <span>{text}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className={`${formTextareaClass} max-w-xl`}
                value={draft.multiChoiceValue}
                onChange={(event) => onDraftChange({ multiChoiceValue: event.target.value })}
                placeholder="Enter selected options separated by commas"
              />
            )
          ) : type === "JSON" ? (
            <JsonQuestionEditor
              draft={draft}
              questionConfig={question.questionConfig}
              onDraftChange={onDraftChange}
            />
          ) : type === "LONG_TEXT" ? (
            <textarea
              className={`${formTextareaClass} max-w-xl`}
              value={draft.textValue}
              onChange={(event) => onDraftChange({ textValue: event.target.value })}
              placeholder="Enter answer"
            />
          ) : (
            <Input
              className="h-11 max-w-lg text-sm"
              value={draft.textValue}
              onChange={(event) => onDraftChange({ textValue: event.target.value })}
              placeholder="Enter answer"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function isQuestionAnswered(question: WorkspaceQuestion, draft: AnswerDraft): boolean {
  const type = question.questionType.toUpperCase();
  if (type === "NUMBER") return draft.numberValue.trim() !== "";
  if (type === "DATE") return draft.dateValue.trim() !== "";
  if (type === "BOOLEAN") return draft.booleanValue !== "";
  if (type === "SINGLE_CHOICE") return draft.singleChoiceValue.trim() !== "";
  if (type === "MULTIPLE_CHOICE")
    return draft.multiChoiceValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean).length > 0;
  if (type === "JSON") {
    if (Array.isArray(draft.jsonValue)) return draft.jsonValue.length > 0;
    if (isRecord(draft.jsonValue)) return Object.keys(draft.jsonValue).length > 0;
    return Boolean(draft.jsonValue);
  }
  return draft.textValue.trim() !== "";
}

function buildSubmissionAnswerPayload(question: WorkspaceQuestion, draft: AnswerDraft) {
  if (!question.questionId) return null;
  const type = question.questionType.toUpperCase();
  const payload: {
    questionId: string;
    answerText?: string;
    answerNumber?: number;
    answerDate?: string;
    answerBoolean?: boolean;
    answerJson?: unknown;
    selectedOptionIds?: string[];
  } = {
    questionId: question.questionId,
  };

  if (type === "NUMBER") {
    const parsed = Number(draft.numberValue);
    if (Number.isFinite(parsed)) payload.answerNumber = parsed;
    return payload;
  }

  if (type === "DATE") {
    if (draft.dateValue.trim()) payload.answerDate = draft.dateValue.trim();
    return payload;
  }

  if (type === "BOOLEAN") {
    if (draft.booleanValue === "true") payload.answerBoolean = true;
    if (draft.booleanValue === "false") payload.answerBoolean = false;
    return payload;
  }

  if (type === "SINGLE_CHOICE") {
    const selected = question.options.find(
      (option) => option.text.trim().toLowerCase() === draft.singleChoiceValue.trim().toLowerCase()
    );
    payload.selectedOptionIds = selected?.id ? [selected.id] : [];
    return payload;
  }

  if (type === "MULTIPLE_CHOICE") {
    const selectedTexts = draft.multiChoiceValue
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    payload.selectedOptionIds = question.options
      .filter((option) => option.id && selectedTexts.includes(option.text.trim().toLowerCase()))
      .map((option) => option.id as string);
    return payload;
  }

  if (type === "JSON") {
    payload.answerJson = draft.jsonValue ?? null;
    return payload;
  }

  payload.answerText = draft.textValue.trim();
  return payload;
}

export function SurveySubmissionAnswerWorkspace({
  submission,
  targetLabelSingular = "member",
  questionTemplates,
  onBackToTable,
  onSubmissionUpdated,
}: {
  submission: SurveySubmissionRecord;
  targetLabelSingular?: string;
  questionTemplates: QuestionTemplate[];
  onBackToTable: () => void;
  onSubmissionUpdated?: () => Promise<unknown> | void;
}) {
  const [draftOverrides, setDraftOverrides] = useState<Record<string, Partial<AnswerDraft>>>({});
  const [dirtyQuestionKeys, setDirtyQuestionKeys] = useState<Record<string, true>>({});
  const [answersPage, setAnswersPage] = useState(1);
  const saveAnswerMutation = useSaveSurveySubmissionAnswerMutation();
  const updateAnswerMutation = useUpdateSurveySubmissionAnswerMutation();
  const submitSubmissionMutation = useSubmitSurveySubmissionMutation();

  const questions: WorkspaceQuestion[] = useMemo(() => {
    const answerByQuestionId = new Map(
      submission.answers
        .filter((answer) => Boolean(answer.questionId))
        .map((answer) => [answer.questionId, answer] as const)
    );
    const baseQuestions = questionTemplates.map((template) => ({
      key: template.key,
      answer: template.questionId ? answerByQuestionId.get(template.questionId) : undefined,
      questionId: template.questionId,
      questionText: template.questionText,
      questionType: template.questionType,
      questionConfig: template.questionConfig,
      options: template.options,
    }));
    const knownQuestionIds = new Set(
      questionTemplates.map((template) => template.questionId).filter((id): id is string => Boolean(id))
    );
    const orphanAnswers = submission.answers
      .filter((answer) => !knownQuestionIds.has(answer.questionId))
      .map((answer) => ({
        key: answer.id,
        answer,
        questionId: answer.questionId,
        questionText: answer.questionText,
        questionType: answer.questionType,
        questionConfig: undefined,
        options: answer.selectedOptions.map((option) => ({ id: option.optionId, text: option.optionText })),
      }));
    return [...baseQuestions, ...orphanAnswers];
  }, [questionTemplates, submission.answers]);

  const totalQuestions = questions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / ANSWERS_PAGE_SIZE));
  const currentPage = Math.min(answersPage, totalPages);
  const startIndex = (currentPage - 1) * ANSWERS_PAGE_SIZE;
  const pageQuestions = questions.slice(startIndex, startIndex + ANSWERS_PAGE_SIZE);

  const getDraft = (question: WorkspaceQuestion): AnswerDraft => {
    return {
      ...getInitialDraftFromQuestion(question),
      ...(draftOverrides[question.key] ?? {}),
    };
  };

  const updateDraft = (questionKey: string, patch: Partial<AnswerDraft>) => {
    setDraftOverrides((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] ?? {}),
        ...patch,
      },
    }));
    setDirtyQuestionKeys((prev) => ({
      ...prev,
      [questionKey]: true,
    }));
  };

  const isSaving = saveAnswerMutation.isPending || updateAnswerMutation.isPending;
  const isSubmitting = submitSubmissionMutation.isPending;
  const dirtyCount = Object.keys(dirtyQuestionKeys).length;
  const displayTargetName =
    submission.targetName || submission.memberName || `Unknown ${targetLabelSingular}`;
  const allQuestionsCompleted = questions.every((question) =>
    isQuestionAnswered(question, getDraft(question))
  );

  const persistDirtyAnswers = async () => {
    const dirtyKeys = Object.keys(dirtyQuestionKeys);
    if (dirtyKeys.length === 0) return;

    for (const questionKey of dirtyKeys) {
      const question = questions.find((item) => item.key === questionKey);
      if (!question) continue;
      const draft = getDraft(question);
      const payload = buildSubmissionAnswerPayload(question, draft);
      if (!payload) continue;

      if (question.answer?.id) {
        await updateAnswerMutation.mutateAsync({
          submissionId: submission.id,
          answerId: question.answer.id,
          payload,
        });
      } else {
        await saveAnswerMutation.mutateAsync({
          submissionId: submission.id,
          payload,
        });
      }
    }

    setDirtyQuestionKeys({});
    if (onSubmissionUpdated) {
      await onSubmissionUpdated();
    }
  };

  const handleSaveChanges = async () => {
    try {
      await persistDirtyAnswers();
      sileo.success({
        title: "Answers saved",
        description: "Submission answers were updated successfully.",
      });
    } catch (error) {
      sileo.error({
        title: "Failed to save answers",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!allQuestionsCompleted) {
        sileo.warning({
          title: "Complete all questions first",
          description: "Please answer all questions before submitting.",
        });
        return;
      }
      await persistDirtyAnswers();
      const result = await submitSubmissionMutation.mutateAsync(submission.id);
      if (onSubmissionUpdated) {
        await onSubmissionUpdated();
      }
      sileo.success({
        title: "Submission completed",
        description: result.message || "Submission has been submitted successfully.",
      });
    } catch (error) {
      sileo.error({
        title: "Failed to submit",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBackToTable}>
          Back to submissions table
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => void handleSaveChanges()} disabled={isSaving || isSubmitting || dirtyCount === 0}>
            {isSaving ? "Saving..." : dirtyCount > 0 ? `Save changes (${dirtyCount})` : "Save changes"}
          </Button>
          {currentPage === totalPages ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSubmit()}
              disabled={isSaving || isSubmitting || !allQuestionsCompleted}
            >
              {isSubmitting ? "Submitting..." : "Submit submission"}
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle>
            {targetLabelSingular[0]
              ? `${targetLabelSingular[0].toUpperCase()}${targetLabelSingular.slice(1)} response workspace`
              : "Response workspace"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/10 bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <UserRoundIcon className="size-4 text-muted-foreground" />
                  {displayTargetName}
                </p>
              </div>
              <SubmissionStatusBadge status={submission.submissionStatus} />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <p>Started: {formatDateTime(submission.startedAt)}</p>
              <p>Submitted: {formatDateTime(submission.submittedAt)}</p>
              <p>Total questions: {totalQuestions || submission.totalQuestions}</p>
              <p>Answered: {submission.answeredQuestions}</p>
            </div>
          </div>

          {pageQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-primary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No questions found for this survey.
            </div>
          ) : (
            <div className="space-y-3">
              {pageQuestions.map((question, index) => (
                <QuestionAnswerEditor
                  key={question.key}
                  question={question}
                  index={startIndex + index}
                  draft={getDraft(question)}
                  onDraftChange={(patch) => updateDraft(question.key, patch)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <PaginationRow
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalQuestions}
              onPrev={() => setAnswersPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setAnswersPage((prev) => Math.min(totalPages, prev + 1))}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
