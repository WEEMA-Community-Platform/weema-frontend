export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "DATE"
  | "BOOLEAN"
  | "JSON";

export type JsonQuestionType = "REPEATABLE_TABLE" | "GRID";

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "CONTAINS"

export type ConditionLogicType = "AND" | "OR";

export type GridSelectionType = "SINGLE" | "MULTIPLE";

export type RepeatableTableColumnType = "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";

export type RepeatableTableColumn = {
  clientId: string;
  key?: string;
  label: string;
  columnType: RepeatableTableColumnType;
  required: boolean;
};

export type GridAxisItem = {
  clientId: string;
  key?: string;
  label: string;
};

export type RepeatableTableQuestionConfig = {
  jsonType: "REPEATABLE_TABLE";
  minRows: number;
  maxRows: number;
  columns: RepeatableTableColumn[];
};

export type GridQuestionConfig = {
  jsonType: "GRID";
  selectionType: GridSelectionType;
  rows: GridAxisItem[];
  columns: GridAxisItem[];
};

export type JsonQuestionConfig = RepeatableTableQuestionConfig | GridQuestionConfig;

/** Min/max value bounds for NUMBER question type (stored as questionConfig, same API shape as JSON components). */
export type NumberQuestionConfig = {
  configType: "NUMBER";
  minValue?: number;
  maxValue?: number;
};

export function isJsonQuestionConfig(
  config: JsonQuestionConfig | NumberQuestionConfig | undefined
): config is JsonQuestionConfig {
  return config !== undefined && "jsonType" in config;
}

export function isNumberQuestionConfig(
  config: JsonQuestionConfig | NumberQuestionConfig | undefined
): config is NumberQuestionConfig {
  return config !== undefined && "configType" in config && config.configType === "NUMBER";
}

export type SurveyOption = {
  id?: string;
  clientId: string;
  text: string;
  value?: string;
  orderNo: number;
};

export type ShowCondition = {
  id?: string;
  parentQuestionClientId: string;
  operator: ConditionOperator;
  optionClientId?: string;
  expectedValue?: string;
  logicType: ConditionLogicType;
};

export type SurveyQuestion = {
  id?: string;
  clientId: string;
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  orderNo: number;
  options: SurveyOption[];
  questionConfig?: JsonQuestionConfig | NumberQuestionConfig;
  showConditions: ShowCondition[];
};

export type SurveySection = {
  id?: string;
  clientId: string;
  title: string;
  description: string;
  orderNo: number;
  questions: SurveyQuestion[];
};

export type SurveyBuilderState = {
  id?: string;
  title: string;
  description: string;
  targetType: string;
  language: "en" | "am";
  isTranslation: boolean;
  sections: SurveySection[];
};

export type SurveyValidationIssue = {
  path: string;
  message: string;
};
