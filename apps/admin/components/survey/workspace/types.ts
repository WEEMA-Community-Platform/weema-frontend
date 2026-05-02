import type { SurveySubmissionAnswer } from "@/lib/api/surveys";
import type { JsonQuestionConfig, NumberQuestionConfig } from "@/lib/survey-builder/types";

export type WorkspaceQuestion = {
  key: string;
  answer?: SurveySubmissionAnswer;
  questionId?: string;
  questionText: string;
  questionType: string;
  questionConfig?: JsonQuestionConfig | NumberQuestionConfig;
  options: Array<{ id?: string; text: string; isExclusive?: boolean }>;
};

export type AnswerDraft = {
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
