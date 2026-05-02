import type { SurveySubmissionAnswer } from "@/lib/api/surveys";
import type { JsonQuestionConfig, NumberQuestionConfig } from "@/lib/survey-builder/types";
import { isJsonQuestionConfig, isNumberQuestionConfig } from "@/lib/survey-builder/types";

import type { AnswerDraft, WorkspaceQuestion } from "./types";

export function formatDateTime(value: string | null | undefined) {
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

export function normalizeQuestionType(questionType: string) {
  return questionType.replace(/_/g, " ");
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toTitleCase(value: string) {
  return value
    .split("_")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getNumberAnswerBounds(question: WorkspaceQuestion): { min?: number; max?: number } {
  const cfg = question.questionConfig;
  if (question.questionType !== "NUMBER" || !cfg || !isNumberQuestionConfig(cfg)) return {};
  return {
    min: cfg.minValue !== undefined && Number.isFinite(cfg.minValue) ? cfg.minValue : undefined,
    max: cfg.maxValue !== undefined && Number.isFinite(cfg.maxValue) ? cfg.maxValue : undefined,
  };
}

function isNumberWithinBounds(valueStr: string, bounds: { min?: number; max?: number }): boolean {
  if (!valueStr.trim()) return false;
  const n = Number(valueStr);
  if (!Number.isFinite(n)) return false;
  if (bounds.min !== undefined && n < bounds.min) return false;
  if (bounds.max !== undefined && n > bounds.max) return false;
  return true;
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

export function getInitialDraftFromQuestion(question: WorkspaceQuestion): AnswerDraft {
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

export function isQuestionAnswered(question: WorkspaceQuestion, draft: AnswerDraft): boolean {
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

export function buildSubmissionAnswerPayload(question: WorkspaceQuestion, draft: AnswerDraft) {
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
    if (draft.singleChoiceOptionId) {
      const selectedById = question.options.find((option) => option.id === draft.singleChoiceOptionId);
      payload.selectedOptionIds = selectedById?.id ? [selectedById.id] : [];
      return payload;
    }
    const selected = question.options.find((option) => {
      return option.text.trim().toLowerCase() === draft.singleChoiceValue.trim().toLowerCase();
    });
    payload.selectedOptionIds = selected?.id ? [selected.id] : [];
    return payload;
  }

  if (type === "MULTIPLE_CHOICE") {
    if (draft.multiChoiceOptionIds.length > 0) {
      payload.selectedOptionIds = question.options
        .filter((option) => option.id && draft.multiChoiceOptionIds.includes(option.id))
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

export type JsonQuestionConfigInput = JsonQuestionConfig | NumberQuestionConfig | undefined;

export function getJsonQuestionConfig(
  questionConfig: JsonQuestionConfigInput
): JsonQuestionConfig | undefined {
  return questionConfig && isJsonQuestionConfig(questionConfig) ? questionConfig : undefined;
}
