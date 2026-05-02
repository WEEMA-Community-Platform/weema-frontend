"use client";

import { useTranslations } from "next-intl";

import { formTextareaClass } from "@/components/base-data/shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { AnswerDraft, WorkspaceQuestion } from "./types";
import { getJsonQuestionConfig, getNumberAnswerBounds, normalizeQuestionType } from "./utils";
import { JsonQuestionEditor } from "./json-question-editor";

type Props = {
  question: WorkspaceQuestion;
  index: number;
  draft: AnswerDraft;
  onDraftChange: (patch: Partial<AnswerDraft>) => void;
};

export function QuestionAnswerEditor({ question, index, draft, onDraftChange }: Props) {
  const t = useTranslations("survey.workspace");
  const type = question.questionType.toUpperCase();
  const numberBounds = type === "NUMBER" ? getNumberAnswerBounds(question) : null;
  const options = question.options;

  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t("questionIndex", { index: index + 1 })}</p>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {normalizeQuestionType(question.questionType)}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-foreground">{question.questionText}</p>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("answer")}</p>
        <div className="w-full max-w-2xl">
          {type === "NUMBER" ? (
            <Input
              type="number"
              className="h-11 max-w-lg text-sm"
              value={draft.numberValue}
              onChange={(event) => onDraftChange({ numberValue: event.target.value })}
              placeholder={t("numberPlaceholder")}
              min={numberBounds?.min !== undefined ? numberBounds.min : undefined}
              max={numberBounds?.max !== undefined ? numberBounds.max : undefined}
            />
          ) : type === "DATE" ? (
            <Input
              type="date"
              className="h-11 max-w-lg text-sm"
              value={draft.dateValue}
              onChange={(event) => onDraftChange({ dateValue: event.target.value })}
            />
          ) : type === "BOOLEAN" ? (
            <Select
              value={draft.booleanValue || undefined}
              onValueChange={(value) => onDraftChange({ booleanValue: value as "true" | "false" | "" })}
            >
              <SelectTrigger className="h-11 max-w-lg text-sm">
                <SelectValue placeholder={t("selectAnswer")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("yes")}</SelectItem>
                <SelectItem value="false">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
          ) : type === "SINGLE_CHOICE" ? (
            options.length > 0 ? (
              <Select
                value={draft.singleChoiceValue || undefined}
                onValueChange={(value) => onDraftChange({ singleChoiceValue: value })}
              >
                <SelectTrigger className="h-11 max-w-lg text-sm">
                  <SelectValue placeholder={t("selectOption")} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option, optionIndex) => (
                    <SelectItem key={option.id ?? `${question.key}-single-${optionIndex}`} value={option.text}>
                      {option.text || t("optionIndex", { index: optionIndex + 1 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-11 max-w-lg text-sm"
                value={draft.singleChoiceValue}
                onChange={(event) => onDraftChange({ singleChoiceValue: event.target.value })}
                placeholder={t("enterOption")}
              />
            )
          ) : type === "MULTIPLE_CHOICE" ? (
            options.length > 0 ? (
              <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                {options.map((option, optionIndex) => {
                  const text = option.text || t("optionIndex", { index: optionIndex + 1 });
                  const selected = draft.multiChoiceValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .includes(text);
                  return (
                    <label
                      key={option.id ?? `${question.key}-multi-${optionIndex}`}
                      className="flex items-center gap-2 rounded-lg border border-primary/15 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          const current = draft.multiChoiceValue
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean);
                          const next = event.target.checked
                            ? Array.from(new Set([...current, text]))
                            : current.filter((item) => item !== text);
                          onDraftChange({ multiChoiceValue: next.join(", ") });
                        }}
                      />
                      <span>{text}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className={`${formTextareaClass} max-w-xl`}
                value={draft.multiChoiceValue}
                onChange={(event) => onDraftChange({ multiChoiceValue: event.target.value })}
                placeholder={t("enterOptions")}
              />
            )
          ) : type === "JSON" ? (
            <JsonQuestionEditor
              draft={draft}
              questionConfig={getJsonQuestionConfig(question.questionConfig)}
              onDraftChange={onDraftChange}
            />
          ) : type === "LONG_TEXT" ? (
            <textarea
              className={`${formTextareaClass} max-w-xl`}
              value={draft.textValue}
              onChange={(event) => onDraftChange({ textValue: event.target.value })}
              placeholder={t("enterAnswer")}
            />
          ) : (
            <Input
              className="h-11 max-w-lg text-sm"
              value={draft.textValue}
              onChange={(event) => onDraftChange({ textValue: event.target.value })}
              placeholder={t("enterAnswer")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
