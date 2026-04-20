"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShowCondition, SurveyQuestion } from "@/lib/survey-builder/types";

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
        <p className="text-xs font-medium text-muted-foreground">
          {t("answerPreview")}
        </p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`boolean-preview-${question.clientId}`}
              disabled
            />
            <span>{t("true")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`boolean-preview-${question.clientId}`}
              disabled
            />
            <span>{t("false")}</span>
          </label>
        </div>
      </div>
    );
  }

  if (
    question.questionType === "SINGLE_CHOICE" ||
    question.questionType === "MULTIPLE_CHOICE"
  ) {
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
              <div
                key={column.clientId}
                className="rounded border border-primary/10 px-2 py-1"
              >
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

export function SurveyPreviewPanel({
  question,
}: {
  question: SurveyQuestion | null;
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
                {question.required ? t("required") : t("optional")} ·{" "}
                {question.questionType}
              </p>
            </div>
            {question.showConditions.length > 0 ? (
              <div className="rounded-md border border-primary/10 bg-primary/5 p-2 text-xs">
                <p className="mb-1 font-medium">{t("followUpVisibility")}</p>
                <ul className="space-y-1">
                  {question.showConditions.map((condition, index) => (
                    <li
                      key={`${question.clientId}-preview-condition-${index}`}
                      className="wrap-break-word whitespace-normal"
                    >
                      {t("rule", {
                        index: index + 1,
                        operator: operatorLabel(condition.operator),
                        value: condition.expectedValue || t("selectedValue"),
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <RenderOptions question={question} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
