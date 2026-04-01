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
  questionConfig?: JsonQuestionConfig;
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
  sections: SurveySection[];
};

export type SurveyValidationIssue = {
  path: string;
  message: string;
};
