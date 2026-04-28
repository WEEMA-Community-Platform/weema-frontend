import type {
  GridAxisItem,
  JsonQuestionConfig,
  QuestionType,
  SurveyBuilderState,
  SurveyOption,
  SurveyQuestion,
  SurveySection,
} from "@/lib/survey-builder/types";
import { isJsonQuestionConfig, isNumberQuestionConfig } from "@/lib/survey-builder/types";

export const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "BOOLEAN", label: "Yes / No" },
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "JSON", label: "JSON component" },
];

export const TARGET_TYPES = [
  { value: "MEMBER", label: "Member" },
  { value: "SELF_HELP_GROUP", label: "Self-Help Group" },
  { value: "CLUSTER", label: "Cluster" },
  { value: "FEDERATION", label: "Federation" },
];

export const JSON_TYPES: Array<{ value: "REPEATABLE_TABLE" | "GRID"; label: string }> = [
  { value: "REPEATABLE_TABLE", label: "Repeatable table" },
  { value: "GRID", label: "Grid" },
];

export function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cid-${Math.random().toString(36).slice(2, 11)}`;
}

export function isChoiceType(questionType: QuestionType) {
  return questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE";
}

export function isJsonType(questionType: QuestionType) {
  return questionType === "JSON";
}

export function isNumberType(questionType: QuestionType) {
  return questionType === "NUMBER";
}

export function createEmptyOption(orderNo = 1): SurveyOption {
  return {
    clientId: createClientId(),
    text: "",
    value: "",
    orderNo,
  };
}

function createDefaultJsonConfig(): JsonQuestionConfig {
  return {
    jsonType: "REPEATABLE_TABLE",
    minRows: 0,
    maxRows: 10,
    columns: [
      { clientId: createClientId(), label: "Column 1", columnType: "TEXT", required: false },
    ],
  };
}

export function createEmptyQuestion(orderNo = 1): SurveyQuestion {
  return {
    clientId: createClientId(),
    questionText: "",
    questionType: "SHORT_TEXT",
    required: false,
    orderNo,
    options: [],
    showConditions: [],
  };
}

export function createEmptySection(orderNo = 1): SurveySection {
  return {
    clientId: createClientId(),
    title: `Section ${orderNo}`,
    description: "",
    orderNo,
    questions: [],
  };
}

export function createEmptySurvey(): SurveyBuilderState {
  return {
    title: "",
    description: "",
    targetType: "MEMBER",
    sections: [createEmptySection(1)],
  };
}

export function normalizeQuestionForType(question: SurveyQuestion, questionType: QuestionType): SurveyQuestion {
  const nextQuestion: SurveyQuestion = {
    ...question,
    questionType,
  };

  if (!isChoiceType(questionType)) {
    nextQuestion.options = [];
  } else if (nextQuestion.options.length === 0) {
    nextQuestion.options = [createEmptyOption(1), createEmptyOption(2)];
  }

  if (isJsonType(questionType)) {
    if (!nextQuestion.questionConfig || !isJsonQuestionConfig(nextQuestion.questionConfig)) {
      nextQuestion.questionConfig = createDefaultJsonConfig();
    }
  } else if (isNumberType(questionType)) {
    if (nextQuestion.questionConfig && isJsonQuestionConfig(nextQuestion.questionConfig)) {
      delete nextQuestion.questionConfig;
    }
  } else {
    delete nextQuestion.questionConfig;
  }

  return nextQuestion;
}

export function reorderList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function applyOrderNo<T extends { orderNo: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, orderNo: index + 1 }));
}

export function createEmptyGridAxisItem(label: string): GridAxisItem {
  return {
    clientId: createClientId(),
    label,
  };
}
