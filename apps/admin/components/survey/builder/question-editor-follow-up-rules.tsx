import { PlusIcon, Trash2Icon } from "lucide-react";

import { inputClass } from "@/components/base-data/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShowCondition, SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";
import { isChoiceType } from "@/lib/survey-builder/utils";

import {
  LOGIC_TYPE_OPTIONS,
  OPERATOR_OPTIONS,
  describeCondition,
  getFollowUpDepth,
  getOperatorOptionsForQuestionType,
  getQuestionParentId,
} from "./shared";

type Props = {
  question: SurveyQuestion;
  section: SurveySection;
  questionByClientId: Map<string, SurveyQuestion>;
  onAddFollowUpQuestion: () => void;
  onAddNestedFollowUpQuestion: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (
    conditionIndex: number,
    updater: (condition: ShowCondition) => ShowCondition
  ) => void;
  onDeleteCondition: (conditionIndex: number) => void;
};

export function QuestionEditorFollowUpRules({
  question,
  section,
  questionByClientId,
  onAddFollowUpQuestion,
  onAddNestedFollowUpQuestion,
  onAddCondition,
  onUpdateCondition,
  onDeleteCondition,
}: Props) {
  const parentCandidates = section.questions.filter((item) => item.clientId !== question.clientId);
  const sectionQuestionIds = new Set(section.questions.map((item) => item.clientId));
  const parentQuestionId = getQuestionParentId(question, sectionQuestionIds);
  const isFollowUpQuestion = Boolean(parentQuestionId);
  const parentQuestion = parentQuestionId ? questionByClientId.get(parentQuestionId) : null;
  const followUpDepth = getFollowUpDepth(question.clientId, questionByClientId, sectionQuestionIds);

  return (
    <div className="space-y-2 rounded-lg border border-primary/10 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Follow-up rules</p>
          <p className="text-xs text-muted-foreground">
            This question appears only when these conditions match. Conditions are evaluated
            left to right using AND/OR.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onAddFollowUpQuestion}>
            <PlusIcon className="size-3.5" />
            {isFollowUpQuestion ? "Add sibling follow-up" : "Add follow-up question"}
          </Button>
          {isFollowUpQuestion ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddNestedFollowUpQuestion}
              disabled={followUpDepth >= 2}
            >
              <PlusIcon className="size-3.5" />
              Add nested follow-up
            </Button>
          ) : null}
          {isFollowUpQuestion ? (
            <Button type="button" variant="outline" size="sm" onClick={onAddCondition}>
              <PlusIcon className="size-3.5" />
              Add condition
            </Button>
          ) : null}
        </div>
      </div>

      {!isFollowUpQuestion ? (
        <p className="text-xs text-muted-foreground">
          Add follow-up questions from here. They will stay grouped under this parent question.
        </p>
      ) : null}

      {isFollowUpQuestion && parentQuestion ? (
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Follow-up type:{" "}
            <span className="font-medium text-foreground">
              {followUpDepth <= 1
                ? "Direct follow-up (parent question)"
                : `Nested follow-up (level ${followUpDepth})`}
            </span>
          </p>
          <p>
            Parent question:{" "}
            <span className="font-medium text-foreground wrap-break-word whitespace-normal">
              {parentQuestion.questionText || "Untitled question"}
            </span>
          </p>
          {followUpDepth >= 2 ? (
            <p>Maximum nesting reached. Only one nested level is allowed.</p>
          ) : null}
        </div>
      ) : null}

      {isFollowUpQuestion && question.showConditions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No follow-up rules. This question is always visible.
        </p>
      ) : null}

      {isFollowUpQuestion
        ? question.showConditions.map((condition, index) => {
            const hasMultipleConditions = question.showConditions.length > 1;
            const selectedParentQuestion = parentCandidates.find(
              (candidate) => candidate.clientId === condition.parentQuestionClientId
            );
            const parentOptions = selectedParentQuestion?.options ?? [];
            const parentIsChoice = selectedParentQuestion
              ? isChoiceType(selectedParentQuestion.questionType)
              : false;
            const parentIsBoolean = selectedParentQuestion?.questionType === "BOOLEAN";
            const parentIsNumber = selectedParentQuestion?.questionType === "NUMBER";
            const availableOperators = selectedParentQuestion
              ? getOperatorOptionsForQuestionType(selectedParentQuestion.questionType)
              : OPERATOR_OPTIONS;
            const operatorValue = availableOperators.some(
              (item) => item.value === condition.operator
            )
              ? condition.operator
              : availableOperators[0]?.value ?? "EQUALS";

            return (
              <div
                key={`${condition.parentQuestionClientId}-${index}`}
                className="space-y-2 rounded-md border border-primary/10 p-2"
              >
                <p className="text-xs text-muted-foreground wrap-break-word whitespace-normal">
                  {describeCondition(condition, questionByClientId)}
                </p>
                <div
                  className={`grid gap-2 ${
                    hasMultipleConditions
                      ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_96px_auto]"
                      : "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  }`}
                >
                  <Select
                    value={condition.parentQuestionClientId}
                    onValueChange={(value) => {
                      const parentQuestion = parentCandidates.find(
                        (candidate) => candidate.clientId === value
                      );
                      if (!parentQuestion) return;
                      onUpdateCondition(index, (prev) => ({
                        ...prev,
                        parentQuestionClientId: parentQuestion.clientId,
                        operator:
                          getOperatorOptionsForQuestionType(parentQuestion.questionType)[0]
                            ?.value ?? "EQUALS",
                        optionClientId: isChoiceType(parentQuestion.questionType)
                          ? parentQuestion.options[0]?.clientId
                          : undefined,
                        expectedValue: isChoiceType(parentQuestion.questionType) ? undefined : "",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Parent question" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCandidates.map((candidate) => (
                        <SelectItem key={candidate.clientId} value={candidate.clientId}>
                          {candidate.questionText || "Untitled question"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={operatorValue}
                    onValueChange={(value) =>
                      onUpdateCondition(index, (prev) => ({
                        ...prev,
                        operator: value as ShowCondition["operator"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasMultipleConditions ? (
                    <Select
                      value={condition.logicType}
                      onValueChange={(value) =>
                        onUpdateCondition(index, (prev) => ({
                          ...prev,
                          logicType: value as ShowCondition["logicType"],
                        }))
                      }
                      disabled={index === 0}
                    >
                      <SelectTrigger className="h-11 w-[72px] min-w-[72px] px-2 text-[10px] [&_svg]:ml-auto [&_svg]:size-3">
                        <SelectValue placeholder="Logic type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOGIC_TYPE_OPTIONS.map((logicType) => (
                          <SelectItem
                            key={logicType.value}
                            value={logicType.value}
                            className="text-[11px]"
                          >
                            {logicType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="h-11 w-11 justify-self-end"
                    onClick={() => onDeleteCondition(index)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
                {parentIsChoice ? (
                  <Select
                    value={condition.optionClientId}
                    onValueChange={(value) =>
                      onUpdateCondition(index, (prev) => ({
                        ...prev,
                        optionClientId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Expected option" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.clientId} value={option.clientId}>
                          {option.text || option.value || "Untitled option"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : parentIsBoolean ? (
                  <Select
                    value={condition.expectedValue ?? ""}
                    onValueChange={(value) =>
                      onUpdateCondition(index, (prev) => ({
                        ...prev,
                        expectedValue: value,
                      }))
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Expected value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={parentIsNumber ? "number" : "text"}
                    value={condition.expectedValue ?? ""}
                    onChange={(event) =>
                      onUpdateCondition(index, (prev) => ({
                        ...prev,
                        expectedValue: event.target.value,
                      }))
                    }
                    placeholder="Expected value"
                    className={inputClass}
                  />
                )}
                {hasMultipleConditions && index === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    First condition has no join operator. AND/OR applies from the second row.
                  </p>
                ) : null}
              </div>
            );
          })
        : null}
    </div>
  );
}
