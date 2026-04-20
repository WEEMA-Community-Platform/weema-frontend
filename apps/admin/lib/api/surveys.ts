import type { BaseApiResponse } from "@/lib/api/base-data";
import type {
  BackendSurveyRecord,
  CreateSurveyPayload,
} from "@/lib/survey-builder/normalize";
import type { QuestionType, SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";

export type SurveysListQuery = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: string;
  targetType?: string;
  isActive?: boolean;
  targetId?: string;
};

export type SurveyListItem = {
  id: string;
  title: string;
  description: string;
  targetType: string;
  status?: string;
  version?: number;
  isActive?: boolean;
  totalSections?: number;
  totalQuestions?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SurveysListResponse = BaseApiResponse & {
  surveys: SurveyListItem[];
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalElements: number;
};

export type SurveyDetailResponse = BaseApiResponse & {
  survey: BackendSurveyRecord;
};

export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | string;

export type SubmissionSelectedOption = {
  optionId: string;
  optionText: string;
};

export type SurveySubmissionAnswer = {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  answerText: string | null;
  answerNumber: number | null;
  answerDate: string | null;
  answerBoolean: boolean | null;
  answerJson: unknown;
  selectedOptions: SubmissionSelectedOption[];
  createdAt?: string;
  updatedAt?: string;
};

export type SurveySubmissionRecord = {
  id: string;
  surveyAssignmentId: string;
  surveyId: string;
  surveyTitle: string;
  memberId: string;
  memberName: string;
  submissionStatus: SubmissionStatus;
  startedAt: string | null;
  submittedAt: string | null;
  totalQuestions: number;
  answeredQuestions: number;
  answers: SurveySubmissionAnswer[];
  locked?: boolean;
  targetId?: string;
  targetName?: string;
  targetType?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SurveySubmissionsBySurveyResponse = BaseApiResponse & {
  submissions: SurveySubmissionRecord[];
};

export type SurveyPendingTargetsResponse = BaseApiResponse & {
  submissions: SurveySubmissionRecord[];
};

type SurveyPendingTargetRow = {
  targetId: string;
  targetName: string;
  targetType: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  location?: string | null;
  contactInfo?: string | null;
  status?: string | null;
};

export type SurveySubmissionDetailResponse = BaseApiResponse & {
  submission: SurveySubmissionRecord | null;
};


export type UpsertSubmissionAnswerPayload = {
  questionId: string;
  answerText?: string;
  answerNumber?: number;
  answerDate?: string;
  answerBoolean?: boolean;
  answerJson?: unknown;
  selectedOptionIds?: string[];
};

export type StartSurveySubmissionPayload = {
  surveyId: string;
  targetId: string;
};

export type UpdateSurveyPayload = {
  title: string;
  description: string;
  targetType: string;
};

export type UpsertQuestionPayload = {
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  options?: Array<{
    optionText: string;
    clientId: string;
    orderNo: number;
  }>;
  questionConfig?: {
    component: "REPEATABLE_TABLE" | "GRID";
    minRows?: number;
    maxRows?: number;
    columns?: Array<
      | { key: string; label: string; type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN"; required: boolean }
      | { key: string; label: string }
    >;
    rows?: Array<{ key: string; label: string }>;
    multipleSelection?: boolean;
  };
  showConditions?: Array<{
    parentQuestionClientId: string;
    parentQuestionId?: string;
    operator: string;
    optionClientId?: string;
    optionId?: string;
    expectedValue?: string;
    logicType: "AND" | "OR";
  }>;
};

export type CreateSectionPayload = Array<{
  title: string;
  description: string;
  questions: Array<UpsertQuestionPayload & { clientId: string }>;
}>;

function buildQueryString(query: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}

export async function getSurveys(query: SurveysListQuery = {}): Promise<SurveysListResponse> {
  const qs = buildQueryString({
    page: query.page ?? 1,
    "page-size": query.pageSize ?? 10,
    "search-query": query.searchQuery,
    status: query.status,
    "target-type": query.targetType,
    "is-active": query.isActive === undefined ? undefined : String(query.isActive),
    "target-id": query.targetId,
  });
  const response = await fetch(`/api/survey?${qs}`, { cache: "no-store" });
  const payload = await parseResponse<SurveysListResponse | (BaseApiResponse & { data?: SurveyListItem[] })>(
    response
  );

  if ("surveys" in payload && Array.isArray(payload.surveys)) {
    return payload as SurveysListResponse;
  }

  const dataRows = Array.isArray((payload as { data?: unknown[] }).data)
    ? ((payload as { data: SurveyListItem[] }).data ?? [])
    : [];

  return {
    message: payload.message,
    statusCode: payload.statusCode,
    surveys: dataRows,
    totalPages: 1,
    pageSize: dataRows.length,
    currentPage: 1,
    totalElements: dataRows.length,
  };
}

export async function getSurveyById(id: string): Promise<SurveyDetailResponse> {
  const response = await fetch(`/api/survey/${id}`, { cache: "no-store" });
  const payload = await parseResponse<SurveyDetailResponse | (BaseApiResponse & { data?: BackendSurveyRecord })>(
    response
  );
  if ("survey" in payload && payload.survey) {
    return payload as SurveyDetailResponse;
  }
  return {
    message: payload.message,
    statusCode: payload.statusCode,
    survey: (payload as { data?: BackendSurveyRecord }).data ?? {},
  };
}

export async function createSurvey(payload: CreateSurveyPayload): Promise<BaseApiResponse> {
  const response = await fetch("/api/survey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateSurvey(id: string, payload: UpdateSurveyPayload): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteSurvey(id: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function publishSurvey(id: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey/${id}/publish`, {
    method: "POST",
  });
  return parseResponse<BaseApiResponse>(response);
}

export type CloneSurveyPayload = {
  title: string;
  description: string;
};

export async function cloneSurvey(id: string, payload: CloneSurveyPayload): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey/${id}/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

/** Single row from GET /api/survey/{id}/assignment-targets (assigned or available). */
export type SurveyAssignmentTargetRow = {
  id: string;
  assignmentId: string | null;
  name: string;
  description: string | null;
  type: string;
  locked?: boolean;
};

export type SurveyAssignmentData = {
  assignedTargets: SurveyAssignmentTargetRow[] | null;
  availableTargets: SurveyAssignmentTargetRow[] | null;
  assignedClusters?: SurveyAssignmentTargetRow[] | null;
  assignedSelfHelpGroups?: SurveyAssignmentTargetRow[] | null;
  availableClusters?: SurveyAssignmentTargetRow[] | null;
  availableSelfHelpGroups?: SurveyAssignmentTargetRow[] | null;
};

export type SurveyAssignmentTargetsResponse = BaseApiResponse & {
  assignmentData: SurveyAssignmentData;
};

export type SurveyAssignmentTargetsQuery = {
  search?: string;
  facilitatorId?: string;
};

export async function getSurveyAssignmentTargets(
  surveyId: string,
  query: SurveyAssignmentTargetsQuery = {}
): Promise<SurveyAssignmentTargetsResponse> {
  const qs = buildQueryString({
    search: query.search?.trim() || undefined,
    "facilitator-id": query.facilitatorId,
  });
  const response = await fetch(
    `/api/survey/${surveyId}/assignment-targets${qs ? `?${qs}` : ""}`,
    {
    cache: "no-store",
    }
  );
  return parseResponse<SurveyAssignmentTargetsResponse>(response);
}

export async function assignSurveyTargets(
  surveyId: string,
  targetIds: string[]
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey/${surveyId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetIds }),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function unassignSurveyTargets(
  surveyId: string,
  targetIds: string[]
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey/${surveyId}/un-assign`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetIds }),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getSurveyPendingTargetsBySurveyId(
  surveyId: string
): Promise<SurveyPendingTargetsResponse> {
  const response = await fetch(`/api/survey-submissions/survey/${surveyId}/pending-targets`, {
    cache: "no-store",
  });
  const payload = await parseResponse<
    | SurveyPendingTargetsResponse
    | (BaseApiResponse & { targets?: SurveySubmissionRecord[]; data?: SurveySubmissionRecord[] })
  >(response);
  if ("submissions" in payload && Array.isArray(payload.submissions)) {
    return payload as SurveyPendingTargetsResponse;
  }

  const rows = Array.isArray((payload as { targets?: unknown[] }).targets)
    ? ((payload as { targets: SurveyPendingTargetRow[] }).targets ?? [])
    : Array.isArray((payload as { data?: unknown[] }).data)
      ? ((payload as { data: SurveyPendingTargetRow[] }).data ?? [])
      : [];

  const mapped: SurveySubmissionRecord[] = rows.map((row) => ({
    id: "",
    surveyAssignmentId: row.assigneeId ?? "",
    surveyId,
    surveyTitle: "",
    memberId: row.targetId,
    memberName: row.targetName,
    submissionStatus: "NOT_STARTED",
    startedAt: null,
    submittedAt: null,
    totalQuestions: 0,
    answeredQuestions: 0,
    answers: [],
    targetId: row.targetId,
    targetName: row.targetName,
    targetType: row.targetType,
    createdAt: undefined,
    updatedAt: undefined,
  }));

  return {
    message: payload.message,
    statusCode: payload.statusCode,
    submissions: mapped,
  };
}

export async function startSurveySubmission(
  payload: StartSurveySubmissionPayload
): Promise<SurveySubmissionRecord> {
  const response = await fetch("/api/survey-submissions/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const parsed = await parseResponse<
    | (BaseApiResponse & { submission?: SurveySubmissionRecord | null; data?: SurveySubmissionRecord | null })
    | SurveySubmissionRecord
  >(response);

  if ("id" in parsed && typeof parsed.id === "string") {
    return parsed as SurveySubmissionRecord;
  }

  const wrapped = parsed as BaseApiResponse & {
    submission?: SurveySubmissionRecord | null;
    data?: SurveySubmissionRecord | null;
  };
  const submission = wrapped.submission ?? wrapped.data;
  if (!submission?.id) {
    throw new Error(wrapped.message || "Could not start submission");
  }
  return submission;
}

export async function getSurveySubmissionsBySurveyId(
  surveyId: string
): Promise<SurveySubmissionsBySurveyResponse> {
  return getSurveyPendingTargetsBySurveyId(surveyId);
}

export type SurveySubmissionsByAssignmentResponse = BaseApiResponse & {
  submissions: SurveySubmissionRecord[];
};

export async function getSurveySubmissionsByAssignmentId(
  assignmentId: string
): Promise<SurveySubmissionsByAssignmentResponse> {
  const response = await fetch(`/api/survey-submissions/assignment/${assignmentId}`, {
    cache: "no-store",
  });
  const payload = await parseResponse<
    SurveySubmissionsByAssignmentResponse | (BaseApiResponse & { data?: SurveySubmissionRecord[] })
  >(response);
  if ("submissions" in payload && Array.isArray(payload.submissions)) {
    return payload as SurveySubmissionsByAssignmentResponse;
  }
  return {
    message: payload.message,
    statusCode: payload.statusCode,
    submissions: Array.isArray((payload as { data?: unknown[] }).data)
      ? ((payload as { data: SurveySubmissionRecord[] }).data ?? [])
      : [],
  };
}

export async function lockSurveyAssignment(assignmentId: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/assignments/${assignmentId}/lock`, {
    method: "PATCH",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function unlockSurveyAssignment(assignmentId: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/assignments/${assignmentId}/unlock`, {
    method: "PATCH",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function lockSurveySubmission(submissionId: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/${submissionId}/lock`, {
    method: "PATCH",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function unlockSurveySubmission(submissionId: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/${submissionId}/unlock`, {
    method: "PATCH",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function getSurveySubmissionById(
  submissionId: string
): Promise<SurveySubmissionDetailResponse> {
  const response = await fetch(`/api/survey-submissions/${submissionId}`, {
    cache: "no-store",
  });
  const payload = await parseResponse<
    SurveySubmissionDetailResponse | (BaseApiResponse & { data?: SurveySubmissionRecord | null })
  >(response);
  if ("submission" in payload) {
    return payload as SurveySubmissionDetailResponse;
  }

  return {
    message: payload.message,
    statusCode: payload.statusCode,
    submission: (payload as { data?: SurveySubmissionRecord | null }).data ?? null,
  };
}

export async function saveSurveySubmissionAnswer(
  submissionId: string,
  payload: UpsertSubmissionAnswerPayload
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/${submissionId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateSurveySubmissionAnswer(
  submissionId: string,
  answerId: string,
  payload: UpsertSubmissionAnswerPayload
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/${submissionId}/answers/${answerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function submitSurveySubmission(submissionId: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-submissions/${submissionId}/submit`, {
    method: "POST",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function createSurveySections(
  surveyId: string,
  payload: CreateSectionPayload
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-section/survey/${surveyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateSurveySection(
  id: string,
  payload: { title: string; description: string }
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-section/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteSurveySection(id: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/survey-section/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function reorderSurveySections(sectionIds: string[]): Promise<BaseApiResponse> {
  const response = await fetch("/api/survey-section/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionIds }),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function createQuestions(
  sectionId: string,
  payload: UpsertQuestionPayload[]
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/question/section/${sectionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function updateQuestion(
  id: string,
  payload: UpsertQuestionPayload
): Promise<BaseApiResponse> {
  const response = await fetch(`/api/question/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function deleteQuestion(id: string): Promise<BaseApiResponse> {
  const response = await fetch(`/api/question/${id}`, {
    method: "DELETE",
  });
  return parseResponse<BaseApiResponse>(response);
}

export async function reorderQuestions(questionIds: string[]): Promise<BaseApiResponse> {
  const response = await fetch("/api/question/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionIds }),
  });
  return parseResponse<BaseApiResponse>(response);
}

function toBackendQuestionConfig(questionConfig: SurveyQuestion["questionConfig"]) {
  if (!questionConfig) return undefined;
  if (questionConfig.jsonType === "REPEATABLE_TABLE") {
    const minRows = Math.max(0, Number(questionConfig.minRows ?? 0));
    const maxRows = Math.max(minRows, Number(questionConfig.maxRows ?? minRows));
    return {
      component: "REPEATABLE_TABLE" as const,
      minRows,
      maxRows,
      columns: questionConfig.columns.map((column, index) => ({
        key: column.key?.trim() || `col_${index + 1}`,
        label: column.label.trim(),
        type: column.columnType,
        required: Boolean(column.required),
      })),
    };
  }

  return {
    component: "GRID" as const,
    multipleSelection: questionConfig.selectionType === "MULTIPLE",
    rows: questionConfig.rows.map((row, index) => ({
      key: row.key?.trim() || `row_${index + 1}`,
      label: row.label.trim(),
    })),
    columns: questionConfig.columns.map((column, index) => ({
      key: column.key?.trim() || `col_${index + 1}`,
      label: column.label.trim(),
    })),
  };
}

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
        ? question.showConditions.map((condition) => ({
            parentQuestionClientId: condition.parentQuestionClientId,
            parentQuestionId: options.questionIdByClientId?.get(
              condition.parentQuestionClientId
            ),
            operator: condition.operator,
            optionClientId: condition.optionClientId,
            optionId: condition.optionClientId
              ? options.optionIdByClientId?.get(condition.optionClientId)
              : undefined,
            expectedValue: condition.expectedValue?.trim() || undefined,
            logicType: condition.logicType,
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
