import type { BaseApiResponse } from "@/lib/api/base-data";

export function buildQueryString(query: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as (T & { message?: string }) | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}

export type SurveyListRow = {
  id: string;
  title: string;
  description: string;
  targetType: string;
  status?: string;
  version?: number;
  isActive?: boolean;
  totalSections?: number;
  totalQuestions?: number;
  language?: "en" | "am" | string;
  parentSurveyId?: string | null;
  isTranslation?: boolean;
  isClone?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function normalizeSurveyListItem<T extends SurveyListRow>(row: T) {
  return {
    ...row,
    isTranslation: Boolean(row.isTranslation),
  };
}

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
  memberId: string | null;
  memberName: string | null;
  selfHelpGroupId?: string | null;
  selfHelpGroupName?: string | null;
  clusterId?: string | null;
  clusterName?: string | null;
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

export function normalizeSurveySubmissionFromSurveyListApi(
  raw: Record<string, unknown>,
  surveyId: string
): SurveySubmissionRecord {
  const selfHelpGroupId = (raw.selfHelpGroupId as string | null | undefined) ?? null;
  const memberId = (raw.memberId as string | null | undefined) ?? null;
  const isShgRow = Boolean(selfHelpGroupId);
  const assignTargetId = isShgRow ? selfHelpGroupId : memberId;
  const assignTargetName = isShgRow
    ? ((raw.selfHelpGroupName as string | null | undefined) ?? null)
    : ((raw.memberName as string | null | undefined) ?? null);

  return {
    id: String(raw.id ?? ""),
    surveyAssignmentId: String(raw.surveyAssignmentId ?? ""),
    surveyId: String(raw.surveyId ?? surveyId),
    surveyTitle: String(raw.surveyTitle ?? ""),
    memberId,
    memberName: (raw.memberName as string | null | undefined) ?? null,
    selfHelpGroupId,
    selfHelpGroupName: (raw.selfHelpGroupName as string | null | undefined) ?? null,
    clusterId: (raw.clusterId as string | null | undefined) ?? null,
    clusterName: (raw.clusterName as string | null | undefined) ?? null,
    submissionStatus: (raw.submissionStatus as SubmissionStatus) ?? "NOT_STARTED",
    startedAt: (raw.startedAt as string | null | undefined) ?? null,
    submittedAt: (raw.submittedAt as string | null | undefined) ?? null,
    totalQuestions: Number(raw.totalQuestions ?? 0),
    answeredQuestions: Number(raw.answeredQuestions ?? 0),
    answers: Array.isArray(raw.answers) ? (raw.answers as SurveySubmissionAnswer[]) : [],
    locked: raw.locked as boolean | undefined,
    targetId: (raw.targetId as string | undefined) ?? assignTargetId ?? undefined,
    targetName: (raw.targetName as string | undefined) ?? assignTargetName ?? undefined,
    targetType:
      (raw.targetType as string | undefined) ??
      (isShgRow ? "SELF_HELP_GROUP" : memberId ? "MEMBER" : undefined),
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

export type SurveyExportDetailResponse = BaseApiResponse & {
  data: Record<string, unknown>;
};

export async function parseExportSurveyDetailResponse(
  response: Response
): Promise<SurveyExportDetailResponse> {
  const payload = (await response.json().catch(() => null)) as
    | (BaseApiResponse & { data?: unknown })
    | null;

  if (
    !response.ok ||
    !payload ||
    payload.data == null ||
    typeof payload.data !== "object" ||
    Array.isArray(payload.data)
  ) {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Request failed"
    );
  }

  return payload as SurveyExportDetailResponse;
}
