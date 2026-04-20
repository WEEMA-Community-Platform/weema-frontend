import type {
  ConditionOperator,
  JsonQuestionConfig,
  QuestionType,
  ShowCondition,
  SurveyBuilderState,
  SurveyQuestion,
  SurveyValidationIssue,
} from "@/lib/survey-builder/types";
import {
  applyOrderNo,
  createClientId,
  createEmptyOption,
  isChoiceType,
  isJsonType,
  normalizeQuestionForType,
} from "@/lib/survey-builder/utils";

type BackendSurveyCondition = {
  id?: string;
  parentQuestionClientId?: string;
  parentQuestionId?: string;
  operator?: ConditionOperator;
  optionClientId?: string;
  optionId?: string;
  expectedValue?: string | number | boolean | null;
  logicType?: "AND" | "OR";
};

function isOperatorAllowedForQuestionType(questionType: QuestionType, operator: ConditionOperator) {
  if (questionType === "NUMBER" || questionType === "DATE") {
    return (
      operator === "EQUALS" ||
      operator === "NOT_EQUALS" ||
      operator === "GREATER_THAN" ||
      operator === "LESS_THAN"
    );
  }

  if (questionType === "BOOLEAN") {
    return operator === "EQUALS" || operator === "NOT_EQUALS";
  }

  if (questionType === "SHORT_TEXT" || questionType === "LONG_TEXT") {
    return operator === "EQUALS" || operator === "NOT_EQUALS" || operator === "CONTAINS";
  }

  return operator === "EQUALS" || operator === "NOT_EQUALS";
}

type BackendSurveyOption = {
  id?: string;
  clientId?: string;
  optionClientId?: string;
  text?: string;
  optionText?: string;
  value?: string;
  orderNo?: number;
};

type BackendRepeatableTableColumn = {
  key?: string;
  label?: string;
  type?: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";
  required?: boolean;
};

type BackendGridAxisItem = {
  key?: string;
  label?: string;
};

type BackendQuestionConfig = {
  component?: "REPEATABLE_TABLE" | "GRID";
  minRows?: number;
  maxRows?: number;
  columns?: BackendRepeatableTableColumn[] | BackendGridAxisItem[];
  rows?: BackendGridAxisItem[];
  multipleSelection?: boolean;
};

type BackendSurveyQuestion = {
  id?: string;
  clientId?: string;
  questionText?: string;
  text?: string;
  questionType?: QuestionType;
  required?: boolean;
  isRequired?: boolean;
  orderNo?: number;
  options?: BackendSurveyOption[];
  questionConfig?: JsonQuestionConfig | BackendQuestionConfig | null;
  showConditions?: BackendSurveyCondition[];
  conditions?: BackendSurveyCondition[];
};

type BackendSurveySection = {
  id?: string;
  clientId?: string;
  title?: string;
  name?: string;
  description?: string;
  orderNo?: number;
  questions?: BackendSurveyQuestion[];
};

export type BackendSurveyRecord = {
  id?: string;
  title?: string;
  description?: string;
  targetType?: string;
  language?: string;
  isTranslation?: boolean;
  sections?: BackendSurveySection[];
};

export type CreateSurveyPayload = {
  title: string;
  description: string;
  targetType: string;
  language: "en" | "am";
  sections: Array<{
    title: string;
    description: string;
    orderNo: number;
    questions: Array<{
      clientId: string;
      questionText: string;
      questionType: QuestionType;
      isRequired: boolean;
      orderNo: number;
      options?: Array<{
        clientId: string;
        optionText: string;
        orderNo: number;
      }>;
      questionConfig?: {
        component: "REPEATABLE_TABLE" | "GRID";
        minRows?: number;
        maxRows?: number;
        columns?: Array<{ key: string; label: string; type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN"; required: boolean } | { key: string; label: string }>;
        rows?: Array<{ key: string; label: string }>;
        multipleSelection?: boolean;
      };
      showConditions?: Array<{
        parentQuestionClientId: string;
        operator: ConditionOperator;
        optionClientId?: string;
        expectedValue?: string;
        logicType: "AND" | "OR";
      }>;
    }>;
  }>;
};

function toCondition(condition: BackendSurveyCondition): ShowCondition | null {
  const parentQuestionClientId = condition.parentQuestionClientId ?? condition.parentQuestionId;
  const operator = condition.operator ?? "EQUALS";
  const logicType = condition.logicType ?? "AND";

  if (!parentQuestionClientId) {
    return null;
  }

  return {
    id: condition.id,
    parentQuestionClientId,
    operator,
    optionClientId: condition.optionClientId ?? condition.optionId,
    expectedValue:
      condition.expectedValue === undefined || condition.expectedValue === null
        ? undefined
        : String(condition.expectedValue),
    logicType,
  };
}

function normalizeQuestionConfig(
  questionConfig: BackendSurveyQuestion["questionConfig"]
): JsonQuestionConfig | undefined {
  if (!questionConfig) return undefined;

  const config = questionConfig as BackendQuestionConfig;
  const component = config.component;
  if (component === "REPEATABLE_TABLE") {
    const columns = (config.columns as BackendRepeatableTableColumn[] | undefined) ?? [];
    return {
      jsonType: "REPEATABLE_TABLE",
      minRows: Number(config.minRows ?? 0),
      maxRows: Number(config.maxRows ?? 10),
      columns: columns.map((column, index) => ({
        clientId: createClientId(),
        key: column.key,
        label: column.label ?? `Column ${index + 1}`,
        columnType: column.type ?? "TEXT",
        required: Boolean(column.required),
      })),
    };
  }

  if (component === "GRID") {
    const rows = (config.rows ?? []).map((row, index) => ({
      clientId: createClientId(),
      key: row.key,
      label: row.label ?? `Row ${index + 1}`,
    }));
    const columns = ((config.columns as BackendGridAxisItem[] | undefined) ?? []).map(
      (column, index) => ({
        clientId: createClientId(),
        key: column.key,
        label: column.label ?? `Column ${index + 1}`,
      })
    );
    return {
      jsonType: "GRID",
      selectionType: config.multipleSelection ? "MULTIPLE" : "SINGLE",
      rows,
      columns,
    };
  }

  // Backward compatibility with existing local format.
  const local = questionConfig as JsonQuestionConfig;
  if (local.jsonType === "REPEATABLE_TABLE" || local.jsonType === "GRID") {
    return local;
  }
  return undefined;
}

function toBackendQuestionConfig(config?: JsonQuestionConfig) {
  if (!config) return undefined;
  if (config.jsonType === "REPEATABLE_TABLE") {
    const minRows = Math.max(0, Number(config.minRows ?? 0));
    const maxRows = Math.max(minRows, Number(config.maxRows ?? minRows));
    return {
      component: "REPEATABLE_TABLE" as const,
      minRows,
      maxRows,
      columns: config.columns.map((column, index) => ({
        key: column.key?.trim() || `col_${index + 1}`,
        label: column.label.trim(),
        type: column.columnType,
        required: Boolean(column.required),
      })),
    };
  }

  return {
    component: "GRID" as const,
    multipleSelection: config.selectionType === "MULTIPLE",
    rows: config.rows.map((row, index) => ({
      key: row.key?.trim() || `row_${index + 1}`,
      label: row.label.trim(),
    })),
    columns: config.columns.map((column, index) => ({
      key: column.key?.trim() || `col_${index + 1}`,
      label: column.label.trim(),
    })),
  };
}

function normalizeQuestion(question: BackendSurveyQuestion, index: number): SurveyQuestion {
  const questionType = question.questionType ?? "SHORT_TEXT";
  const normalized = normalizeQuestionForType(
    {
      id: question.id,
      clientId: question.clientId ?? createClientId(),
      questionText: question.questionText ?? question.text ?? "",
      questionType,
      required: Boolean(question.required ?? question.isRequired),
      orderNo: question.orderNo ?? index + 1,
      options: (question.options ?? []).map((option, optionIndex) => ({
        id: option.id,
        clientId: option.clientId ?? option.optionClientId ?? createClientId(),
        text: option.text ?? option.optionText ?? "",
        value: option.value ?? "",
        orderNo: option.orderNo ?? optionIndex + 1,
      })),
      questionConfig: normalizeQuestionConfig(question.questionConfig),
      showConditions: (question.showConditions ?? question.conditions ?? [])
        .map(toCondition)
        .filter((item): item is ShowCondition => item !== null),
    },
    questionType
  );

  if (isChoiceType(normalized.questionType) && normalized.options.length === 0) {
    normalized.options = [createEmptyOption(1), createEmptyOption(2)];
  }

  return normalized;
}

export function normalizeSurveyResponse(record: BackendSurveyRecord): SurveyBuilderState {
  const language = (record.language ?? "en").toLowerCase() === "am" ? "am" : "en";
  const normalized: SurveyBuilderState = {
    id: record.id,
    title: record.title ?? "",
    description: record.description ?? "",
    targetType: record.targetType ?? "MEMBER",
    language,
    isTranslation: Boolean(record.isTranslation),
    sections: applyOrderNo(
      (record.sections ?? []).map((section, index) => ({
        id: section.id,
        clientId: section.clientId ?? createClientId(),
        title: section.title ?? section.name ?? `Section ${index + 1}`,
        description: section.description ?? "",
        orderNo: section.orderNo ?? index + 1,
        questions: applyOrderNo((section.questions ?? []).map(normalizeQuestion)),
      }))
    ),
  };

  const questionIdToClientId = new Map<string, string>();
  const optionIdToClientId = new Map<string, string>();

  for (const section of normalized.sections) {
    for (const question of section.questions) {
      if (question.id) {
        questionIdToClientId.set(question.id, question.clientId);
      }
      for (const option of question.options) {
        if (option.id) {
          optionIdToClientId.set(option.id, option.clientId);
        }
      }
    }
  }

  for (const section of normalized.sections) {
    for (const question of section.questions) {
      question.showConditions = question.showConditions.map((condition) => ({
        ...condition,
        parentQuestionClientId:
          questionIdToClientId.get(condition.parentQuestionClientId) ??
          condition.parentQuestionClientId,
        optionClientId: condition.optionClientId
          ? optionIdToClientId.get(condition.optionClientId) ?? condition.optionClientId
          : undefined,
      }));
    }
  }

  return normalized;
}

export function serializeSurveyPayload(state: SurveyBuilderState): CreateSurveyPayload {
  return {
    title: state.title.trim(),
    description: state.description.trim(),
    targetType: state.targetType,
    language: state.language,
    sections: applyOrderNo(state.sections).map((section) => ({
      title: section.title.trim(),
      description: section.description.trim(),
      orderNo: section.orderNo,
      questions: applyOrderNo(section.questions).map((question) => {
        const item = normalizeQuestionForType(question, question.questionType);
        return {
          clientId: item.clientId,
          questionText: item.questionText.trim(),
          questionType: item.questionType,
          isRequired: item.required,
          orderNo: item.orderNo,
          options: isChoiceType(item.questionType)
            ? applyOrderNo(item.options).map((option) => ({
                clientId: option.clientId,
                optionText: option.text.trim(),
                orderNo: option.orderNo,
              }))
            : undefined,
          questionConfig:
            isJsonType(item.questionType) && item.questionConfig
              ? toBackendQuestionConfig(item.questionConfig)
              : undefined,
          showConditions:
            item.showConditions.length > 0
              ? item.showConditions.map((condition, index) => ({
                  parentQuestionClientId: condition.parentQuestionClientId,
                  operator: condition.operator,
                  optionClientId: condition.optionClientId || undefined,
                  expectedValue: condition.expectedValue?.trim() || undefined,
                  logicType: index === 0 ? "AND" : condition.logicType,
                }))
              : undefined,
        };
      }),
    })),
  };
}

export type TranslateSurveyPayload = {
  language: "en" | "am";
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    questions: Array<{
      id: string;
      questionText: string;
      options: Array<{
        id: string;
        optionText: string;
      }>;
    }>;
  }>;
};

export function serializeSurveyTranslationPayload(state: SurveyBuilderState): TranslateSurveyPayload {
  return {
    language: state.language,
    title: state.title.trim(),
    description: state.description.trim(),
    sections: state.sections.map((section) => ({
      id: section.id ?? "",
      title: section.title.trim(),
      description: section.description.trim(),
      questions: section.questions.map((question) => ({
        id: question.id ?? "",
        questionText: question.questionText.trim(),
        options: question.options.map((option) => ({
          id: option.id ?? "",
          optionText: option.text.trim(),
        })),
      })),
    })),
  };
}

export function validateSurveyBuilderState(state: SurveyBuilderState): SurveyValidationIssue[] {
  const issues: SurveyValidationIssue[] = [];
  if (!state.title.trim()) {
    issues.push({ path: "title", message: "Survey title is required." });
  }
  if (!state.targetType.trim()) {
    issues.push({ path: "targetType", message: "Target type is required." });
  }
  if (!state.language) {
    issues.push({ path: "language", message: "Survey language is required." });
  }
  if (state.sections.length === 0) {
    issues.push({ path: "sections", message: "At least one section is required." });
  }

  const questionByClientId = new Map<string, SurveyQuestion>();
  for (const [sectionIndex, section] of state.sections.entries()) {
    if (!section.title.trim()) {
      issues.push({
        path: `sections.${sectionIndex}.title`,
        message: `Section ${sectionIndex + 1} title is required.`,
      });
    }
    if (section.questions.length === 0) {
      issues.push({
        path: `sections.${sectionIndex}.questions`,
        message: `Section ${sectionIndex + 1} needs at least one question.`,
      });
    }

    for (const [questionIndex, question] of section.questions.entries()) {
      questionByClientId.set(question.clientId, question);
      if (!question.questionText.trim()) {
        issues.push({
          path: `sections.${sectionIndex}.questions.${questionIndex}.questionText`,
          message: "Question text is required.",
        });
      }

      if (isChoiceType(question.questionType)) {
        if (question.options.length < 2) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.options`,
            message: "Choice questions require at least two options.",
          });
        }
        question.options.forEach((option, optionIndex) => {
          if (!option.text.trim()) {
            issues.push({
              path: `sections.${sectionIndex}.questions.${questionIndex}.options.${optionIndex}`,
              message: "Option text is required.",
            });
          }
        });
      }

      if (isJsonType(question.questionType)) {
        if (!question.questionConfig) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.questionConfig`,
            message: "JSON configuration is required for JSON question type.",
          });
        } else if (question.questionConfig.jsonType === "REPEATABLE_TABLE") {
          if (question.questionConfig.columns.length === 0) {
            issues.push({
              path: `sections.${sectionIndex}.questions.${questionIndex}.questionConfig.columns`,
              message: "Repeatable table requires at least one column.",
            });
          }
          if (question.questionConfig.maxRows < question.questionConfig.minRows) {
            issues.push({
              path: `sections.${sectionIndex}.questions.${questionIndex}.questionConfig.maxRows`,
              message: "Max rows must be greater than or equal to min rows.",
            });
          }
        } else if (
          question.questionConfig.rows.length === 0 ||
          question.questionConfig.columns.length === 0
        ) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.questionConfig`,
            message: "Grid requires at least one row and one column.",
          });
        }
      }
    }
  }

  for (const [sectionIndex, section] of state.sections.entries()) {
    for (const [questionIndex, question] of section.questions.entries()) {
      for (const [conditionIndex, condition] of question.showConditions.entries()) {
        const parentQuestion = questionByClientId.get(condition.parentQuestionClientId);
        if (!parentQuestion) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.showConditions.${conditionIndex}`,
            message: "Condition parent question does not exist.",
          });
          continue;
        }

        if (parentQuestion.clientId === question.clientId) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.showConditions.${conditionIndex}`,
            message: "Question cannot depend on itself.",
          });
        }

        if (!isOperatorAllowedForQuestionType(parentQuestion.questionType, condition.operator)) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.showConditions.${conditionIndex}.operator`,
            message: `Operator ${condition.operator} is not valid for ${parentQuestion.questionType}.`,
          });
        }

        if (isChoiceType(parentQuestion.questionType) && condition.optionClientId) {
          const optionExists = parentQuestion.options.some(
            (option) => option.clientId === condition.optionClientId
          );
          if (!optionExists) {
            issues.push({
              path: `sections.${sectionIndex}.questions.${questionIndex}.showConditions.${conditionIndex}`,
              message: "Condition option reference is invalid.",
            });
          }
        }

        if (isChoiceType(parentQuestion.questionType) && !condition.optionClientId) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.showConditions.${conditionIndex}.optionClientId`,
            message: "Condition option is required for choice parent questions.",
          });
        }

        if (
          !isChoiceType(parentQuestion.questionType) &&
          !(condition.expectedValue ?? "").trim()
        ) {
          issues.push({
            path: `sections.${sectionIndex}.questions.${questionIndex}.showConditions.${conditionIndex}.expectedValue`,
            message: "Condition expected value is required for non-choice parent questions.",
          });
        }
      }
    }
  }

  return issues;
}
