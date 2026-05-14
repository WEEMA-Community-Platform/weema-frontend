"use client";

import { useId, useMemo, useState } from "react";
import { CheckIcon, PlusIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import { PaginationRow, formTextareaClass } from "@/components/base-data/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SurveySubmissionAnswer, SurveySubmissionRecord } from "@/lib/api/surveys";
import type {
  ConditionOperator,
  JsonQuestionConfig,
  NumberQuestionConfig,
} from "@/lib/survey-builder/types";
import { isJsonQuestionConfig, isNumberQuestionConfig } from "@/lib/survey-builder/types";
import {
  useSaveSurveySubmissionAnswerMutation,
  useSubmitSurveySubmissionMutation,
  useUpdateSurveySubmissionAnswerMutation,
} from "@/hooks/use-surveys";

export type QuestionTemplate = {
  key: string;
  questionId?: string;
  questionClientId: string;
  sectionKey: string;
  questionText: string;
  questionType: string;
  questionConfig?: JsonQuestionConfig | NumberQuestionConfig;
  options: Array<{ id?: string; clientId: string; text: string; isExclusive?: boolean }>;
  showConditions: Array<{
    parentQuestionRef: string;
    operator: ConditionOperator;
    optionRef?: string;
    expectedValue?: string;
    logicType: "AND" | "OR";
  }>;
};

export type SectionTemplate = {
  key: string;
  skipConditions: Array<{
    parentQuestionRef: string;
    operator: ConditionOperator;
    optionRef?: string;
    expectedValue?: string;
    logicType: "AND" | "OR";
  }>;
};

type WorkspaceQuestion = {
  key: string;
  answer?: SurveySubmissionAnswer;
  questionId?: string;
  questionClientId: string;
  sectionKey: string;
  questionText: string;
  questionType: string;
  questionConfig?: JsonQuestionConfig | NumberQuestionConfig;
  options: Array<{ id?: string; clientId: string; text: string; isExclusive?: boolean }>;
  showConditions: QuestionTemplate["showConditions"];
};

type AnswerDraft = {
  textValue: string;
  numberValue: string;
  dateValue: string;
  booleanValue: "true" | "false" | "";
  singleChoiceOptionId: string;
  singleChoiceValue: string;
  multiChoiceOptionIds: string[];
  multiChoiceValue: string;
  jsonValue: unknown;
};

function getNumberAnswerBounds(question: WorkspaceQuestion): { min?: number; max?: number } {
  if (question.questionType.toUpperCase() !== "NUMBER" || !question.questionConfig) return {};
  const cfg = question.questionConfig;

  if (isNumberQuestionConfig(cfg)) {
    return {
      min: cfg.minValue !== undefined && Number.isFinite(cfg.minValue) ? cfg.minValue : undefined,
      max: cfg.maxValue !== undefined && Number.isFinite(cfg.maxValue) ? cfg.maxValue : undefined,
    };
  }

  const raw = cfg as Record<string, unknown>;
  if (raw.component !== "NUMBER") return {};
  const minSrc = raw.minValue ?? raw.min;
  const maxSrc = raw.maxValue ?? raw.max;
  const out: { min?: number; max?: number } = {};
  if (minSrc !== undefined && minSrc !== null && Number.isFinite(Number(minSrc))) {
    out.min = Number(minSrc);
  }
  if (maxSrc !== undefined && maxSrc !== null && Number.isFinite(Number(maxSrc))) {
    out.max = Number(maxSrc);
  }
  return out;
}

function numberBoundsAreActive(bounds: { min?: number; max?: number }): boolean {
  return bounds.min !== undefined || bounds.max !== undefined;
}

function getNumberFieldIssue(
  valueStr: string,
  bounds: { min?: number; max?: number }
): "none" | "invalid" | "below" | "above" {
  const trimmed = valueStr.trim();
  if (!trimmed) return "none";
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return "invalid";
  if (!numberBoundsAreActive(bounds)) return "none";
  if (bounds.min !== undefined && n < bounds.min) return "below";
  if (bounds.max !== undefined && n > bounds.max) return "above";
  return "none";
}

function isNumberWithinBounds(
  valueStr: string,
  bounds: { min?: number; max?: number }
): boolean {
  if (!valueStr.trim()) return false;
  const n = Number(valueStr);
  if (!Number.isFinite(n)) return false;
  if (bounds.min !== undefined && n < bounds.min) return false;
  if (bounds.max !== undefined && n > bounds.max) return false;
  return true;
}

function isNumberDraftSaveable(question: WorkspaceQuestion, draft: AnswerDraft): boolean {
  if (question.questionType.toUpperCase() !== "NUMBER") return true;
  const raw = draft.numberValue.trim();
  if (!raw) return true;
  const bounds = getNumberAnswerBounds(question);
  return isNumberWithinBounds(draft.numberValue, bounds);
}

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
    singleChoiceOptionId: answer.selectedOptions[0]?.optionId ?? "",
    singleChoiceValue: answer.selectedOptions[0]?.optionText ?? "",
    multiChoiceOptionIds: answer.selectedOptions
      .map((option) => option.optionId)
      .filter((optionId): optionId is string => Boolean(optionId)),
    multiChoiceValue: answer.selectedOptions.map((option) => option.optionText).join(", "),
    jsonValue:
      answer.answerJson !== null && answer.answerJson !== undefined ? deepClone(answer.answerJson) : null,
  };
}

function getInitialDraftFromQuestion(question: WorkspaceQuestion): AnswerDraft {
  if (question.answer) return getInitialDraft(question.answer);
  let jsonValue: unknown = null;
  if (question.questionType === "JSON" && question.questionConfig && isJsonQuestionConfig(question.questionConfig)) {
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
    singleChoiceOptionId: "",
    singleChoiceValue: "",
    multiChoiceOptionIds: [],
    multiChoiceValue: "",
    jsonValue,
  };
}

function toNormalized(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function resolveQuestionByRef(
  questions: WorkspaceQuestion[],
  questionRef: string
): WorkspaceQuestion | undefined {
  const ref = questionRef.trim();
  if (!ref) return undefined;
  return questions.find(
    (question) =>
      question.questionId === ref || question.questionClientId === ref || question.key === ref
  );
}

function resolveOptionKeysByRef(question: WorkspaceQuestion, optionRef: string): string[] {
  const ref = optionRef.trim();
  if (!ref) return [];
  const option = question.options.find(
    (entry) => entry.id === ref || entry.clientId === ref
  );
  if (!option) return [];
  const keys = [option.id, option.clientId, option.text].filter(
    (value): value is string => Boolean(value && value.trim())
  );
  return Array.from(new Set(keys.map((key) => toNormalized(key))));
}

function getSelectedOptionKeys(question: WorkspaceQuestion, draft: AnswerDraft): Set<string> {
  const keys = new Set<string>();
  const add = (value?: string) => {
    if (!value) return;
    const normalized = toNormalized(value);
    if (normalized) keys.add(normalized);
  };

  if (question.questionType.toUpperCase() === "SINGLE_CHOICE") {
    if (draft.singleChoiceOptionId) add(draft.singleChoiceOptionId);
    if (draft.singleChoiceValue.trim()) add(draft.singleChoiceValue);
    const matched = question.options.find(
      (option) =>
        option.id === draft.singleChoiceOptionId ||
        option.clientId === draft.singleChoiceOptionId ||
        toNormalized(option.text) === toNormalized(draft.singleChoiceValue)
    );
    if (matched) {
      add(matched.id);
      add(matched.clientId);
      add(matched.text);
    }
    return keys;
  }

  if (question.questionType.toUpperCase() === "MULTIPLE_CHOICE") {
    for (const optionId of draft.multiChoiceOptionIds) {
      add(optionId);
      const matched = question.options.find(
        (option) => option.id === optionId || option.clientId === optionId
      );
      if (matched) {
        add(matched.id);
        add(matched.clientId);
        add(matched.text);
      }
    }
    for (const value of draft.multiChoiceValue.split(",")) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      add(trimmed);
      const matched = question.options.find((option) => toNormalized(option.text) === toNormalized(trimmed));
      if (matched) {
        add(matched.id);
        add(matched.clientId);
      }
    }
  }

  return keys;
}

function evaluateSingleCondition(
  condition: {
    parentQuestionRef: string;
    operator: ConditionOperator;
    optionRef?: string;
    expectedValue?: string;
  },
  questions: WorkspaceQuestion[],
  getDraft: (question: WorkspaceQuestion) => AnswerDraft
): boolean {
  const parentQuestion = resolveQuestionByRef(questions, condition.parentQuestionRef);
  if (!parentQuestion) return false;
  const draft = getDraft(parentQuestion);
  const operator = condition.operator;
  const expected = condition.expectedValue;

  if (condition.optionRef) {
    const selected = getSelectedOptionKeys(parentQuestion, draft);
    const optionKeys = resolveOptionKeysByRef(parentQuestion, condition.optionRef);
    const matched = optionKeys.some((optionKey) => selected.has(optionKey));
    if (operator === "NOT_EQUALS") return !matched;
    return matched;
  }

  const type = parentQuestion.questionType.toUpperCase();
  if (type === "BOOLEAN") {
    const actual = draft.booleanValue;
    const target = toNormalized(expected);
    const eq = toNormalized(actual) === target;
    if (operator === "NOT_EQUALS") return !eq;
    return eq;
  }

  if (type === "NUMBER") {
    const actual = Number(draft.numberValue);
    const target = Number(expected);
    if (!Number.isFinite(actual) || !Number.isFinite(target)) return false;
    if (operator === "GREATER_THAN") return actual > target;
    if (operator === "LESS_THAN") return actual < target;
    if (operator === "NOT_EQUALS") return actual !== target;
    return actual === target;
  }

  if (type === "MULTIPLE_CHOICE") {
    const selected = getSelectedOptionKeys(parentQuestion, draft);
    const target = toNormalized(expected);
    if (!target) {
      if (operator === "NOT_EQUALS") return selected.size === 0;
      return selected.size > 0;
    }
    const contains = selected.has(target);
    if (operator === "CONTAINS") return contains;
    if (operator === "NOT_EQUALS") return !contains;
    return contains;
  }

  if (type === "SINGLE_CHOICE") {
    const selected = getSelectedOptionKeys(parentQuestion, draft);
    const target = toNormalized(expected);
    if (!target) {
      if (operator === "NOT_EQUALS") return selected.size === 0;
      return selected.size > 0;
    }
    const contains = selected.has(target);
    if (operator === "NOT_EQUALS") return !contains;
    return contains;
  }

  const actualText =
    type === "DATE"
      ? draft.dateValue.trim()
      : draft.textValue.trim();
  const actual = toNormalized(actualText);
  const target = toNormalized(expected);

  if (operator === "CONTAINS") return actual.includes(target);
  if (operator === "NOT_EQUALS") return actual !== target;
  return actual === target;
}

function evaluateConditionGroup(
  conditions: Array<{
    parentQuestionRef: string;
    operator: ConditionOperator;
    optionRef?: string;
    expectedValue?: string;
    logicType: "AND" | "OR";
  }>,
  questions: WorkspaceQuestion[],
  getDraft: (question: WorkspaceQuestion) => AnswerDraft
): boolean {
  if (conditions.length === 0) return true;
  let current = evaluateSingleCondition(conditions[0], questions, getDraft);
  for (let i = 1; i < conditions.length; i += 1) {
    const condition = conditions[i];
    const next = evaluateSingleCondition(condition, questions, getDraft);
    current = condition.logicType === "OR" ? current || next : current && next;
  }
  return current;
}

function SubmissionStatusBadge({ status }: { status: string }) {
  const t = useTranslations("survey.submissions.status");
  const normalized = status.toUpperCase();
  if (normalized === "FINISHED" || normalized === "SUBMITTED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        {t("submitted")}
      </Badge>
    );
  }
  if (normalized === "NOT_STARTED" || normalized === "NOT STARTED") {
    return (
      <Badge className="border-transparent bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
        {t("notStarted")}
      </Badge>
    );
  }
  if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        {t("inProgress")}
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
  const t = useTranslations("survey.workspace");
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
            <TableHead className="w-[96px]">{t("row")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={safeColumns.length + 1}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                {t("noRows")}
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
        {t("addRow")}
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
  const t = useTranslations("survey.workspace");
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
            <TableHead>{t("item")}</TableHead>
            {cols.map((col) => (
              <TableHead key={col} className="text-center">{toTitleCase(col)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols.length + 1} className="py-6 text-center text-sm text-muted-foreground">
                {t("noGridRows")}
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
                      aria-label={t("setRowAsCol", {
                        row: toTitleCase(row),
                        col: toTitleCase(col),
                      })}
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
  const t = useTranslations("survey.workspace");
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
      placeholder={t("jsonPlaceholder")}
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
  const t = useTranslations("survey.workspace");
  const type = question.questionType.toUpperCase();
  const numberBounds = type === "NUMBER" ? getNumberAnswerBounds(question) : null;
  const numberBoundsActive = numberBounds ? numberBoundsAreActive(numberBounds) : false;
  const numberIssue =
    type === "NUMBER" && numberBounds
      ? getNumberFieldIssue(draft.numberValue, numberBounds)
      : "none";
  const numberHintId = useId();
  const numberErrorId = useId();
  const options = question.options;
  const exclusiveOptionIds = new Set(
    options
      .map((option, optionIndex) => ({
        optionId: option.id ?? option.clientId ?? `${question.key}-multi-${optionIndex}`,
        isExclusive: Boolean(option.isExclusive),
      }))
      .filter((entry) => entry.isExclusive)
      .map((entry) => entry.optionId)
  );
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {t("questionIndex", { index: index + 1 })}
        </p>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {normalizeQuestionType(question.questionType)}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-foreground">{question.questionText}</p>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("answer")}
        </p>
        <div className="w-full max-w-2xl">
          {type === "NUMBER" ? (
            <div className="w-full max-w-full space-y-2 sm:max-w-xl">
              {numberBoundsActive && numberBounds ? (
                <p
                  id={numberHintId}
                  className="text-xs leading-relaxed text-muted-foreground wrap-break-word"
                >
                  {numberBounds.min !== undefined && numberBounds.max !== undefined
                    ? t("numberRangeHintBoth", {
                        min: numberBounds.min,
                        max: numberBounds.max,
                      })
                    : numberBounds.min !== undefined
                      ? t("numberRangeHintMin", { min: numberBounds.min })
                      : t("numberRangeHintMax", { max: numberBounds.max as number })}
                </p>
              ) : null}
              <Input
                type="number"
                inputMode="decimal"
                className={`h-11 min-h-11 w-full text-sm md:h-10 ${
                  numberIssue !== "none"
                    ? "border-amber-600/55 focus-visible:border-amber-700 dark:border-amber-500/45 dark:focus-visible:border-amber-400 aria-invalid:border-amber-600/55"
                    : ""
                }`}
                value={draft.numberValue}
                onChange={(event) => onDraftChange({ numberValue: event.target.value })}
                placeholder={t("numberPlaceholder")}
                min={numberBounds?.min !== undefined ? numberBounds.min : undefined}
                max={numberBounds?.max !== undefined ? numberBounds.max : undefined}
                aria-invalid={numberIssue !== "none"}
                aria-describedby={
                  [
                    numberBoundsActive ? numberHintId : null,
                    numberIssue !== "none" ? numberErrorId : null,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              />
              {numberIssue !== "none" ? (
                <p
                  id={numberErrorId}
                  role="alert"
                  className="text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-200/90 wrap-break-word"
                >
                  {numberIssue === "invalid"
                    ? t("numberInvalid")
                    : numberIssue === "below"
                      ? t("numberBelowMin", { min: numberBounds?.min ?? 0 })
                      : t("numberAboveMax", { max: numberBounds?.max ?? 0 })}
                </p>
              ) : null}
            </div>
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
                <SelectValue placeholder={t("selectAnswer")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("yes")}</SelectItem>
                <SelectItem value="false">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
          ) : type === "SINGLE_CHOICE" ? (
            options.length > 0 ? (
              <Select
                value={draft.singleChoiceOptionId || undefined}
                onValueChange={(value) => {
                  const selected = options.find(
                    (option, optionIndex) =>
                      (option.id ?? option.clientId ?? `${question.key}-single-${optionIndex}`) === value
                  );
                  onDraftChange({
                    singleChoiceOptionId: value,
                    singleChoiceValue: selected?.text ?? "",
                  });
                }}
              >
                <SelectTrigger className="h-11 max-w-lg text-sm">
                  <SelectValue placeholder={t("selectOption")} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option, optionIndex) => (
                    <SelectItem
                      key={option.id ?? option.clientId ?? `${question.key}-single-${optionIndex}`}
                      value={option.id ?? option.clientId ?? `${question.key}-single-${optionIndex}`}
                    >
                      {option.text || t("optionIndex", { index: optionIndex + 1 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-11 max-w-lg text-sm"
                value={draft.singleChoiceValue}
                onChange={(event) =>
                  onDraftChange({
                    singleChoiceOptionId: "",
                    singleChoiceValue: event.target.value,
                  })
                }
                placeholder={t("enterOption")}
              />
            )
          ) : type === "MULTIPLE_CHOICE" ? (
            options.length > 0 ? (
              <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                {options.map((option, optionIndex) => {
                  const optionId = option.id ?? option.clientId ?? `${question.key}-multi-${optionIndex}`;
                  const text = option.text || t("optionIndex", { index: optionIndex + 1 });
                  const selected = draft.multiChoiceOptionIds.includes(optionId);
                  const hasSelectedExclusive = draft.multiChoiceOptionIds.some((id) =>
                    exclusiveOptionIds.has(id)
                  );
                  const hasSelectedNonExclusive = draft.multiChoiceOptionIds.some(
                    (id) => !exclusiveOptionIds.has(id)
                  );
                  const isDisabled = option.isExclusive
                    ? hasSelectedNonExclusive && !selected
                    : hasSelectedExclusive && !selected;
                  return (
                    <label
                      key={optionId}
                      className={`flex items-center gap-2 rounded-lg border border-primary/15 px-3 py-2 text-sm ${
                        isDisabled ? "opacity-60" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={isDisabled}
                        onChange={(event) => {
                          const current = draft.multiChoiceOptionIds;
                          const nextSelectedIds = event.target.checked
                            ? option.isExclusive
                              ? [optionId]
                              : [...current.filter((id) => !exclusiveOptionIds.has(id)), optionId]
                            : current.filter((id) => id !== optionId);
                          const selectedTexts = options
                            .map((item, idx) => ({
                              optionId: item.id ?? item.clientId ?? `${question.key}-multi-${idx}`,
                              text: item.text || t("optionIndex", { index: idx + 1 }),
                            }))
                            .filter((item) => nextSelectedIds.includes(item.optionId))
                            .map((item) => item.text);
                          onDraftChange({
                            multiChoiceOptionIds: nextSelectedIds,
                            multiChoiceValue: selectedTexts.join(", "),
                          });
                        }}
                      />
                      <span>{text}</span>
                      {option.isExclusive ? (
                        <span className="rounded-md border border-amber-300/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          Exclusive
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className={`${formTextareaClass} max-w-xl`}
                value={draft.multiChoiceValue}
                onChange={(event) => onDraftChange({ multiChoiceValue: event.target.value })}
                placeholder={t("enterOptions")}
              />
            )
          ) : type === "JSON" ? (
            <JsonQuestionEditor
              draft={draft}
              questionConfig={
                question.questionConfig && isJsonQuestionConfig(question.questionConfig)
                  ? question.questionConfig
                  : undefined
              }
              onDraftChange={onDraftChange}
            />
          ) : type === "LONG_TEXT" ? (
            <textarea
              className={`${formTextareaClass} max-w-xl`}
              value={draft.textValue}
              onChange={(event) => onDraftChange({ textValue: event.target.value })}
              placeholder={t("enterAnswer")}
            />
          ) : (
            <Input
              className="h-11 max-w-lg text-sm"
              value={draft.textValue}
              onChange={(event) => onDraftChange({ textValue: event.target.value })}
              placeholder={t("enterAnswer")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function isQuestionAnswered(question: WorkspaceQuestion, draft: AnswerDraft): boolean {
  const type = question.questionType.toUpperCase();
  if (type === "NUMBER") {
    const bounds = getNumberAnswerBounds(question);
    if (bounds.min === undefined && bounds.max === undefined) {
      return draft.numberValue.trim() !== "";
    }
    return isNumberWithinBounds(draft.numberValue, bounds);
  }
  if (type === "DATE") return draft.dateValue.trim() !== "";
  if (type === "BOOLEAN") return draft.booleanValue !== "";
  if (type === "SINGLE_CHOICE") {
    return Boolean(draft.singleChoiceOptionId || draft.singleChoiceValue.trim());
  }
  if (type === "MULTIPLE_CHOICE") {
    if (draft.multiChoiceOptionIds.length > 0) return true;
    return draft.multiChoiceValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean).length > 0;
  }
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
    const trimmed = draft.numberValue.trim();
    if (!trimmed) return payload;
    const bounds = getNumberAnswerBounds(question);
    if (!isNumberWithinBounds(draft.numberValue, bounds)) return payload;
    payload.answerNumber = Number(trimmed);
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
    if (draft.singleChoiceOptionId) {
      const selectedById = question.options.find(
        (option) => option.id === draft.singleChoiceOptionId || option.clientId === draft.singleChoiceOptionId
      );
      payload.selectedOptionIds = selectedById?.id ? [selectedById.id] : [];
      return payload;
    }
    const selected = question.options.find(
      (option) => option.text.trim().toLowerCase() === draft.singleChoiceValue.trim().toLowerCase()
    );
    payload.selectedOptionIds = selected?.id ? [selected.id] : [];
    return payload;
  }

  if (type === "MULTIPLE_CHOICE") {
    if (draft.multiChoiceOptionIds.length > 0) {
      payload.selectedOptionIds = question.options
        .filter(
          (option) =>
            option.id &&
            draft.multiChoiceOptionIds.some((selectedId) => selectedId === option.id || selectedId === option.clientId)
        )
        .map((option) => option.id as string);
      return payload;
    }
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
  targetLabelSingular,
  sectionTemplates,
  questionTemplates,
  onBackToTable,
  onSubmissionUpdated,
}: {
  submission: SurveySubmissionRecord;
  targetLabelSingular?: string;
  sectionTemplates: SectionTemplate[];
  questionTemplates: QuestionTemplate[];
  onBackToTable: () => void;
  onSubmissionUpdated?: () => Promise<unknown> | void;
}) {
  const t = useTranslations("survey.workspace");
  const tTargetLabels = useTranslations("survey.submissions.targetLabels");
  const resolvedTargetLabel =
    targetLabelSingular ?? tTargetLabels("memberSingular");
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
      questionClientId: template.questionClientId,
      sectionKey: template.sectionKey,
      questionText: template.questionText,
      questionType: template.questionType,
      questionConfig: template.questionConfig,
      options: template.options,
      showConditions: template.showConditions,
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
        questionClientId: answer.questionId,
        sectionKey: "__orphans__",
        questionText: answer.questionText,
        questionType: answer.questionType,
        questionConfig: undefined,
        options: answer.selectedOptions.map((option) => ({
          id: option.optionId,
          clientId: option.optionId || option.optionText,
          text: option.optionText,
          isExclusive: false,
        })),
        showConditions: [],
      }));
    return [...baseQuestions, ...orphanAnswers];
  }, [questionTemplates, submission.answers]);

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

  const sectionByKey = useMemo(() => {
    return new Map(sectionTemplates.map((section) => [section.key, section] as const));
  }, [sectionTemplates]);

  const visibleQuestions = useMemo(() => {
    const resolveDraft = (question: WorkspaceQuestion): AnswerDraft => ({
      ...getInitialDraftFromQuestion(question),
      ...(draftOverrides[question.key] ?? {}),
    });
    const isQuestionVisible = (question: WorkspaceQuestion) => {
      return question.showConditions.length === 0
        ? true
        : evaluateConditionGroup(question.showConditions, questions, resolveDraft);
    };

    const isSectionVisible = (sectionKey: string) => {
      const section = sectionByKey.get(sectionKey);
      if (!section || section.skipConditions.length === 0) return true;
      const shouldSkip = evaluateConditionGroup(section.skipConditions, questions, resolveDraft);
      return !shouldSkip;
    };

    return questions.filter((question) => {
      if (!isSectionVisible(question.sectionKey)) return false;
      if (!isQuestionVisible(question)) return false;
      return true;
    });
  }, [questions, draftOverrides, sectionByKey]);

  const totalQuestions = visibleQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / ANSWERS_PAGE_SIZE));
  const currentPage = Math.min(answersPage, totalPages);
  const startIndex = (currentPage - 1) * ANSWERS_PAGE_SIZE;
  const pageQuestions = visibleQuestions.slice(startIndex, startIndex + ANSWERS_PAGE_SIZE);

  const isSaving = saveAnswerMutation.isPending || updateAnswerMutation.isPending;
  const isSubmitting = submitSubmissionMutation.isPending;
  const dirtyCount = Object.keys(dirtyQuestionKeys).length;
  const displayTargetName =
    submission.targetName ||
    submission.memberName ||
    t("unknownTarget", { target: resolvedTargetLabel });
  const allQuestionsCompleted = visibleQuestions.every((question) =>
    isQuestionAnswered(question, getDraft(question))
  );

  const persistDirtyAnswers = async () => {
    const dirtyKeys = Object.keys(dirtyQuestionKeys);
    if (dirtyKeys.length === 0) return;

    for (const questionKey of dirtyKeys) {
      const question = questions.find((item) => item.key === questionKey);
      if (!question) continue;
      if (!isNumberDraftSaveable(question, getDraft(question))) {
        sileo.warning({
          title: t("toasts.numberRangeBlockedTitle"),
          description: t("toasts.numberRangeBlockedDescription"),
        });
        return;
      }
    }

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
        title: t("toasts.savedTitle"),
        description: t("toasts.savedMessage"),
      });
    } catch (error) {
      sileo.error({
        title: t("toasts.saveErrorTitle"),
        description: error instanceof Error ? error.message : t("toasts.unexpected"),
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!allQuestionsCompleted) {
        sileo.warning({
          title: t("toasts.incompleteTitle"),
          description: t("toasts.incompleteMessage"),
        });
        return;
      }
      await persistDirtyAnswers();
      const result = await submitSubmissionMutation.mutateAsync(submission.id);
      if (onSubmissionUpdated) {
        await onSubmissionUpdated();
      }
      sileo.success({
        title: t("toasts.submittedTitle"),
        description: result.message || t("toasts.submittedMessage"),
      });
    } catch (error) {
      sileo.error({
        title: t("toasts.submitErrorTitle"),
        description: error instanceof Error ? error.message : t("toasts.unexpected"),
      });
    }
  };

  const workspaceTitleTarget = resolvedTargetLabel[0]
    ? `${resolvedTargetLabel[0].toUpperCase()}${resolvedTargetLabel.slice(1)}`
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBackToTable}>
          {t("backToTable")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => void handleSaveChanges()}
            disabled={isSaving || isSubmitting || dirtyCount === 0}
          >
            {isSaving
              ? t("saving")
              : dirtyCount > 0
                ? t("saveChangesCount", { count: dirtyCount })
                : t("saveChanges")}
          </Button>
          {currentPage === totalPages ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSubmit()}
              disabled={isSaving || isSubmitting || !allQuestionsCompleted}
            >
              {isSubmitting ? t("submitting") : t("submitSubmission")}
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle>
            {workspaceTitleTarget
              ? t("responseWorkspaceTitled", { target: workspaceTitleTarget })
              : t("responseWorkspace")}
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
              <p>{t("started", { value: formatDateTime(submission.startedAt) })}</p>
              <p>{t("submittedAt", { value: formatDateTime(submission.submittedAt) })}</p>
              <p>
                {t("totalQuestions", {
                  count: totalQuestions || submission.totalQuestions,
                })}
              </p>
              <p>{t("answered", { count: submission.answeredQuestions })}</p>
            </div>
          </div>

          {pageQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-primary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              {t("noQuestions")}
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
