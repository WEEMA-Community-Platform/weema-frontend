import {
  buildBaseDataCsv,
  type BaseDataCsvColumn,
} from "@/lib/base-data-csv";

export type SurveySubmissionsExportHeaders = {
  surveyTitle: string;
  submissionStatus: string;
  startedAt: string;
  submittedAt: string;
  memberName: string;
  memberPhone: string;
  memberFan: string;
  selfHelpGroupName: string;
  clusterName: string;
  federationName: string;
  locked: string;
};

function csvStr(v: unknown): string {
  return v == null ? "" : String(v);
}

function csvBool(v: unknown, yes: string, no: string): string {
  if (v === true || v === "true") return yes;
  if (v === false || v === "false") return no;
  return "";
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
 * Columns: metadata fields first, then one column per unique question (ordered by first appearance).
 */
export function buildSurveySubmissionsExportCsv(
  apiData: Record<string, unknown>[],
  headers: SurveySubmissionsExportHeaders,
  yes: string,
  no: string
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

  const pivotedRows: Record<string, unknown>[] = [];

  for (const sub of apiData) {
    const row: Record<string, unknown> = {
      surveyTitle: sub.surveyTitle,
      submissionStatus: sub.submissionStatus,
      startedAt: sub.startedAt,
      submittedAt: sub.submittedAt,
      memberName: sub.memberName,
      memberPhone: sub.memberPhone,
      memberFan: sub.memberFan,
      selfHelpGroupName: sub.selfHelpGroupName,
      clusterName: sub.clusterName,
      federationName: sub.federationName,
      locked: sub.locked,
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

  const columns: BaseDataCsvColumn[] = [
    { header: headers.surveyTitle, cell: (r) => csvStr(r.surveyTitle) },
    { header: headers.submissionStatus, cell: (r) => csvStr(r.submissionStatus) },
    { header: headers.startedAt, cell: (r) => csvStr(r.startedAt) },
    { header: headers.submittedAt, cell: (r) => csvStr(r.submittedAt) },
    { header: headers.memberName, cell: (r) => csvStr(r.memberName) },
    { header: headers.memberPhone, cell: (r) => csvStr(r.memberPhone) },
    { header: headers.memberFan, cell: (r) => csvStr(r.memberFan) },
    { header: headers.selfHelpGroupName, cell: (r) => csvStr(r.selfHelpGroupName) },
    { header: headers.clusterName, cell: (r) => csvStr(r.clusterName) },
    { header: headers.federationName, cell: (r) => csvStr(r.federationName) },
    { header: headers.locked, cell: (r) => csvBool(r.locked, yes, no) },
    ...questionColumns.map((qText): BaseDataCsvColumn => ({
      header: qText,
      cell: (r) => csvStr(r[`q__${qText}`]),
    })),
  ];

  return {
    csv: buildBaseDataCsv(columns, pivotedRows),
    rowCount: pivotedRows.length,
  };
}
