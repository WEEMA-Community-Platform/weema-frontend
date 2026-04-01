"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShowCondition, SurveyQuestion } from "@/lib/survey-builder/types";

function operatorLabel(operator: ShowCondition["operator"]) {
  switch (operator) {
    case "EQUALS":
      return "equals";
    case "NOT_EQUALS":
      return "does not equal";
    case "GREATER_THAN":
      return "is greater than";
    case "LESS_THAN":
      return "is less than";
    case "CONTAINS":
      return "contains";
    default:
      return operator;
  }
}

function renderOptions(question: SurveyQuestion) {
  if (question.questionType === "BOOLEAN") {
    return (
      <div className="space-y-2 rounded-md border border-primary/10 p-3 text-sm">
        <p className="text-xs font-medium text-muted-foreground">Answer preview</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="radio" name={`boolean-preview-${question.clientId}`} disabled />
            <span>True</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name={`boolean-preview-${question.clientId}`} disabled />
            <span>False</span>
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
              {option.text || "Untitled option"}
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
            Repeatable table: min {question.questionConfig.minRows}, max{" "}
            {question.questionConfig.maxRows}
          </p>
          <div className="space-y-1">
            {question.questionConfig.columns.map((column) => (
              <div key={column.clientId} className="rounded border border-primary/10 px-2 py-1">
                <span className="wrap-break-word whitespace-normal">
                  {column.label || "Untitled column"} ({column.columnType})
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
          Grid ({question.questionConfig.selectionType === "MULTIPLE" ? "multi select" : "single select"})
        </p>
        <p className="text-muted-foreground">
          {question.questionConfig.rows.length} rows x {question.questionConfig.columns.length} columns
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-dashed border-primary/20 px-3 py-2 text-sm text-muted-foreground">
      Response field preview for {question.questionType.toLowerCase().replaceAll("_", " ")}.
    </div>
  );
}

export function SurveyPreviewPanel({ question }: { question: SurveyQuestion | null }) {
  return (
    <Card className="h-full border-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live preview</CardTitle>
      </CardHeader>
      <CardContent>
        {!question ? (
          <p className="text-sm text-muted-foreground">
            Select a question from the left sidebar to see a live preview.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium wrap-break-word whitespace-normal">
                {question.questionText || "Untitled question"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {question.required ? "Required" : "Optional"} · {question.questionType}
              </p>
            </div>
            {question.showConditions.length > 0 ? (
              <div className="rounded-md border border-primary/10 bg-primary/5 p-2 text-xs">
                <p className="mb-1 font-medium">Follow-up visibility</p>
                <ul className="space-y-1">
                  {question.showConditions.map((condition, index) => (
                    <li
                      key={`${question.clientId}-preview-condition-${index}`}
                      className="wrap-break-word whitespace-normal"
                    >
                      Rule {index + 1}: parent question {operatorLabel(condition.operator)}{" "}
                      {condition.expectedValue || "selected value"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {renderOptions(question)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
