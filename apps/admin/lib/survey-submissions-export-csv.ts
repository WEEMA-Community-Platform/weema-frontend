import {
  buildBaseDataCsv,
  type BaseDataCsvColumn,
} from "@/lib/base-data-csv";

export type SurveySubmissionsExportHeaders = {
  surveyTitle: string;
  targetType: string;
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
  sectionTitle: string;
  questionText: string;
  questionType: string;
  answerText: string;
  answerNumber: string;
  answerDate: string;
  answerBoolean: string;
  answerJson: string;
  selectedOptions: string;
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

function answerJsonCell(v: unknown): string {
  if (v == null || v === "") return "";
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** One row per answer; submissions with no answers produce a single row with empty answer columns. */
export function surveySubmissionsExportApiToRows(data: Record<string, unknown>[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const sub of data) {
    const answers = Array.isArray(sub.answers) ? (sub.answers as Record<string, unknown>[]) : [];
    const meta = {
      surveyTitle: sub.surveyTitle,
      targetType: sub.targetType,
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
    if (answers.length === 0) {
      out.push({
        ...meta,
        sectionTitle: "",
        questionText: "",
        questionType: "",
        answerText: "",
        answerNumber: "",
        answerDate: "",
        answerBoolean: "",
        answerJson: "",
        selectedOptions: "",
      });
    } else {
      for (const ans of answers) {
        out.push({
          ...meta,
          sectionTitle: ans.sectionTitle,
          questionText: ans.questionText,
          questionType: ans.questionType,
          answerText: ans.answerText,
          answerNumber: ans.answerNumber,
          answerDate: ans.answerDate,
          answerBoolean: ans.answerBoolean,
          answerJson: ans.answerJson,
          selectedOptions: formatSelectedOptions(ans.selectedOptions),
        });
      }
    }
  }
  return out;
}

export function surveySubmissionsExportColumns(
  h: SurveySubmissionsExportHeaders,
  yes: string,
  no: string
): BaseDataCsvColumn[] {
  return [
    { header: h.surveyTitle, cell: (r) => csvStr(r.surveyTitle) },
    { header: h.targetType, cell: (r) => csvStr(r.targetType) },
    { header: h.submissionStatus, cell: (r) => csvStr(r.submissionStatus) },
    { header: h.startedAt, cell: (r) => csvStr(r.startedAt) },
    { header: h.submittedAt, cell: (r) => csvStr(r.submittedAt) },
    { header: h.memberName, cell: (r) => csvStr(r.memberName) },
    { header: h.memberPhone, cell: (r) => csvStr(r.memberPhone) },
    { header: h.memberFan, cell: (r) => csvStr(r.memberFan) },
    { header: h.selfHelpGroupName, cell: (r) => csvStr(r.selfHelpGroupName) },
    { header: h.clusterName, cell: (r) => csvStr(r.clusterName) },
    { header: h.federationName, cell: (r) => csvStr(r.federationName) },
    { header: h.locked, cell: (r) => csvBool(r.locked, yes, no) },
    { header: h.sectionTitle, cell: (r) => csvStr(r.sectionTitle) },
    { header: h.questionText, cell: (r) => csvStr(r.questionText) },
    { header: h.questionType, cell: (r) => csvStr(r.questionType) },
    { header: h.answerText, cell: (r) => csvStr(r.answerText) },
    { header: h.answerNumber, cell: (r) => csvStr(r.answerNumber) },
    { header: h.answerDate, cell: (r) => csvStr(r.answerDate) },
    { header: h.answerBoolean, cell: (r) => csvStr(r.answerBoolean) },
    { header: h.answerJson, cell: (r) => answerJsonCell(r.answerJson) },
    { header: h.selectedOptions, cell: (r) => csvStr(r.selectedOptions) },
  ];
}

export function buildSurveySubmissionsExportCsv(
  apiData: Record<string, unknown>[],
  headers: SurveySubmissionsExportHeaders,
  yes: string,
  no: string
): { csv: string; rowCount: number } {
  const rows = surveySubmissionsExportApiToRows(apiData);
  return {
    csv: buildBaseDataCsv(surveySubmissionsExportColumns(headers, yes, no), rows),
    rowCount: rows.length,
  };
}
