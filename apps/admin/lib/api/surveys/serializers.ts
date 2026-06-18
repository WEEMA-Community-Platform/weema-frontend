import {
  getValidConditionOperatorForQuestionType,
  toBackendQuestionConfig,
} from "@/lib/survey-builder/normalize";
import type { SectionSkipCondition, SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";

import type { CreateSectionPayload, UpsertQuestionPayload } from "@/lib/api/surveys";

export function serializeQuestionPayload(
  question: SurveyQuestion,
  options: {
    questionIdByClientId?: Map<string, string>;
    optionIdByClientId?: Map<string, string>;
    questionByClientId?: Map<string, SurveyQuestion>;
  } = {}
): UpsertQuestionPayload {
  const serializedOptions =
    question.options.length > 0
      ? question.options.map((option, index) => ({
          optionText: option.text.trim(),
          isExclusive: Boolean(option.isExclusive),
          clientId: option.clientId,
          orderNo: index + 1,
        }))
      : undefined;
  const serializedConditions =
    question.showConditions.length > 0
      ? question.showConditions.map((condition, index) => {
          const parentQuestion = options.questionByClientId?.get(
            condition.parentQuestionClientId
          );
          return {
            parentQuestionClientId: condition.parentQuestionClientId,
            parentQuestionId: options.questionIdByClientId?.get(condition.parentQuestionClientId),
            operator: parentQuestion
              ? getValidConditionOperatorForQuestionType(
                  parentQuestion.questionType,
                  condition.operator
                )
              : condition.operator,
            optionClientId: condition.optionClientId,
            optionId: condition.optionClientId
              ? options.optionIdByClientId?.get(condition.optionClientId)
              : undefined,
            expectedValue: condition.expectedValue?.trim() || undefined,
            logicType: index === 0 ? "AND" : condition.logicType,
          };
        })
      : undefined;

  return {
    questionText: question.questionText.trim(),
    questionType: question.questionType,
    isRequired: Boolean(question.required),
    options: serializedOptions,
    questionConfig: toBackendQuestionConfig(question.questionConfig),
    showConditions: serializedConditions,
    conditions: serializedConditions,
  };
}

export function serializeSectionSkipConditionsPayload(
  conditions: SectionSkipCondition[],
  options: {
    questionIdByClientId?: Map<string, string>;
    optionIdByClientId?: Map<string, string>;
    questionByClientId?: Map<string, SurveyQuestion>;
  } = {}
) {
  const payload = conditions.map((condition, index) => {
    const parentQuestion = options.questionByClientId?.get(condition.parentQuestionClientId);
    return {
      parentQuestionClientId: condition.parentQuestionClientId,
      parentQuestionId: options.questionIdByClientId?.get(condition.parentQuestionClientId),
      operator: parentQuestion
        ? getValidConditionOperatorForQuestionType(parentQuestion.questionType, condition.operator)
        : condition.operator,
      optionClientId: condition.optionClientId,
      optionId: condition.optionClientId
        ? options.optionIdByClientId?.get(condition.optionClientId)
        : undefined,
      expectedValue: condition.expectedValue?.trim() || undefined,
      logicType: index === 0 ? "AND" : condition.logicType,
    };
  });

  const missingParent = payload.find((item) => !item.parentQuestionId);
  if (missingParent) {
    throw new Error(
      "Section skip rules reference unsynced questions. Save questions first, then save section skip rules."
    );
  }

  return payload;
}

export function serializeSectionPayload(
  section: SurveySection,
  options: {
    questionIdByClientId?: Map<string, string>;
    optionIdByClientId?: Map<string, string>;
    questionByClientId?: Map<string, SurveyQuestion>;
  } = {}
): CreateSectionPayload[number] {
  const questionByClientId =
    options.questionByClientId ?? new Map(section.questions.map((question) => [question.clientId, question]));
  return {
    title: section.title.trim(),
    description: section.description.trim(),
    questions: section.questions.map((question) => ({
      clientId: question.clientId,
      ...serializeQuestionPayload(question, { ...options, questionByClientId }),
    })),
  };
}
