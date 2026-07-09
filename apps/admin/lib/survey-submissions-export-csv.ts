import {
  buildBaseDataCsv,
  type BaseDataCsvColumn,
} from "@/lib/base-data-csv";

export type SurveySubmissionsExportHeaders = {
  memberName: string;
  createdAt: string;
  updatedAt: string;
};

function csvStr(v: unknown): string {
  return v == null ? "" : String(v);
}

function formatSelectedOptions(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map((x) => String(x)).join("; ");
  return String(v);
}

function resolveAnswerValue(ans: Record<string, unknown>): string {
  if (ans.selectedOptions != null) {
    const formatted = formatSelectedOptions(ans.selectedOptions);
    if (formatted) return formatted;
  }
  if (ans.answerText != null && ans.answerText !== "") return String(ans.answerText);
  if (ans.answerNumber != null && ans.answerNumber !== "") return String(ans.answerNumber);
  if (ans.answerDate != null && ans.answerDate !== "") return String(ans.answerDate);
  if (ans.answerBoolean != null && ans.answerBoolean !== "") return String(ans.answerBoolean);
  if (ans.answerJson != null && ans.answerJson !== "") {
    try {
      return typeof ans.answerJson === "string" ? ans.answerJson : JSON.stringify(ans.answerJson);
    } catch {
      return String(ans.answerJson);
    }
  }
  return "";
}

/**
 * Builds a pivoted CSV: one row per submission, questions as columns.
 * Columns: ID, Member Name, Created At, Updated At, then one column per unique question.
 *
 * When `groupBySurvey` is true and data contains multiple surveys, an empty divider row
 * is inserted between each survey group.
 */
export function buildSurveySubmissionsExportCsv(
  apiData: Record<string, unknown>[],
  headers: SurveySubmissionsExportHeaders,
  options: { groupBySurvey?: boolean } = {}
): { csv: string; rowCount: number } {
  const questionColumns: string[] = [];
  const questionColumnSet = new Set<string>();

  for (const sub of apiData) {
    const answers = Array.isArray(sub.answers) ? (sub.answers as Record<string, unknown>[]) : [];
    for (const ans of answers) {
      const qText = csvStr(ans.questionText);
      if (qText && !questionColumnSet.has(qText)) {
        questionColumnSet.add(qText);
        questionColumns.push(qText);
      }
    }
  }

  const columns: BaseDataCsvColumn[] = [
    { header: headers.memberName, cell: (r) => csvStr(r._memberName) },
    { header: headers.createdAt, cell: (r) => csvStr(r._createdAt) },
    { header: headers.updatedAt, cell: (r) => csvStr(r._updatedAt) },
    ...questionColumns.map((qText): BaseDataCsvColumn => ({
      header: qText,
      cell: (r) => csvStr(r[`q__${qText}`]),
    })),
  ];

  const pivotedRows: Record<string, unknown>[] = [];
  let lastSurveyId: string | null = null;

  for (const sub of apiData) {
    if (options.groupBySurvey) {
      const sid = csvStr(sub.surveyId || sub.surveyTitle);
      if (lastSurveyId !== null && sid !== lastSurveyId) {
        const divider: Record<string, unknown> = { _memberName: "", _createdAt: "", _updatedAt: "" };
        pivotedRows.push(divider);
      }
      lastSurveyId = sid;
    }

    const row: Record<string, unknown> = {
      _memberName:
        sub.memberName ??
        sub.selfHelpGroupName ??
        sub.clusterName ??
        sub.targetName ??
        "",
      _createdAt: sub.createdAt ?? sub.startedAt ?? "",
      _updatedAt: sub.updatedAt ?? sub.submittedAt ?? "",
    };

    const answers = Array.isArray(sub.answers) ? (sub.answers as Record<string, unknown>[]) : [];
    for (const ans of answers) {
      const qText = csvStr(ans.questionText);
      if (qText) {
        row[`q__${qText}`] = resolveAnswerValue(ans);
      }
    }

    pivotedRows.push(row);
  }

  return {
    csv: buildBaseDataCsv(columns, pivotedRows),
    rowCount: pivotedRows.filter((r) => r._memberName !== "").length,
  };
}
