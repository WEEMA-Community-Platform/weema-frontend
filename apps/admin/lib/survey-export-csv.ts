import {
  buildBaseDataCsv,
  type BaseDataCsvColumn,
} from "@/lib/base-data-csv";

/** Human-readable choice / option list from various API shapes (strings or objects). */
export function formatSurveyExportOptions(options: unknown): string {
  if (options == null) return "";
  if (!Array.isArray(options)) {
    try {
      return JSON.stringify(options);
    } catch {
      return String(options);
    }
  }
  if (options.length === 0) return "";
  return options
    .map((item, i) => {
      const n = i + 1;
      if (typeof item === "string") return `${n}. ${item}`;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const text =
          o.optionText ?? o.text ?? o.label ?? o.value ?? o.name;
        if (text != null && text !== "") return `${n}. ${String(text)}`;
        return `${n}. ${JSON.stringify(item)}`;
      }
      return `${n}. ${String(item)}`;
    })
    .join(" | ");
}

function jsonCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Extra configuration (NUMBER bounds, JSON table/grid, or any backend-specific fields). */
export function formatSurveyQuestionConfiguration(q: Record<string, unknown>): string {
  const cfg =
    q.questionConfig ??
    q.question_config ??
    q.numberConfig ??
    q.number_config;
  if (cfg != null) return jsonCell(cfg);

  const parts: string[] = [];
  const minV = q.minValue ?? q.min_value;
  const maxV = q.maxValue ?? q.max_value;
  if (minV !== undefined && minV !== null) parts.push(`min: ${minV}`);
  if (maxV !== undefined && maxV !== null) parts.push(`max: ${maxV}`);
  const jt = q.jsonType ?? q.json_type;
  if (jt != null && jt !== "") parts.push(`jsonType: ${jt}`);

  const extraKeys = ["selectionType", "minRows", "maxRows", "rows", "columns"] as const;
  for (const k of extraKeys) {
    if (k in q && q[k] != null) {
      parts.push(`${k}: ${jsonCell(q[k])}`);
    }
  }

  return parts.join("; ");
}

export function formatSurveyQuestionConditions(q: Record<string, unknown>): string {
  const c = q.showConditions ?? q.show_conditions;
  if (!Array.isArray(c) || c.length === 0) return "";
  return jsonCell(c);
}

function questionBool(
  q: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const k of keys) {
    if (k in q) return q[k];
  }
  return undefined;
}

export type SurveyDetailCsvLabels = {
  sectionOverview: string;
  sectionQuestions: string;
  colField: string;
  colValue: string;
  lblTitle: string;
  lblDescription: string;
  lblTargetType: string;
  lblStatus: string;
  lblVersion: string;
  lblLanguage: string;
  lblCreatedAt: string;
  lblUpdatedAt: string;
  colSectionTitle: string;
  colSectionOrder: string;
  colQuestionOrder: string;
  colQuestionText: string;
  colQuestionType: string;
  colRequired: string;
  colEnabled: string;
  colOptions: string;
  colConfiguration: string;
  colConditions: string;
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function formatYesNo(v: unknown, yes: string, no: string): string {
  if (v === true || v === "true" || v === 1) return yes;
  if (v === false || v === "false" || v === 0) return no;
  return "";
}

/**
 * Two-part CSV: overview (field/value) then all questions in reading order with columns for options / JSON / conditions.
 */
export function buildSurveyDetailExportCsv(
  detail: Record<string, unknown>,
  labels: SurveyDetailCsvLabels,
  yesLabel: string,
  noLabel: string
): string {
  const overviewRows: Record<string, unknown>[] = [
    { f: labels.lblTitle, v: str(detail.title) },
    { f: labels.lblDescription, v: str(detail.description) },
    { f: labels.lblTargetType, v: str(detail.targetType) },
    { f: labels.lblStatus, v: str(detail.status) },
    { f: labels.lblVersion, v: str(detail.version) },
    { f: labels.lblLanguage, v: str(detail.language) },
    { f: labels.lblCreatedAt, v: str(detail.createdAt) },
    { f: labels.lblUpdatedAt, v: str(detail.updatedAt) },
  ];

  const overviewColumns: BaseDataCsvColumn[] = [
    { header: labels.colField, cell: (r) => str(r.f) },
    { header: labels.colValue, cell: (r) => str(r.v) },
  ];

  const sectionsRaw = detail.sections;
  const sections = Array.isArray(sectionsRaw)
    ? [...sectionsRaw].sort((a, b) => {
        const ao = (a as Record<string, unknown>).orderNo;
        const bo = (b as Record<string, unknown>).orderNo;
        return Number(ao) - Number(bo);
      })
    : [];

  const questionRows: Record<string, unknown>[] = [];
  for (const sec of sections) {
    const section = sec as Record<string, unknown>;
    const qlist = section.questions;
    const questions = Array.isArray(qlist)
      ? [...qlist].sort((a, b) => {
          const ao = (a as Record<string, unknown>).orderNo;
          const bo = (b as Record<string, unknown>).orderNo;
          return Number(ao) - Number(bo);
        })
      : [];

    for (const qu of questions) {
      const q = qu as Record<string, unknown>;
      const req = questionBool(q, "isRequired", "required");
      const en = questionBool(q, "isEnabled", "enabled");
      questionRows.push({
        sectionTitle: str(section.title),
        sectionOrder: str(section.orderNo),
        questionOrder: str(q.orderNo),
        questionText: str(q.questionText ?? q.question_text),
        questionType: str(q.questionType ?? q.question_type),
        required: formatYesNo(req, yesLabel, noLabel),
        enabled:
          en === undefined || en === null
            ? ""
            : formatYesNo(en, yesLabel, noLabel),
        options: formatSurveyExportOptions(q.options ?? q.choices),
        configuration: formatSurveyQuestionConfiguration(q),
        conditions: formatSurveyQuestionConditions(q),
      });
    }
  }

  const questionColumns: BaseDataCsvColumn[] = [
    { header: labels.colSectionTitle, cell: (r) => str(r.sectionTitle) },
    { header: labels.colSectionOrder, cell: (r) => str(r.sectionOrder) },
    { header: labels.colQuestionOrder, cell: (r) => str(r.questionOrder) },
    { header: labels.colQuestionText, cell: (r) => str(r.questionText) },
    { header: labels.colQuestionType, cell: (r) => str(r.questionType) },
    { header: labels.colRequired, cell: (r) => str(r.required) },
    { header: labels.colEnabled, cell: (r) => str(r.enabled) },
    { header: labels.colOptions, cell: (r) => str(r.options) },
    { header: labels.colConfiguration, cell: (r) => str(r.configuration) },
    { header: labels.colConditions, cell: (r) => str(r.conditions) },
  ];

  const overviewBlock = [
    labels.sectionOverview,
    buildBaseDataCsv(overviewColumns, overviewRows),
  ].join("\r\n");

  const questionsBlock = [
    labels.sectionQuestions,
    buildBaseDataCsv(questionColumns, questionRows),
  ].join("\r\n");

  return [overviewBlock, "", questionsBlock].join("\r\n");
}
