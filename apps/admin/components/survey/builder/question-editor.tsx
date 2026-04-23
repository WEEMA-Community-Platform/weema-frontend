"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { inputClass } from "@/components/base-data/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GridAxisItem, ShowCondition, SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";
import {
  JSON_TYPES,
  QUESTION_TYPES,
  createClientId,
  createEmptyGridAxisItem,
  isChoiceType,
} from "@/lib/survey-builder/utils";

import {
  LOGIC_TYPE_OPTIONS,
  OPERATOR_OPTIONS,
  describeCondition,
  getFollowUpDepth,
  getOperatorOptionsForQuestionType,
  getQuestionParentId,
  getQuestionText,
} from "./shared";

export function QuestionEditor(props: {
  question: SurveyQuestion;
  section: SurveySection;
  questionByClientId: Map<string, SurveyQuestion>;
  dependentsMap: Map<string, string[]>;
  onBackToCards: () => void;
  backToCardsLabel?: string;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  primaryActionVariant?: "default" | "outline";
  isPrimaryActionPending: boolean;
  isPrimaryActionDisabled?: boolean;
  onUpdate: (patch: Partial<SurveyQuestion>) => void;
  onTypeChange: (type: SurveyQuestion["questionType"]) => void;
  onDelete: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionClientId: string, patch: { text?: string; value?: string }) => void;
  onDeleteOption: (optionClientId: string) => void;
  onQuestionConfigChange: (questionConfig: SurveyQuestion["questionConfig"]) => void;
  onAddFollowUpQuestion: () => void;
  onAddNestedFollowUpQuestion: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (
    conditionIndex: number,
    updater: (condition: ShowCondition) => ShowCondition
  ) => void;
  onDeleteCondition: (conditionIndex: number) => void;
  isTranslationMode?: boolean;
}) {
  const parentCandidates = props.section.questions.filter((item) => item.clientId !== props.question.clientId);
  const dependentIds = props.dependentsMap.get(props.question.clientId) ?? [];
  const sectionQuestionIds = new Set(props.section.questions.map((item) => item.clientId));
  const parentQuestionId = getQuestionParentId(props.question, sectionQuestionIds);
  const isFollowUpQuestion = Boolean(parentQuestionId);
  const parentQuestion = parentQuestionId ? props.questionByClientId.get(parentQuestionId) : null;
  const followUpDepth = getFollowUpDepth(
    props.question.clientId,
    props.questionByClientId,
    sectionQuestionIds
  );
  const isStructureLocked = Boolean(props.isTranslationMode);

  return (
    <Card className="border-primary/15">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Question editor</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={props.onBackToCards}>
            {props.backToCardsLabel ?? "Back to cards"}
          </Button>
          <Button
            type="button"
            variant={props.primaryActionVariant ?? "default"}
            onClick={props.onPrimaryAction}
            disabled={props.isPrimaryActionDisabled || props.isPrimaryActionPending}
          >
            {props.isPrimaryActionPending ? "Saving..." : props.primaryActionLabel}
          </Button>
          {!isStructureLocked ? (
            <Button type="button" variant="destructive" onClick={props.onDelete}>
              Delete question
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStructureLocked ? (
          <p className="rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            Translation mode is active. You can edit text labels only.
          </p>
        ) : null}
        <Input
          value={props.question.questionText}
          onChange={(event) => props.onUpdate({ questionText: event.target.value })}
          placeholder="Question text"
          className={inputClass}
        />

        <div className="grid gap-2 md:grid-cols-2">
          <Select
            value={props.question.questionType}
            onValueChange={(value) => props.onTypeChange(value as SurveyQuestion["questionType"])}
            disabled={isStructureLocked}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Question type" />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((questionType) => (
                <SelectItem key={questionType.value} value={questionType.value}>
                  {questionType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm">
            <input
              type="checkbox"
              checked={props.question.required}
              onChange={(event) => props.onUpdate({ required: event.target.checked })}
              disabled={isStructureLocked}
            />
            Required question
          </label>
        </div>

        {dependentIds.length > 0 ? (
          <div className="rounded-md border border-primary/10 p-2 text-xs">
            <p className="mb-1 font-medium">This question triggers follow-up questions:</p>
            <ul className="space-y-1">
              {dependentIds.map((dependentId) => (
                <li key={dependentId} className="wrap-break-word whitespace-normal">
                  - {getQuestionText(props.questionByClientId.get(dependentId))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {isChoiceType(props.question.questionType) ? (
          <div className="space-y-2 rounded-lg border border-primary/10 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Options</p>
              {!isStructureLocked ? (
                <Button type="button" variant="outline" size="sm" onClick={props.onAddOption}>
                  <PlusIcon className="size-3.5" />
                  Add option
                </Button>
              ) : null}
            </div>
            {props.question.options.map((option) => (
              <div key={option.clientId} className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input
                  value={option.text}
                  onChange={(event) =>
                    props.onUpdateOption(option.clientId, { text: event.target.value })
                  }
                  placeholder="Option"
                  className={inputClass}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="self-center"
                  disabled={isStructureLocked}
                  onClick={() => props.onDeleteOption(option.clientId)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {props.question.questionType === "JSON" && !isStructureLocked ? (
          <JsonQuestionConfigEditor
            question={props.question}
            onQuestionConfigChange={props.onQuestionConfigChange}
          />
        ) : null}

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
              {!isStructureLocked ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={props.onAddFollowUpQuestion}>
                    <PlusIcon className="size-3.5" />
                    {isFollowUpQuestion ? "Add sibling follow-up" : "Add follow-up question"}
                  </Button>
                  {isFollowUpQuestion ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={props.onAddNestedFollowUpQuestion}
                      disabled={followUpDepth >= 2}
                    >
                      <PlusIcon className="size-3.5" />
                      Add nested follow-up
                    </Button>
                  ) : null}
                  {isFollowUpQuestion ? (
                    <Button type="button" variant="outline" size="sm" onClick={props.onAddCondition}>
                      <PlusIcon className="size-3.5" />
                      Add condition
                    </Button>
                  ) : null}
                </>
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
                    ? "Direct follow-up (original question)"
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
          {isFollowUpQuestion && props.question.showConditions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No follow-up rules. This question is always visible.
            </p>
          ) : null}
          {isFollowUpQuestion
            ? props.question.showConditions.map((condition, index) => {
                const hasMultipleConditions = props.question.showConditions.length > 1;
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
                      {describeCondition(condition, props.questionByClientId)}
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
                          props.onUpdateCondition(index, (prev) => ({
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
                        disabled={isStructureLocked}
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
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            operator: value as ShowCondition["operator"],
                          }))
                        }
                        disabled={isStructureLocked}
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
                            props.onUpdateCondition(index, (prev) => ({
                              ...prev,
                              logicType: value as ShowCondition["logicType"],
                            }))
                          }
                          disabled={isStructureLocked || index === 0}
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
                        disabled={isStructureLocked}
                        onClick={() => props.onDeleteCondition(index)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                    {parentIsChoice ? (
                      <Select
                        value={condition.optionClientId}
                        onValueChange={(value) =>
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            optionClientId: value,
                          }))
                        }
                        disabled={isStructureLocked}
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
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            expectedValue: value,
                          }))
                        }
                        disabled={isStructureLocked}
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
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            expectedValue: event.target.value,
                          }))
                        }
                        placeholder="Expected value"
                        className={inputClass}
                        disabled={isStructureLocked}
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
      </CardContent>
    </Card>
  );
}

function JsonQuestionConfigEditor(props: {
  question: SurveyQuestion;
  onQuestionConfigChange: (questionConfig: SurveyQuestion["questionConfig"]) => void;
}) {
  const config = props.question.questionConfig;
  if (!config) return null;

  return (
    <div className="space-y-3 rounded-lg border border-primary/10 p-3">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">JSON question format</p>
        <p className="text-xs text-muted-foreground">
          Choose how data is collected, then define clear keys and labels for each field.
        </p>
      </div>
      <Select
        value={config.jsonType}
        onValueChange={(value) => {
          if (value === config.jsonType) return;
          if (value === "REPEATABLE_TABLE") {
            props.onQuestionConfigChange({
              jsonType: "REPEATABLE_TABLE",
              minRows: 0,
              maxRows: 10,
              columns: [
                {
                  clientId: createClientId(),
                  key: "col_1",
                  label: "Column 1",
                  columnType: "TEXT",
                  required: false,
                },
              ],
            });
            return;
          }
          props.onQuestionConfigChange({
            jsonType: "GRID",
            selectionType: "SINGLE",
            rows: [createEmptyGridAxisItem("Row 1")],
            columns: [createEmptyGridAxisItem("Column 1")],
          });
        }}
      >
        <SelectTrigger className={inputClass}>
          <SelectValue placeholder="JSON question type" />
        </SelectTrigger>
        <SelectContent>
          {JSON_TYPES.map((jsonType) => (
            <SelectItem key={jsonType.value} value={jsonType.value}>
              {jsonType.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {config.jsonType === "REPEATABLE_TABLE" ? (
        <RepeatableTableEditor config={config} onChange={props.onQuestionConfigChange} />
      ) : (
        <GridEditor config={config} onChange={props.onQuestionConfigChange} />
      )}
    </div>
  );
}

function RepeatableTableEditor(props: {
  config: Extract<SurveyQuestion["questionConfig"], { jsonType: "REPEATABLE_TABLE" }>;
  onChange: (config: SurveyQuestion["questionConfig"]) => void;
}) {
  if (!props.config) return null;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Minimum rows</p>
          <Input
            type="number"
            value={props.config.minRows}
            onChange={(event) =>
              props.onChange({
                ...props.config,
                minRows: Number(event.target.value || 0),
              })
            }
            placeholder="e.g. 0"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Maximum rows</p>
          <Input
            type="number"
            value={props.config.maxRows}
            onChange={(event) =>
              props.onChange({
                ...props.config,
                maxRows: Number(event.target.value || 0),
              })
            }
            placeholder="e.g. 10"
            className={inputClass}
          />
        </div>
      </div>
      <div className="hidden items-center gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[140px_minmax(0,1fr)_180px_auto]">
        <span>Key</span>
        <span>Column label</span>
        <span>Answer type</span>
        <span className="text-center">Action</span>
      </div>
      {props.config.columns.map((column) => (
        <div
          key={column.clientId}
          className="grid items-center gap-2 md:grid-cols-[140px_minmax(0,1fr)_180px_auto]"
        >
          <Input
            value={column.key ?? ""}
            onChange={(event) =>
              props.onChange({
                ...props.config,
                columns: props.config.columns.map((item) =>
                  item.clientId === column.clientId ? { ...item, key: event.target.value } : item
                ),
              })
            }
            placeholder="e.g. col_1"
            className={inputClass}
          />
          <Input
            value={column.label}
            onChange={(event) =>
              props.onChange({
                ...props.config,
                columns: props.config.columns.map((item) =>
                  item.clientId === column.clientId ? { ...item, label: event.target.value } : item
                ),
              })
            }
            placeholder="e.g. Household size"
            className={inputClass}
          />
          <Select
            value={column.columnType}
            onValueChange={(value) =>
              props.onChange({
                ...props.config,
                columns: props.config.columns.map((item) =>
                  item.clientId === column.clientId
                    ? { ...item, columnType: value as typeof item.columnType }
                    : item
                ),
              })
            }
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEXT">Text</SelectItem>
              <SelectItem value="NUMBER">Number</SelectItem>
              <SelectItem value="DATE">Date</SelectItem>
              <SelectItem value="BOOLEAN">Boolean</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-11 w-11 self-center border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove column"
            onClick={() =>
              props.onChange({
                ...props.config,
                columns: props.config.columns.filter((item) => item.clientId !== column.clientId),
              })
            }
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex justify-start md:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            props.onChange({
              ...props.config,
              columns: [
                ...props.config.columns,
                {
                  clientId: createClientId(),
                  key: `col_${props.config.columns.length + 1}`,
                  label: `Column ${props.config.columns.length + 1}`,
                  columnType: "TEXT",
                  required: false,
                },
              ],
            })
          }
        >
          <PlusIcon className="size-3.5" />
          Add column
        </Button>
      </div>
    </div>
  );
}

function GridEditor(props: {
  config: Extract<SurveyQuestion["questionConfig"], { jsonType: "GRID" }>;
  onChange: (config: SurveyQuestion["questionConfig"]) => void;
}) {
  if (!props.config) return null;
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Selection mode</p>
        <Select
          value={props.config.selectionType}
          onValueChange={(value) =>
            props.onChange({
              ...props.config,
              selectionType: value as typeof props.config.selectionType,
            })
          }
        >
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder="Selection type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SINGLE">Single selection</SelectItem>
            <SelectItem value="MULTIPLE">Multiple selection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GridAxisEditor
        label="Rows"
        items={props.config.rows}
        onChange={(rows) =>
          props.onChange({
            ...props.config,
            rows,
          })
        }
      />
      <GridAxisEditor
        label="Columns"
        items={props.config.columns}
        onChange={(columns) =>
          props.onChange({
            ...props.config,
            columns,
          })
        }
      />
    </div>
  );
}

function GridAxisEditor(props: {
  label: string;
  items: GridAxisItem[];
  onChange: (items: GridAxisItem[]) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-primary/10 p-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{props.label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            props.onChange([
              ...props.items,
              createEmptyGridAxisItem(`${props.label} ${props.items.length + 1}`),
            ])
          }
        >
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>
      <div className="hidden items-center gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[140px_minmax(0,1fr)_auto]">
        <span>Key</span>
        <span>{props.label} label</span>
        <span className="text-center">Action</span>
      </div>
      {props.items.map((item) => (
        <div
          key={item.clientId}
          className="grid items-center gap-2 md:grid-cols-[140px_minmax(0,1fr)_auto]"
        >
          <Input
            value={item.key ?? ""}
            onChange={(event) =>
              props.onChange(
                props.items.map((axisItem) =>
                  axisItem.clientId === item.clientId
                    ? { ...axisItem, key: event.target.value }
                    : axisItem
                )
              )
            }
            placeholder="e.g. row_1"
            className={inputClass}
          />
          <Input
            value={item.label}
            onChange={(event) =>
              props.onChange(
                props.items.map((axisItem) =>
                  axisItem.clientId === item.clientId
                    ? { ...axisItem, label: event.target.value }
                    : axisItem
                )
              )
            }
            placeholder={`e.g. ${props.label} 1`}
            className={inputClass}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-11 w-11 self-center border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${props.label.toLowerCase()} item`}
            onClick={() =>
              props.onChange(props.items.filter((axisItem) => axisItem.clientId !== item.clientId))
            }
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
