"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShowCondition, SurveyQuestion } from "@/lib/survey-builder/types";
import { QUESTION_TYPES } from "@/lib/survey-builder/utils";

function useOperatorLabel() {
  const t = useTranslations("survey.preview.operators");
  return (operator: ShowCondition["operator"]) => {
    switch (operator) {
      case "EQUALS":
        return t("equals");
      case "NOT_EQUALS":
        return t("notEquals");
      case "GREATER_THAN":
        return t("greaterThan");
      case "LESS_THAN":
        return t("lessThan");
      case "CONTAINS":
        return t("contains");
      default:
        return operator;
    }
  };
}

function RenderOptions({ question }: { question: SurveyQuestion }) {
  const t = useTranslations("survey.preview");

  if (question.questionType === "BOOLEAN") {
    return (
      <div className="space-y-2 rounded-md border border-primary/10 p-3 text-sm">
        <p className="text-xs font-medium text-muted-foreground">{t("answerPreview")}</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="radio" name={`boolean-preview-${question.clientId}`} disabled />
            <span>{t("true")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name={`boolean-preview-${question.clientId}`} disabled />
            <span>{t("false")}</span>
          </label>
        </div>
      </div>
    );
  }

  if (question.questionType === "SINGLE_CHOICE" || question.questionType === "MULTIPLE_CHOICE") {
    return (
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <div key={option.clientId} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-muted-foreground">{index + 1}.</span>
            <span className="min-w-0 wrap-break-word whitespace-normal">
              {option.text || t("untitledOption")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (question.questionType === "JSON" && question.questionConfig) {
    if (question.questionConfig.jsonType === "REPEATABLE_TABLE") {
      return (
        <div className="space-y-2 text-sm">
          <p>
            {t("repeatableTable", {
              min: question.questionConfig.minRows,
              max: question.questionConfig.maxRows,
            })}
          </p>
          <div className="space-y-1">
            {question.questionConfig.columns.map((column) => (
              <div key={column.clientId} className="rounded border border-primary/10 px-2 py-1">
                <span className="wrap-break-word whitespace-normal">
                  {column.label || t("untitledColumn")} ({column.columnType})
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 text-sm">
        <p>
          {t("grid", {
            type:
              question.questionConfig.selectionType === "MULTIPLE"
                ? t("multiSelect")
                : t("singleSelect"),
          })}
        </p>
        <p className="text-muted-foreground">
          {t("gridDimensions", {
            rows: question.questionConfig.rows.length,
            cols: question.questionConfig.columns.length,
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-dashed border-primary/20 px-3 py-2 text-sm text-muted-foreground">
      {t("responseFieldFor", {
        type: question.questionType.toLowerCase().replaceAll("_", " "),
      })}
    </div>
  );
}

function getQuestionTypeLabel(type: SurveyQuestion["questionType"]) {
  return QUESTION_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function SurveyPreviewPanel({
  question,
  questionByClientId,
  sectionQuestions,
}: {
  question: SurveyQuestion | null;
  questionByClientId?: Map<string, SurveyQuestion>;
  sectionQuestions?: SurveyQuestion[];
}) {
  const t = useTranslations("survey.preview");
  const operatorLabel = useOperatorLabel();

  return (
    <Card className="h-full border-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!question ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium wrap-break-word whitespace-normal">
                {question.questionText || t("untitledQuestion")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {question.required ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-destructive text-sm">*</span>
                    <span>{t("required")}</span>
                  </span>
                ) : (
                  t("optional")
                )}{" "}
                · {getQuestionTypeLabel(question.questionType)}
              </p>
            </div>
            {question.showConditions.length > 0 ? (
              <FollowUpVisibilityPreview
                question={question}
                operatorLabel={operatorLabel}
                t={t}
                questionByClientId={questionByClientId}
                sectionQuestions={sectionQuestions}
              />
            ) : null}
            <RenderOptions question={question} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FollowUpVisibilityPreview(props: {
  question: SurveyQuestion;
  operatorLabel: (operator: ShowCondition["operator"]) => string;
  t: ReturnType<typeof useTranslations>;
  /** Optional context to render parent question labels in multi-question follow-ups. */
  questionByClientId?: Map<string, SurveyQuestion>;
  /** Section-local order of questions to compute Q1/Q2 labels. */
  sectionQuestions?: SurveyQuestion[];
}) {
  const { question, operatorLabel, t, questionByClientId, sectionQuestions } = props;
  const isMulti = question.showConditions.length > 1;

  const indexById = new Map<string, number>();
  (sectionQuestions ?? []).forEach((q, idx) => indexById.set(q.clientId, idx));

  const parentIds: string[] = [];
  const seen = new Set<string>();
  for (const c of question.showConditions) {
    if (!c.parentQuestionClientId) continue;
    if (seen.has(c.parentQuestionClientId)) continue;
    seen.add(c.parentQuestionClientId);
    parentIds.push(c.parentQuestionClientId);
  }

  const parentChip = (id: string) => {
    const orderIdx = indexById.get(id);
    const short = orderIdx !== undefined ? `Q${orderIdx + 1}` : "Q?";
    const text = questionByClientId?.get(id)?.questionText;
    return (
      <span
        key={id}
        className="inline-flex items-center gap-1 rounded-md border border-primary/15 bg-background px-2 py-1 text-[10px] leading-none text-muted-foreground"
        title={text || undefined}
      >
        <span className="font-medium text-foreground/80">{short}</span>
        <span className="max-w-[160px] truncate">{text || t("untitledQuestion")}</span>
      </span>
    );
  };

  return (
    <div className="rounded-md border border-primary/10 bg-primary/5 p-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{t("followUpVisibility")}</p>
          {isMulti ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {/* Don’t add new i18n keys yet; keep this simple. */}
              Multi-question follow-up — rules join left-to-right.
            </p>
          ) : null}
        </div>
        {isMulti ? (
          <span className="shrink-0 rounded-md border border-primary/15 bg-background px-2 py-1 text-[10px] font-medium text-primary">
            {question.showConditions.length} rules
          </span>
        ) : null}
      </div>

      {isMulti && parentIds.length > 0 ? (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Parents</p>
          <div className="flex flex-wrap gap-1.5">{parentIds.map(parentChip)}</div>
        </div>
      ) : null}

      <ul className="mt-2 space-y-1">
        {question.showConditions.map((condition, index) => {
          const join = index > 0 ? condition.logicType : null;
          const parentIdx = indexById.get(condition.parentQuestionClientId);
          const parentShort = parentIdx !== undefined ? `Q${parentIdx + 1}` : "Q?";
          const parentText = questionByClientId?.get(condition.parentQuestionClientId)?.questionText;
          return (
            <li
              key={`${question.clientId}-preview-condition-${index}`}
              className="wrap-break-word whitespace-normal"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {join ? (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {join}
                  </span>
                ) : null}
                {isMulti ? (
                  <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                    {parentShort}
                  </span>
                ) : null}
                {parentText ? (
                  <span className="truncate text-[10px] text-muted-foreground">
                    {parentText}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                <span>
                  {t("rule", {
                    index: index + 1,
                    operator: operatorLabel(condition.operator),
                    value: "__VALUE__",
                  }).split("__VALUE__")[0]}
                </span>
                <span className="font-semibold text-foreground">
                  {condition.expectedValue || t("selectedValue")}
                </span>
                <span>
                  {t("rule", {
                    index: index + 1,
                    operator: operatorLabel(condition.operator),
                    value: "__VALUE__",
                  }).split("__VALUE__")[1] ?? ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
