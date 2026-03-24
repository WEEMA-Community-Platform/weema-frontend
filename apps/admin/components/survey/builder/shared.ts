import type { ShowCondition, SurveyQuestion } from "@/lib/survey-builder/types";

export type SurveyQuestionWithContext = SurveyQuestion & {
  sectionClientId: string;
  sectionTitle: string;
};

export const OPERATOR_OPTIONS: Array<{ value: ShowCondition["operator"]; label: string }> = [
  { value: "EQUALS", label: "Equals" },
  { value: "NOT_EQUALS", label: "Does not equal" },
  { value: "GREATER_THAN", label: "Greater than" },
  { value: "LESS_THAN", label: "Less than" },
  { value: "CONTAINS", label: "Contains" },
];

export function getOperatorLabel(operator: ShowCondition["operator"]) {
  return OPERATOR_OPTIONS.find((item) => item.value === operator)?.label ?? operator;
}

export const LOGIC_TYPE_OPTIONS: Array<{ value: ShowCondition["logicType"]; label: string }> = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];

export function getQuestionText(question: SurveyQuestion | undefined) {
  if (!question) return "Unknown question";
  return question.questionText || "Untitled question";
}

export function describeCondition(
  condition: ShowCondition,
  questionByClientId: Map<string, SurveyQuestion>
) {
  const parent = questionByClientId.get(condition.parentQuestionClientId);
  const option =
    condition.optionClientId && parent
      ? parent.options.find((item) => item.clientId === condition.optionClientId)
      : null;
  const expected = option?.text || condition.expectedValue || "";
  return `${getQuestionText(parent)} ${getOperatorLabel(condition.operator)} ${expected}`.trim();
}

export function getQuestionParentId(question: SurveyQuestion, sectionQuestionIds: Set<string>) {
  return (
    question.showConditions
      .map((condition) => condition.parentQuestionClientId)
      .find((parentId) => sectionQuestionIds.has(parentId)) ?? null
  );
}
