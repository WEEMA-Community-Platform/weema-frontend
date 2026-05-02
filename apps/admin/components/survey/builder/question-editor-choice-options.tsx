import { PlusIcon, Trash2Icon } from "lucide-react";

import { inputClass } from "@/components/base-data/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SurveyOption, SurveyQuestion } from "@/lib/survey-builder/types";

type Props = {
  question: SurveyQuestion;
  onAddOption: () => void;
  onUpdateOption: (optionClientId: string, patch: Partial<SurveyOption>) => void;
  onDeleteOption: (optionClientId: string) => void;
};

export function QuestionEditorChoiceOptions({
  question,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}: Props) {
  const showExclusiveToggle = question.questionType === "MULTIPLE_CHOICE";

  return (
    <div className="space-y-2 rounded-lg border border-primary/10 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Options</p>
        <Button type="button" variant="outline" size="sm" onClick={onAddOption}>
          <PlusIcon className="size-3.5" />
          Add option
        </Button>
      </div>
      {question.options.map((option) => (
        <div
          key={option.clientId}
          className={`grid gap-2 ${
            showExclusiveToggle ? "md:grid-cols-[1fr_auto_auto]" : "md:grid-cols-[1fr_auto]"
          }`}
        >
          <Input
            value={option.text}
            onChange={(event) => onUpdateOption(option.clientId, { text: event.target.value })}
            placeholder="Option"
            className={inputClass}
          />
          {showExclusiveToggle ? (
            <label className="flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-xs">
              <input
                type="checkbox"
                checked={Boolean(option.isExclusive)}
                onChange={(event) =>
                  onUpdateOption(option.clientId, { isExclusive: event.target.checked })
                }
              />
              Exclusive option
            </label>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="self-center"
            onClick={() => onDeleteOption(option.clientId)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
