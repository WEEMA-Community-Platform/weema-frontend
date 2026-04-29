import type { SurveyListItem } from "@/lib/api/surveys";
import {
  buildBaseDataCsv,
  type BaseDataCsvColumn,
} from "@/lib/base-data-csv";

export type SurveyListExportHeaders = {
  title: string;
  description: string;
  targetType: string;
  status: string;
  version: string;
  language: string;
  isActive: string;
  isDeleted: string;
  parentSurveyTitle: string;
  totalSections: string;
  totalQuestions: string;
  createdAt: string;
  updatedAt: string;
};

function csvStr(v: unknown): string {
  return v == null ? "" : String(v);
}

function csvBool(v: unknown, yes: string, no: string): string {
  if (v === true || v === "true") return yes;
  if (v === false || v === "false") return no;
  return "";
}

export function surveyListExportColumns(
  h: SurveyListExportHeaders,
  yes: string,
  no: string
): BaseDataCsvColumn[] {
  return [
    { header: h.title, cell: (r) => csvStr(r.title) },
    { header: h.description, cell: (r) => csvStr(r.description) },
    { header: h.targetType, cell: (r) => csvStr(r.targetType) },
    { header: h.status, cell: (r) => csvStr(r.status) },
    { header: h.version, cell: (r) => csvStr(r.version) },
    { header: h.language, cell: (r) => csvStr(r.language) },
    { header: h.isActive, cell: (r) => csvBool(r.isActive, yes, no) },
    { header: h.isDeleted, cell: (r) => csvBool(r.isDeleted, yes, no) },
    { header: h.parentSurveyTitle, cell: (r) => csvStr(r.parentSurveyTitle) },
    { header: h.totalSections, cell: (r) => csvStr(r.totalSections) },
    { header: h.totalQuestions, cell: (r) => csvStr(r.totalQuestions) },
    { header: h.createdAt, cell: (r) => csvStr(r.createdAt) },
    { header: h.updatedAt, cell: (r) => csvStr(r.updatedAt) },
  ];
}

export function surveyListItemToExportRow(survey: SurveyListItem): Record<string, unknown> {
  return {
    title: survey.title,
    description: survey.description ?? "",
    targetType: survey.targetType ?? "",
    status: survey.status ?? "",
    version: survey.version ?? "",
    language: survey.language ?? "",
    isActive: survey.isActive,
    isDeleted: "",
    parentSurveyTitle: "",
    totalSections: survey.totalSections ?? "",
    totalQuestions: survey.totalQuestions ?? "",
    createdAt: survey.createdAt ?? "",
    updatedAt: survey.updatedAt ?? "",
  };
}

export function buildSurveyListExportCsv(
  rows: Record<string, unknown>[],
  headers: SurveyListExportHeaders,
  yes: string,
  no: string
): string {
  return buildBaseDataCsv(surveyListExportColumns(headers, yes, no), rows);
}
