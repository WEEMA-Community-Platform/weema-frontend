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
  getQuestionParentId,
  getQuestionText,
  type SurveyQuestionWithContext,
} from "./shared";

export function QuestionEditor(props: {
  question: SurveyQuestion;
  allQuestions: SurveyQuestionWithContext[];
  section: SurveySection;
  questionByClientId: Map<string, SurveyQuestion>;
  dependentsMap: Map<string, string[]>;
  onBackToCards: () => void;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
  onUpdate: (patch: Partial<SurveyQuestion>) => void;
  onTypeChange: (type: SurveyQuestion["questionType"]) => void;
  onDelete: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionClientId: string, patch: { text?: string; value?: string }) => void;
  onDeleteOption: (optionClientId: string) => void;
  onQuestionConfigChange: (questionConfig: SurveyQuestion["questionConfig"]) => void;
  onAddCondition: () => void;
  onAddFollowUpQuestion: () => void;
  onUpdateCondition: (
    conditionIndex: number,
    updater: (condition: ShowCondition) => ShowCondition
  ) => void;
  onDeleteCondition: (conditionIndex: number) => void;
}) {
  const parentCandidates = props.allQuestions.filter(
    (item) => item.clientId !== props.question.clientId
  );
  const dependentIds = props.dependentsMap.get(props.question.clientId) ?? [];
  const sectionQuestionIds = new Set(props.section.questions.map((item) => item.clientId));
  const parentQuestionId = getQuestionParentId(props.question, sectionQuestionIds);
  const isFollowUpQuestion = Boolean(parentQuestionId);
  const parentQuestion = parentQuestionId ? props.questionByClientId.get(parentQuestionId) : null;

  return (
    <Card className="border-primary/15">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Question editor</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={props.onBackToCards}>
            Back to cards
          </Button>
          <Button
            type="button"
            onClick={props.onSave}
            disabled={!props.canSave || props.isSaving}
          >
            {props.isSaving ? "Saving..." : "Save question"}
          </Button>
          <Button type="button" variant="destructive" onClick={props.onDelete}>
            Delete question
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <Button type="button" variant="outline" size="sm" onClick={props.onAddOption}>
                <PlusIcon className="size-3.5" />
                Add option
              </Button>
            </div>
            {props.question.options.map((option) => (
              <div key={option.clientId} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={option.text}
                  onChange={(event) =>
                    props.onUpdateOption(option.clientId, { text: event.target.value })
                  }
                  placeholder="Option label"
                  className={inputClass}
                />
                <Input
                  value={option.value ?? ""}
                  onChange={(event) =>
                    props.onUpdateOption(option.clientId, { value: event.target.value })
                  }
                  placeholder="Option value (optional)"
                  className={inputClass}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="self-center"
                  onClick={() => props.onDeleteOption(option.clientId)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {props.question.questionType === "JSON" ? (
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
                This question appears only when these conditions match.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isFollowUpQuestion ? props.onAddCondition : props.onAddFollowUpQuestion}
            >
              <PlusIcon className="size-3.5" />
              {isFollowUpQuestion ? "Add rule" : "Add follow-up question"}
            </Button>
          </div>
          {!isFollowUpQuestion ? (
            <p className="text-xs text-muted-foreground">
              Add follow-up questions from here. They will stay grouped under this parent question.
            </p>
          ) : null}
          {isFollowUpQuestion && parentQuestion ? (
            <p className="text-xs text-muted-foreground">
              Parent question:{" "}
              <span className="font-medium text-foreground wrap-break-word whitespace-normal">
                {parentQuestion.questionText || "Untitled question"}
              </span>
            </p>
          ) : null}
          {isFollowUpQuestion && props.question.showConditions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No follow-up rules. This question is always visible.
            </p>
          ) : null}
          {isFollowUpQuestion
            ? props.question.showConditions.map((condition, index) => {
                const selectedParentQuestion = parentCandidates.find(
                  (candidate) => candidate.clientId === condition.parentQuestionClientId
                );
                const parentOptions = selectedParentQuestion?.options ?? [];
                const parentIsChoice = selectedParentQuestion
                  ? isChoiceType(selectedParentQuestion.questionType)
                  : false;

                return (
                  <div
                    key={`${condition.parentQuestionClientId}-${index}`}
                    className="space-y-2 rounded-md border border-primary/10 p-2"
                  >
                    <p className="text-xs text-muted-foreground wrap-break-word whitespace-normal">
                      {describeCondition(condition, props.questionByClientId)}
                    </p>
                    <div className="grid gap-2 md:grid-cols-4">
                      <div className="flex items-center rounded-md border border-primary/10 bg-muted/40 px-2 text-xs text-muted-foreground wrap-break-word whitespace-normal">
                        {selectedParentQuestion?.questionText || "Parent question"}
                      </div>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            operator: value as ShowCondition["operator"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={condition.logicType}
                        onValueChange={(value) =>
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            logicType: value as ShowCondition["logicType"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Logic type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOGIC_TYPE_OPTIONS.map((logicType) => (
                            <SelectItem key={logicType.value} value={logicType.value}>
                              {logicType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="h-9 w-9 self-center justify-self-center"
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
                    ) : (
                      <Input
                        value={condition.expectedValue ?? ""}
                        onChange={(event) =>
                          props.onUpdateCondition(index, (prev) => ({
                            ...prev,
                            expectedValue: event.target.value,
                          }))
                        }
                        placeholder="Expected value"
                        className={inputClass}
                      />
                    )}
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
    <div className="space-y-2 rounded-lg border border-primary/10 p-3">
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
        <Input
          type="number"
          value={props.config.minRows}
          onChange={(event) =>
            props.onChange({
              ...props.config,
              minRows: Number(event.target.value || 0),
            })
          }
          placeholder="Min rows"
          className={inputClass}
        />
        <Input
          type="number"
          value={props.config.maxRows}
          onChange={(event) =>
            props.onChange({
              ...props.config,
              maxRows: Number(event.target.value || 0),
            })
          }
          placeholder="Max rows"
          className={inputClass}
        />
      </div>
      {props.config.columns.map((column) => (
        <div key={column.clientId} className="grid gap-2 md:grid-cols-[120px_1fr_160px_auto]">
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
            placeholder="key"
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
            placeholder="Column label"
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
            <SelectTrigger>
              <SelectValue />
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
            variant="destructive"
            size="icon-sm"
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
  );
}

function GridEditor(props: {
  config: Extract<SurveyQuestion["questionConfig"], { jsonType: "GRID" }>;
  onChange: (config: SurveyQuestion["questionConfig"]) => void;
}) {
  if (!props.config) return null;
  return (
    <div className="space-y-2">
      <Select
        value={props.config.selectionType}
        onValueChange={(value) =>
          props.onChange({
            ...props.config,
            selectionType: value as typeof props.config.selectionType,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Selection type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SINGLE">Single selection</SelectItem>
          <SelectItem value="MULTIPLE">Multiple selection</SelectItem>
        </SelectContent>
      </Select>

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
      {props.items.map((item) => (
        <div key={item.clientId} className="grid gap-2 md:grid-cols-[120px_1fr_auto]">
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
            placeholder="key"
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
            placeholder={`${props.label} label`}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
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
