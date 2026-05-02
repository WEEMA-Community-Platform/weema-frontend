import { toBackendQuestionConfig } from "@/lib/survey-builder/normalize";
import type { SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";

import type { CreateSectionPayload, UpsertQuestionPayload } from "@/lib/api/surveys";

export function serializeQuestionPayload(
  question: SurveyQuestion,
  options: {
    questionIdByClientId?: Map<string, string>;
    optionIdByClientId?: Map<string, string>;
  } = {}
): UpsertQuestionPayload {
  const serializedOptions =
    question.options.length > 0
      ? question.options.map((option, index) => ({
          optionText: option.text.trim(),
          clientId: option.clientId,
          orderNo: index + 1,
        }))
      : undefined;

  return {
    questionText: question.questionText.trim(),
    questionType: question.questionType,
    isRequired: Boolean(question.required),
    options: serializedOptions,
    questionConfig: toBackendQuestionConfig(question.questionConfig),
    showConditions:
      question.showConditions.length > 0
        ? question.showConditions.map((condition, index) => ({
            parentQuestionClientId: condition.parentQuestionClientId,
            parentQuestionId: options.questionIdByClientId?.get(condition.parentQuestionClientId),
            operator: condition.operator,
            optionClientId: condition.optionClientId,
            optionId: condition.optionClientId
              ? options.optionIdByClientId?.get(condition.optionClientId)
              : undefined,
            expectedValue: condition.expectedValue?.trim() || undefined,
            logicType: index === 0 ? "AND" : condition.logicType,
          }))
        : undefined,
  };
}

export function serializeSectionPayload(
  section: SurveySection,
  options: {
    questionIdByClientId?: Map<string, string>;
    optionIdByClientId?: Map<string, string>;
  } = {}
): CreateSectionPayload[number] {
  return {
    title: section.title.trim(),
    description: section.description.trim(),
    questions: section.questions.map((question) => ({
      clientId: question.clientId,
      ...serializeQuestionPayload(question, options),
    })),
  };
}
